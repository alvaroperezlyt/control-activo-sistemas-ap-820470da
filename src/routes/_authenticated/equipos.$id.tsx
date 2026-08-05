import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plus, Ban, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIPOS, formatearFecha, type TipoEquipo } from "@/lib/tipos";
import { EstadoBadge } from "@/components/PageHeader";
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

export const Route = createFileRoute("/_authenticated/equipos/$id")({
  head: () => ({
    meta: [
      { title: "Historial del equipo | Activos TI" },
      { name: "description", content: "Ficha técnica, asignaciones y fallas registradas del equipo." },
      { property: "og:title", content: "Historial del equipo | Activos TI" },
      { property: "og:description", content: "Historial de vida completo del activo informático." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DetalleEquipo,
});

function DetalleEquipo() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [nuevaFalla, setNuevaFalla] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [reportadoPor, setReportadoPor] = useState("");
  const [fechaFalla, setFechaFalla] = useState(() => new Date().toISOString().slice(0, 10));
  const [dialogoBaja, setDialogoBaja] = useState(false);
  const [fechaBaja, setFechaBaja] = useState(() => new Date().toISOString().slice(0, 10));
  const [motivoBaja, setMotivoBaja] = useState("");

  const crearFalla = useMutation({
    mutationFn: async () => {
      if (!descripcion.trim()) throw new Error("Describe la falla.");
      const { error } = await supabase.from("fallas").insert({
        equipo_id: id,
        descripcion: descripcion.trim(),
        reportado_por: reportadoPor.trim() || "—",
        fecha: fechaFalla,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fallas"] });
      toast.success("Falla registrada");
      setNuevaFalla(false);
      setDescripcion("");
      setReportadoPor("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const darDeBaja = useMutation({
    mutationFn: async () => {
      if (!motivoBaja.trim()) throw new Error("Indica el motivo de la baja.");
      if (!fechaBaja) throw new Error("Indica la fecha de la baja.");
      const ultimoAsignado = equipo?.personal?.nombre ?? asignaciones.find((a) => !a.fecha_retorno)?.personal_nombre ?? null;

      const { error } = await supabase
        .from("equipos")
        .update({
          estado_asignacion: "BAJA",
          fecha_baja: fechaBaja,
          motivo_baja: motivoBaja.trim(),
          baja_personal_nombre: ultimoAsignado,
          personal_codigo: null,
        })
        .eq("id", id);
      if (error) throw error;

      const { error: errorAsig } = await supabase
        .from("asignaciones")
        .update({ fecha_retorno: fechaBaja })
        .eq("equipo_id", id)
        .is("fecha_retorno", null);
      if (errorAsig) throw errorAsig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      queryClient.invalidateQueries({ queryKey: ["asignaciones"] });
      toast.success("Equipo dado de baja");
      setDialogoBaja(false);
      setMotivoBaja("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reactivar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("equipos")
        .update({ estado_asignacion: "LIBRE", fecha_baja: null, motivo_baja: null, baja_personal_nombre: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast.success("Equipo reactivado como LIBRE");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const { data: equipo, isLoading } = useQuery({
    queryKey: ["equipos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipos")
        .select("*, personal(nombre, estado), almacenes(nombre, lugar)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: asignaciones = [] } = useQuery({
    queryKey: ["asignaciones", "equipo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asignaciones")
        .select("id, personal_nombre, fecha_entrega, fecha_retorno, observaciones")
        .eq("equipo_id", id)
        .order("fecha_entrega", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: fallas = [] } = useQuery({
    queryKey: ["fallas", "equipo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fallas")
        .select("id, fecha, descripcion, estado, reportado_por, reparaciones(id, fecha, descripcion, proveedor, costo, factura)")
        .eq("equipo_id", id)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!equipo) return <p className="text-sm text-muted-foreground">Equipo no encontrado.</p>;

  const config = TIPOS[equipo.tipo as TipoEquipo];
  const datos = (equipo.datos ?? {}) as Record<string, string | null>;

  return (
    <div className="mx-auto max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/equipos">
          <ArrowLeft className="size-4" />
          Volver a equipos
        </Link>
      </Button>

      <div className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-mono">{config?.labelSingular ?? equipo.tipo}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold">{equipo.codigo_interno}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {[equipo.marca, equipo.modelo].filter(Boolean).join(" ") || "Sin marca registrada"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge estado={equipo.estado_asignacion} />
            {equipo.estado_asignacion === "BAJA" ? (
              <Button variant="outline" size="sm" onClick={() => reactivar.mutate()} disabled={reactivar.isPending}>
                <RotateCcw className="size-4" />
                Reactivar
              </Button>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setDialogoBaja(true)}>
                <Ban className="size-4" />
                Dar de baja
              </Button>
            )}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Asignado a", equipo.personal?.nombre ?? "—"],
            ["Sucursal/Línea de Negocio", equipo.almacenes ? `${equipo.almacenes.nombre} (${equipo.almacenes.lugar})` : "—"],
            ["Lugar", equipo.lugar ?? "—"],
            ["Serie", equipo.serie ?? "—"],
            ["Fecha de compra", formatearFecha(equipo.fecha_compra)],
            ["Costo", equipo.costo != null ? `Bs ${equipo.costo}` : "—"],
            ["Color", equipo.color ?? "—"],
            ...(equipo.estado_asignacion === "BAJA"
              ? ([
                  ["Fecha de baja", formatearFecha(equipo.fecha_baja)],
                  ["Motivo de baja", equipo.motivo_baja ?? "—"],
                  ["Último asignado", equipo.baja_personal_nombre ?? "—"],
                ] as [string, string][])
              : []),
            ...(config?.campos ?? [])
              .filter((c) => !c.base)
              .map((c) => [c.label, datos[c.key] ?? "—"] as [string, string]),

          ].map(([label, valor]) => (
            <div key={label as string}>
              <dt className="label-mono">{label}</dt>
              <dd className="mt-1 text-sm">{valor}</dd>
            </div>
          ))}
        </dl>

        {equipo.observaciones && (
          <p className="mt-6 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{equipo.observaciones}</p>
        )}
      </div>

      <div className="panel mt-6 p-6">
        <h2 className="font-semibold">Historial de asignaciones</h2>
        <ul className="mt-4 space-y-3">
          {asignaciones.length === 0 && <li className="text-sm text-muted-foreground">Sin asignaciones.</li>}
          {asignaciones.map((a) => (
            <li key={a.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{a.personal_nombre}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatearFecha(a.fecha_entrega)} → {a.fecha_retorno ? formatearFecha(a.fecha_retorno) : "vigente"}
                </span>
              </div>
              {a.observaciones && <p className="mt-1 text-muted-foreground">{a.observaciones}</p>}
            </li>
          ))}
        </ul>
      </div>

      <div className="panel mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Fallas y reparaciones</h2>
          <Button size="sm" onClick={() => setNuevaFalla(true)}>
            <Plus className="size-4" />
            Registrar falla
          </Button>
        </div>
        <ul className="mt-4 space-y-3">
          {fallas.length === 0 && <li className="text-sm text-muted-foreground">Sin fallas registradas.</li>}
          {fallas.map((f) => (
            <li key={f.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{f.descripcion}</span>
                <EstadoBadge estado={f.estado} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatearFecha(f.fecha)} · reportado por {f.reportado_por}
              </p>
              {f.reparaciones.map((r) => (
                <p key={r.id} className="mt-2 text-muted-foreground">
                  {formatearFecha(r.fecha)} — {r.descripcion} · {r.proveedor ?? "sin proveedor"} ·{" "}
                  {r.costo != null ? `Bs ${r.costo}` : "sin costo"} · {r.factura ? `Fact. ${r.factura}` : "sin factura"}
                </p>
              ))}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Las reparaciones se registran desde el módulo{" "}
          <Link to="/fallas" className="underline">
            Fallas y reparaciones
          </Link>
          .
        </p>
      </div>

      <Dialog open={nuevaFalla} onOpenChange={setNuevaFalla}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar falla</DialogTitle>
            <DialogDescription>
              Equipo {equipo.codigo_interno} · {[equipo.marca, equipo.modelo].filter(Boolean).join(" ") || "sin marca"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fdesc">Descripción de la falla</Label>
              <Textarea
                id="fdesc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={1000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="frep">Reportado por</Label>
                <Input
                  id="frep"
                  value={reportadoPor}
                  onChange={(e) => setReportadoPor(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ffecha">Fecha</Label>
                <Input id="ffecha" type="date" value={fechaFalla} onChange={(e) => setFechaFalla(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNuevaFalla(false)}>
              Cancelar
            </Button>
            <Button onClick={() => crearFalla.mutate()} disabled={crearFalla.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogoBaja} onOpenChange={setDialogoBaja}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de baja el equipo</DialogTitle>
            <DialogDescription>
              {equipo.codigo_interno} · último asignado:{" "}
              {equipo.personal?.nombre ?? asignaciones.find((a) => !a.fecha_retorno)?.personal_nombre ?? "sin asignación"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bfecha">Fecha de baja</Label>
              <Input id="bfecha" type="date" value={fechaBaja} onChange={(e) => setFechaBaja(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bmotivo">Motivo de la baja</Label>
              <Textarea
                id="bmotivo"
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                placeholder="Pérdida, robo, obsolescencia, daño irreparable…"
                maxLength={1000}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Se cerrará la asignación vigente con esta fecha y quedará registrado en el historial.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoBaja(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => darDeBaja.mutate()} disabled={darDeBaja.isPending}>
              Confirmar baja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
