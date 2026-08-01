import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIPOS, formatearFecha, type TipoEquipo } from "@/lib/tipos";
import { EstadoBadge } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

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
          <EstadoBadge estado={equipo.estado_asignacion} />
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Asignado a", equipo.personal?.nombre ?? "—"],
            ["Sucursal", equipo.almacenes ? `${equipo.almacenes.nombre} (${equipo.almacenes.lugar})` : "—"],
            ["Lugar", equipo.lugar ?? "—"],
            ["Serie", equipo.serie ?? "—"],
            ["Fecha de compra", formatearFecha(equipo.fecha_compra)],
            ["Costo", equipo.costo != null ? `Bs ${equipo.costo}` : "—"],
            ["Color", equipo.color ?? "—"],
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
        <h2 className="font-semibold">Fallas y reparaciones</h2>
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
      </div>
    </div>
  );
}
