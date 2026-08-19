import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sincronizarPersonal } from "@/lib/sync.functions";
import { TIPOS, TIPOS_LISTA, formatearFecha } from "@/lib/tipos";
import { PageHeader, EstadoBadge } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Panel | Activos TI" },
      { name: "description", content: "Resumen del inventario, asignaciones y avisos de personal desvinculado." },
      { property: "og:title", content: "Panel | Activos TI" },
      { property: "og:description", content: "Resumen del inventario y avisos pendientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const sincronizar = useServerFn(sincronizarPersonal);

  const { data: equipos = [] } = useQuery({
    queryKey: ["equipos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("equipos").select("id, tipo, estado_asignacion");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: avisos = [] } = useQuery({
    queryKey: ["notificaciones", "recientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("id, titulo, mensaje, leida, created_at")
        .order("leida", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: ultimasAsignaciones = [] } = useQuery({
    queryKey: ["asignaciones", "recientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asignaciones")
        .select("id, fecha_entrega, fecha_retorno, personal_nombre, equipos(codigo_interno, tipo)")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });

  const sync = useMutation({
    mutationFn: () => sincronizar(),
    onSuccess: (r) => {
      queryClient.invalidateQueries();
      toast.success(
        `Personal sincronizado: ${r.total} registros, ${r.desvinculados} desvinculados${r.nuevos ? `, ${r.nuevos} nuevo(s) activo(s)` : ""}.`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = equipos.length;
  const porEstado = (estado: string) => equipos.filter((e) => e.estado_asignacion === estado).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader titulo="Panel de control" descripcion="Estado general del parque informático.">
        <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
          <RefreshCw className={sync.isPending ? "size-4 animate-spin" : "size-4"} />
          Sincronizar personal
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total de equipos", valor: total },
          { label: "Asignados", valor: porEstado("ASIGNADO") },
          { label: "Libres", valor: porEstado("LIBRE") },
          { label: "De baja", valor: porEstado("BAJA") },
        ].map((k) => (
          <div key={k.label} className="panel p-5">
            <p className="label-mono">{k.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{k.valor}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h2 className="font-semibold">Inventario por tipo</h2>
          <ul className="mt-4 space-y-2">
            {TIPOS_LISTA.map((tipo) => {
              const total = equipos.filter((e) => e.tipo === tipo).length;
              const asignados = equipos.filter((e) => e.tipo === tipo && e.estado_asignacion === "ASIGNADO").length;
              const libres = equipos.filter((e) => e.tipo === tipo && e.estado_asignacion === "LIBRE").length;
              return (
                <li key={tipo} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <Link to="/equipos" search={{ tipo }} className="font-medium hover:underline">
                    {TIPOS[tipo].label}
                  </Link>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded bg-background px-1.5 py-0.5 font-mono font-medium tabular-nums" title="Total">
                      {total}
                    </span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono tabular-nums text-primary" title="Asignados">
                      A:{asignados}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono tabular-nums text-muted-foreground" title="Libres">
                      L:{libres}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Avisos recientes</h2>
            <Link to="/notificaciones" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {avisos.length === 0 && <li className="text-sm text-muted-foreground">Sin avisos.</li>}
            {avisos.map((a) => (
              <li key={a.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{a.titulo}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.mensaje}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel mt-6 p-5">
        <h2 className="font-semibold">Últimas asignaciones</h2>
        <div className="mt-4 tabla-scroll">
          <table className="w-full text-sm tabla-anclada">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted-foreground">Equipo</th>
                <th className="pb-2 font-medium text-muted-foreground">Persona</th>
                <th className="pb-2 font-medium text-muted-foreground">Fecha</th>
                <th className="pb-2 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ultimasAsignaciones.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-muted-foreground">
                    Aún no hay asignaciones registradas.
                  </td>
                </tr>
              )}
              {ultimasAsignaciones.map((a) => (
                <tr key={a.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2 font-mono">{a.equipos?.codigo_interno ?? "—"}</td>
                  <td className="py-2">{a.personal_nombre}</td>
                  <td className="py-2">{formatearFecha(a.fecha_entrega)}</td>
                  <td className="py-2">
                    <EstadoBadge estado={a.fecha_retorno ? "DEVUELTO" : "ASIGNADO"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
