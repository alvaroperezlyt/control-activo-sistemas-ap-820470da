import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellOff, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notificaciones")({
  head: () => ({
    meta: [
      { title: "Notificaciones | Activos TI" },
      {
        name: "description",
        content: "Avisos automáticos cuando el personal pasa a DESVINCULADO en la hoja de RRHH.",
      },
      { property: "og:title", content: "Notificaciones | Activos TI" },
      { property: "og:description", content: "Alertas de personal desvinculado con equipos pendientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notificaciones,
});

function Notificaciones() {
  const queryClient = useQueryClient();

  const { data: avisos = [] } = useQuery({
    queryKey: ["notificaciones", "todas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("id, titulo, mensaje, tipo, leida, personal_codigo, personal_nombre, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const marcar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const marcarTodas = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notificaciones").update({ leida: true }).eq("leida", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
      toast.success("Avisos marcados como leídos");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Notificaciones"
        descripcion="Se generan automáticamente cuando alguien pasa a DESVINCULADO en la hoja de RRHH."
      >
        <Button variant="outline" onClick={() => marcarTodas.mutate()} disabled={marcarTodas.isPending}>
          <Check className="size-4" />
          Marcar todas como leídas
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {avisos.length === 0 && (
          <div className="panel flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <BellOff className="size-5" />
            Sin notificaciones por ahora.
          </div>
        )}
        {avisos.map((a) => (
          <div
            key={a.id}
            className={`panel flex flex-wrap items-start justify-between gap-4 p-5 ${
              a.leida ? "opacity-60" : ""
            }`}
          >
            <div>
              <p className="label-mono">{new Date(a.created_at).toLocaleString("es-BO")}</p>
              <p className="mt-1 font-semibold">{a.titulo}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.mensaje}</p>
            </div>
            {!a.leida && (
              <Button variant="ghost" size="sm" onClick={() => marcar.mutate(a.id)}>
                Marcar leída
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
