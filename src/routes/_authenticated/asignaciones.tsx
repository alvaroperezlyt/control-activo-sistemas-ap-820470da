import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Pencil, Plus, RefreshCw } from "lucide-react";
import { copiarTexto, textoAsignacion } from "@/lib/texto-rrhh";
import { useServerFn } from "@tanstack/react-start";
import { sincronizarActivos } from "@/lib/sync.functions";
import { supabase } from "@/integrations/supabase/client";
import { TIPOS, formatearFecha, type TipoEquipo } from "@/lib/tipos";
import { PageHeader, EstadoBadge } from "@/components/PageHeader";
import { PersonalSelect, type PersonaRow } from "@/components/PersonalSelect";
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

export const Route = createFileRoute("/_authenticated/asignaciones")({
  head: () => ({
    meta: [
      { title: "Asignaciones | Activos TI" },
      { name: "description", content: "Asignación de equipos al personal y control de entregas vigentes." },
      { property: "og:title", content: "Asignaciones | Activos TI" },
      { property: "og:description", content: "Entrega equipos al personal y consulta el historial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Asignaciones,
});

function Asignaciones() {
  const queryClient = useQueryClient();
  const syncActivos = useServerFn(sincronizarActivos);
  const manual = useMutation({
    mutationFn: () => syncActivos(),
    onSuccess: (r) => toast.success(`Sheets actualizado · ${r.equipos} equipos · ${r.lineas} líneas`),
    onError: (e: Error) => toast.error(e.message),
  });
  const [abierto, setAbierto] = useState(false);
  const [persona, setPersona] = useState<PersonaRow | null>(null);
  const [equipoId, setEquipoId] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState("");
  const [filtroPersona, setFiltroPersona] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ id: string; entrega: string; retorno: string } | null>(null);

  const { data: libres = [] } = useQuery({
    queryKey: ["equipos", "libres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipos")
        .select("id, codigo_interno, tipo, marca, modelo")
        .eq("estado_asignacion", "LIBRE")
        .order("codigo_interno");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: asignaciones = [] } = useQuery({
    queryKey: ["asignaciones", "lista", filtroPersona],
    queryFn: async () => {
      let q = supabase
        .from("asignaciones")
        .select(
          "id, fecha_entrega, fecha_retorno, personal_codigo, personal_nombre, observaciones, equipos(id, codigo_interno, tipo, marca, modelo, serie, color, datos)",
        )
        .order("fecha_entrega", { ascending: false });
      if (filtroPersona) q = q.eq("personal_codigo", filtroPersona);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const guardarFechas = useMutation({
    mutationFn: async () => {
      if (!editando) return;
      if (!editando.entrega) throw new Error("La fecha de entrega es obligatoria.");
      if (editando.retorno && editando.retorno < editando.entrega)
        throw new Error("La devolución no puede ser anterior a la entrega.");
      const { error } = await supabase
        .from("asignaciones")
        .update({
          fecha_entrega: editando.entrega,
          fecha_retorno: editando.retorno || null,
        })
        .eq("id", editando.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Fechas actualizadas");
      setEditando(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const asignar = useMutation({
    mutationFn: async () => {
      if (!persona || !equipoId) throw new Error("Selecciona persona y equipo.");
      const { error } = await supabase.from("asignaciones").insert({
        equipo_id: equipoId,
        personal_codigo: persona.codigo,
        personal_nombre: persona.nombre,
        fecha_entrega: fecha,
        observaciones: observaciones.trim() || null,
      });
      if (error) throw error;
      const { error: errEquipo } = await supabase
        .from("equipos")
        .update({ estado_asignacion: "ASIGNADO", personal_codigo: persona.codigo })
        .eq("id", equipoId);
      if (errEquipo) throw errEquipo;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries();
      syncActivos().catch((e: Error) => toast.error(`Sheets de activos: ${e.message}`));
      if (persona) {
        const { data } = await supabase
          .from("equipos")
          .select("codigo_interno, tipo, marca, modelo, serie, color, datos")
          .eq("personal_codigo", persona.codigo)
          .eq("estado_asignacion", "ASIGNADO");
        try {
          await copiarTexto(textoAsignacion(persona.nombre, persona.codigo, data ?? [], fecha));
          toast.success("Equipo asignado · texto RRHH copiado");
        } catch {
          toast.success("Equipo asignado");
        }
      }
      setAbierto(false);
      setPersona(null);
      setEquipoId("");
      setObservaciones("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grupos = useMemo(() => {
    const mapa = new Map<
      string,
      { codigo: string | null; nombre: string; items: typeof asignaciones; ultima: string }
    >();
    for (const a of asignaciones) {
      const clave = a.personal_codigo ?? a.personal_nombre;
      const actual = mapa.get(clave);
      if (actual) {
        actual.items.push(a);
        if (a.fecha_entrega > actual.ultima) actual.ultima = a.fecha_entrega;
      } else {
        mapa.set(clave, {
          codigo: a.personal_codigo,
          nombre: a.personal_nombre,
          items: [a],
          ultima: a.fecha_entrega,
        });
      }
    }
    const lista = [...mapa.values()];
    lista.sort((x, y) => (x.ultima < y.ultima ? 1 : x.ultima > y.ultima ? -1 : 0));
    for (const g of lista) g.items.sort((p, q) => (p.fecha_entrega < q.fecha_entrega ? 1 : -1));
    return lista;
  }, [asignaciones]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader titulo="Asignaciones" descripcion="Entrega de equipos al personal activo.">
        <Button variant="outline" onClick={() => manual.mutate()} disabled={manual.isPending}>
          <RefreshCw className={manual.isPending ? "size-4 animate-spin" : "size-4"} />
          Sincronizar Sheets
        </Button>
        <Button onClick={() => setAbierto(true)}>
          <Plus className="size-4" />
          Asignar equipo
        </Button>
      </PageHeader>

      <div className="panel mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-64 flex-1 space-y-2">
          <Label>Filtrar por persona</Label>
          <PersonalSelect
            value={filtroPersona}
            soloActivos
            onChange={(codigo) => setFiltroPersona(codigo)}
            placeholder="Todas las personas…"
          />
        </div>
        {filtroPersona && (
          <Button variant="outline" onClick={() => setFiltroPersona(null)}>
            Limpiar filtro
          </Button>
        )}
      </div>

      {grupos.length === 0 && (
        <div className="panel p-6 text-sm text-muted-foreground">Sin asignaciones registradas.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {grupos.map((g) => {
          const vigentes = g.items.filter((i) => !i.fecha_retorno).length;
          const copiar = async () => {
            const eqs = g.items.filter((i) => !i.fecha_retorno && i.equipos).map((i) => i.equipos!);
            if (eqs.length === 0) return toast.error("Sin equipos vigentes para esta persona.");
            try {
              await copiarTexto(textoAsignacion(g.nombre, g.codigo, eqs, g.ultima));
              toast.success("Texto RRHH copiado");
            } catch {
              toast.error("No se pudo copiar al portapapeles");
            }
          };
          return (
            <div key={g.codigo ?? g.nombre} className="panel p-4">
              <div className="mb-3 flex items-start justify-between gap-2 border-b border-border pb-2">
                <div>
                  <h3 className="font-medium">{g.nombre}</h3>
                  <p className="text-xs text-muted-foreground">
                    {g.codigo ? `${g.codigo} · ` : ""}
                    {vigentes} vigente(s) de {g.items.length}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    Última: {formatearFecha(g.ultima)}
                  </span>
                  <Button variant="outline" size="sm" onClick={copiar}>
                    <Copy className="size-4" />
                    Copiar texto RRHH
                  </Button>
                </div>
              </div>
              <ul className="space-y-2">
                {g.items.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {a.equipos ? (
                          <Link
                            to="/equipos/$id"
                            params={{ id: a.equipos.id }}
                            className="font-mono hover:underline"
                          >
                            {a.equipos.codigo_interno}
                          </Link>
                        ) : (
                          <span className="font-mono">—</span>
                        )}
                        <EstadoBadge estado={a.fecha_retorno ? "DEVUELTO" : "ASIGNADO"} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.equipos
                          ? (TIPOS[a.equipos.tipo as TipoEquipo]?.labelSingular ?? a.equipos.tipo)
                          : "—"}{" "}
                        · {formatearFecha(a.fecha_entrega)}
                        {a.fecha_retorno ? ` → ${formatearFecha(a.fecha_retorno)}` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditando({
                          id: a.id,
                          entrega: a.fecha_entrega,
                          retorno: a.fecha_retorno ?? "",
                        })
                      }
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>


      <Dialog open={editando !== null} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar fechas de la asignación</DialogTitle>
            <DialogDescription>Corrige la fecha de entrega o de devolución.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-entrega">Fecha de entrega</Label>
              <Input
                id="edit-entrega"
                type="date"
                value={editando?.entrega ?? ""}
                onChange={(e) => setEditando((prev) => (prev ? { ...prev, entrega: e.target.value } : prev))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-retorno">Fecha de devolución (opcional)</Label>
              <Input
                id="edit-retorno"
                type="date"
                value={editando?.retorno ?? ""}
                onChange={(e) => setEditando((prev) => (prev ? { ...prev, retorno: e.target.value } : prev))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={() => guardarFechas.mutate()} disabled={guardarFechas.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar equipo</DialogTitle>
            <DialogDescription>Solo se listan equipos con estado LIBRE.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Persona</Label>
              <PersonalSelect
                value={persona?.codigo ?? null}
                soloActivos
                onChange={(_, p) => setPersona(p)}
              />
            </div>
            <div className="space-y-2">
              <Label>Equipo</Label>
              <Select value={equipoId} onValueChange={setEquipoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar equipo libre…" />
                </SelectTrigger>
                <SelectContent>
                  {libres.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.codigo_interno} · {[e.marca, e.modelo].filter(Boolean).join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de entrega</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observaciones</Label>
              <Textarea
                id="obs"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => asignar.mutate()} disabled={asignar.isPending}>
              Asignar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
