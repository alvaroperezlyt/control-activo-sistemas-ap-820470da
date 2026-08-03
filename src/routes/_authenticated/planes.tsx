import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, FileDown, Plus, Trash2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CONFIG_PLAN,
  MESES,
  distribuir,
  fechaLarga,
  iso,
  textoRango,
  ultimoDiaMesISO,
  type EquipoPlan,
  type ItemPlan,
  type TipoPlan,
  type Turno,
} from "@/lib/planes";

import { generarPlanPDF } from "@/lib/plan-pdf";

export const Route = createFileRoute("/_authenticated/planes")({
  head: () => ({
    meta: [
      { title: "Planes de respaldo y mantenimiento | Activos TI" },
      {
        name: "description",
        content:
          "Genera los planes de respaldo de información y de mantenimiento técnico preventivo distribuyendo las computadoras asignadas por día.",
      },
      { property: "og:title", content: "Planes de respaldo y mantenimiento | Activos TI" },
      {
        property: "og:description",
        content: "Planificación mensual de respaldos y mantenimientos preventivos con exportación a PDF.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Planes,
});

type PlanRow = {
  id: string;
  tipo: TipoPlan;
  anio: number;
  mes: number;
  numero: number;
  fecha_elaboracion: string;
  fecha_realizacion: string;
  fecha_inicio: string;
  fecha_fin: string;

  objetivo: string;
  alcance: string;
  recursos: string;
  nota: string | null;
  elabora: string;
  autoriza: string;
};

type ItemRow = ItemPlan & { id: string };

function Planes() {
  const queryClient = useQueryClient();
  const hoy = new Date();
  const [creando, setCreando] = useState(false);
  const [tipo, setTipo] = useState<TipoPlan>("RESPALDO");
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [numero, setNumero] = useState(1);
  const [realizacion, setRealizacion] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  const [feriadoFecha, setFeriadoFecha] = useState("");
  const [feriadoDesc, setFeriadoDesc] = useState("");

  const { data: planes = [] } = useQuery({
    queryKey: ["planes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planes")
        .select("*")
        .order("anio", { ascending: false })
        .order("mes", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PlanRow[];
    },
  });

  const { data: feriados = [] } = useQuery({
    queryKey: ["feriados"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feriados").select("id, fecha, descripcion").order("fecha");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: computadoras = [] } = useQuery({
    queryKey: ["planes", "computadoras-asignadas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipos")
        .select("id, codigo_interno, personal(nombre), almacenes(nombre, lugar)")
        .eq("tipo", "COMPUTADORA")
        .eq("estado_asignacion", "ASIGNADO");
      if (error) throw error;
      return (data ?? [])
        .map<EquipoPlan>((e) => ({
          equipo_id: e.id,
          codigo_interno: e.codigo_interno,
          personal_nombre: e.personal?.nombre ?? "—",
          sucursal_nombre: e.almacenes?.nombre ?? null,
          lugar: e.almacenes?.lugar ?? null,
        }))
        .sort((a, b) => (a.lugar ?? "").localeCompare(b.lugar ?? "") || a.personal_nombre.localeCompare(b.personal_nombre));
    },
  });

  const feriadosDelMes = useMemo(
    () => feriados.filter((f) => f.fecha.startsWith(`${anio}-${String(mes).padStart(2, "0")}`)).map((f) => f.fecha),
    [feriados, anio, mes],
  );

  const previa = useMemo(
    () => distribuir(computadoras, anio, mes, feriadosDelMes),
    [computadoras, anio, mes, feriadosDelMes],
  );

  const crear = useMutation({
    mutationFn: async () => {
      const cfg = CONFIG_PLAN[tipo];
      const { data: plan, error } = await supabase
        .from("planes")
        .insert({
          tipo,
          anio,
          mes,
          numero,
          fecha_realizacion: realizacion || `${MESES[mes - 1]} ${anio}`,
          objetivo: cfg.objetivo,
          alcance: cfg.alcance,
          recursos: cfg.recursos,
          nota: cfg.nota,
        })
        .select("id")
        .single();
      if (error) throw error;
      const items = distribuir(computadoras, desde, hasta, feriadosRango);
      if (items.length > 0) {
        const { error: e2 } = await supabase.from("plan_items").insert(
          items.map((i) => ({
            plan_id: plan.id,
            equipo_id: i.equipo_id,
            codigo_interno: i.codigo_interno,
            personal_nombre: i.personal_nombre,
            sucursal_nombre: i.sucursal_nombre,
            lugar: i.lugar,
            fecha: i.fecha,
            turno: i.turno,
            orden: i.orden,
          })),
        );
        if (e2) throw e2;
      }
      return plan.id as string;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["planes"] });
      setCreando(false);
      setAbierto(id);
      toast.success("Plan generado. Revisa y ajusta antes de exportar.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const borrarPlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planes"] });
      toast.success("Plan eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const guardarFeriado = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("feriados").insert({ fecha: feriadoFecha, descripcion: feriadoDesc });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feriados"] });
      setFeriadoFecha("");
      setFeriadoDesc("");
      toast.success("Feriado registrado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const borrarFeriado = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feriados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feriados"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const mesesSugeridos = CONFIG_PLAN[tipo].meses;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        titulo="Planes de respaldo y mantenimiento"
        descripcion="Distribuye las computadoras asignadas por día hábil y exporta el plan en PDF."
      >
        <Button onClick={() => setCreando(true)}>
          <Plus className="size-4" />
          Nuevo plan
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="panel p-4">
          <h2 className="font-semibold">Planes generados</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Tipo</th>
                  <th className="pb-2 font-medium text-muted-foreground">Periodo</th>
                  <th className="pb-2 font-medium text-muted-foreground">N°</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {planes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-muted-foreground">
                      Aún no hay planes. Usa “Nuevo plan”.
                    </td>
                  </tr>
                )}
                {planes.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2">{p.tipo === "RESPALDO" ? "Respaldo" : "Mantenimiento"}</td>
                    <td className="py-2">
                      {MESES[p.mes - 1]} {p.anio}
                    </td>
                    <td className="py-2 font-mono">
                      {p.numero}/{p.anio}
                    </td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setAbierto(p.id)}>
                        Abrir
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => borrarPlan.mutate(p.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarDays className="size-4 text-primary" />
            Feriados
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Los feriados y los domingos se excluyen de la planificación.
          </p>
          <div className="mt-3 space-y-2">
            <Input type="date" value={feriadoFecha} onChange={(e) => setFeriadoFecha(e.target.value)} />
            <Input
              value={feriadoDesc}
              onChange={(e) => setFeriadoDesc(e.target.value)}
              placeholder="Descripción (ej. Día del trabajo)"
            />
            <Button
              variant="outline"
              className="w-full"
              disabled={!feriadoFecha || !feriadoDesc || guardarFeriado.isPending}
              onClick={() => guardarFeriado.mutate()}
            >
              Agregar feriado
            </Button>
          </div>
          <ul className="mt-4 space-y-1 text-sm">
            {feriados.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 border-b border-border/60 py-1">
                <span>
                  <span className="font-mono text-xs">{f.fecha}</span> · {f.descripcion}
                </span>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => borrarFeriado.mutate(f.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
            {feriados.length === 0 && <li className="text-muted-foreground">Sin feriados registrados.</li>}
          </ul>
        </div>
      </div>

      {/* Crear plan */}
      <Dialog open={creando} onOpenChange={setCreando}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo plan</DialogTitle>
            <DialogDescription>
              Se reparten las {computadoras.length} computadoras asignadas entre los días hábiles del mes (sábados solo 2).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Tipo de plan</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoPlan)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESPALDO">Respaldo de información (cada 2 meses)</SelectItem>
                  <SelectItem value="MANTENIMIENTO">Mantenimiento preventivo (mayo y noviembre)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Mes</Label>
                <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>
                        {m}
                        {mesesSugeridos.includes(i + 1) ? " ✓" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Año</Label>
                <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} />
              </div>
              <div className="grid gap-1.5">
                <Label>N° de plan</Label>
                <Input type="number" value={numero} onChange={(e) => setNumero(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Fecha de realización (texto)</Label>
              <Input
                value={realizacion}
                onChange={(e) => setRealizacion(e.target.value)}
                placeholder={`${MESES[mes - 1]} ${anio}`}
              />
            </div>
            {!mesesSugeridos.includes(mes) && (
              <p className="text-xs text-muted-foreground">
                Nota: este tipo de plan normalmente corresponde a {mesesSugeridos.map((m) => MESES[m - 1]).join(", ")}.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {previa.length} equipos programados · {new Set(previa.map((p) => p.fecha)).size} días utilizados ·{" "}
              {feriadosDelMes.length} feriados en el mes
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreando(false)}>
              Cancelar
            </Button>
            <Button onClick={() => crear.mutate()} disabled={crear.isPending || computadoras.length === 0}>
              <Wand2 className="size-4" />
              Generar plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {abierto && <DetallePlan id={abierto} onClose={() => setAbierto(null)} />}
    </div>
  );
}

function DetallePlan({ id, onClose }: { id: string; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["planes", id],
    queryFn: async () => {
      const [{ data: plan, error }, { data: items, error: e2 }] = await Promise.all([
        supabase.from("planes").select("*").eq("id", id).single(),
        supabase.from("plan_items").select("*").eq("plan_id", id).order("orden"),
      ]);
      if (error) throw error;
      if (e2) throw e2;
      const { data: fer } = await supabase.from("feriados").select("fecha");
      return {
        plan: plan as PlanRow,
        items: (items ?? []) as unknown as ItemRow[],
        feriados: (fer ?? []).map((f) => f.fecha),
      };
    },
  });

  const actualizar = useMutation({
    mutationFn: async (payload: { itemId: string; fecha?: string; turno?: Turno }) => {
      const { itemId, ...campos } = payload;
      const { error } = await supabase.from("plan_items").update(campos).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planes", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const guardarTexto = useMutation({
    mutationFn: async (campos: Partial<PlanRow>) => {
      const { error } = await supabase.from("planes").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planes"] });
      toast.success("Plan actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const plan = data?.plan;
  const items = data?.items ?? [];
  const min = plan ? iso(plan.anio, plan.mes, 1) : "";
  const max = plan ? iso(plan.anio, plan.mes, new Date(plan.anio, plan.mes, 0).getDate()) : "";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? `${plan.tipo === "RESPALDO" ? "Plan de respaldo" : "Plan de mantenimiento"} · ${MESES[plan.mes - 1]} ${plan.anio}` : "Cargando…"}
          </DialogTitle>
          <DialogDescription>Ajusta fechas y turnos antes de exportar el PDF.</DialogDescription>
        </DialogHeader>

        {plan && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Fecha de realización</Label>
                <Input
                  defaultValue={plan.fecha_realizacion}
                  onBlur={(e) => guardarTexto.mutate({ fecha_realizacion: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Elabora / Autoriza</Label>
                <div className="flex gap-2">
                  <Input defaultValue={plan.elabora} onBlur={(e) => guardarTexto.mutate({ elabora: e.target.value })} />
                  <Input defaultValue={plan.autoriza} onBlur={(e) => guardarTexto.mutate({ autoriza: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>Objetivo</Label>
                <Textarea
                  defaultValue={plan.objetivo}
                  rows={3}
                  onBlur={(e) => guardarTexto.mutate({ objetivo: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>Recursos</Label>
                <Textarea
                  defaultValue={plan.recursos}
                  rows={2}
                  onBlur={(e) => guardarTexto.mutate({ recursos: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-muted-foreground">#</th>
                    <th className="pb-2 font-medium text-muted-foreground">Responsable</th>
                    <th className="pb-2 font-medium text-muted-foreground">Equipo</th>
                    <th className="pb-2 font-medium text-muted-foreground">Sucursal</th>
                    <th className="pb-2 font-medium text-muted-foreground">Fecha</th>
                    <th className="pb-2 font-medium text-muted-foreground">Turno</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={it.id} className="border-b border-border/60 last:border-0">
                      <td className="py-1.5 font-mono text-xs">{i + 1}</td>
                      <td className="py-1.5">{it.personal_nombre}</td>
                      <td className="py-1.5 font-mono text-xs">{it.codigo_interno}</td>
                      <td className="py-1.5 text-muted-foreground">{it.sucursal_nombre ?? "—"}</td>
                      <td className="py-1.5">
                        <Input
                          type="date"
                          className="h-8 w-36"
                          min={min}
                          max={max}
                          defaultValue={it.fecha}
                          onChange={(e) =>
                            e.target.value && actualizar.mutate({ itemId: it.id, fecha: e.target.value })
                          }
                        />
                      </td>
                      <td className="py-1.5">
                        <Select
                          value={it.turno}
                          onValueChange={(v) => actualizar.mutate({ itemId: it.id, turno: v as Turno })}
                        >
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANANA">MAÑANA</SelectItem>
                            <SelectItem value="TARDE">TARDE</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Elaborado el {fechaLarga(plan.fecha_elaboracion)} · {items.length} equipos
            </p>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            disabled={!plan}
            onClick={() =>
              plan &&
              generarPlanPDF(
                plan,
                items
                  .slice()
                  .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.orden - b.orden)
                  .map((i) => ({
                    equipo_id: i.equipo_id,
                    codigo_interno: i.codigo_interno,
                    personal_nombre: i.personal_nombre,
                    sucursal_nombre: i.sucursal_nombre,
                    lugar: i.lugar,
                    fecha: i.fecha,
                    turno: i.turno,
                    orden: i.orden,
                  })),
                data?.feriados ?? [],
              )
            }
          >
            <FileDown className="size-4" />
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
