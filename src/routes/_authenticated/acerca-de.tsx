import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useEsAdmin } from "@/hooks/useEsAdmin";

export const VERSION_SISTEMA = "1.0.0";

export const Route = createFileRoute("/_authenticated/acerca-de")({
  head: () => ({
    meta: [
      { title: "Acerca de | Activos TI" },
      {
        name: "description",
        content:
          "Identificación del sistema de activos informáticos: código interno, versión, año y datos de referencia.",
      },
      { property: "og:title", content: "Acerca de | Activos TI" },
      { property: "og:description", content: "Código interno, versión y datos del sistema de activos TI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AcercaDe,
});

function AcercaDe() {
  const { esAdmin } = useEsAdmin();
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState("");

  const { data: valor = "", isLoading } = useQuery({
    queryKey: ["ajustes", "acerca_de"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ajustes")
        .select("valor")
        .eq("clave", "acerca_de")
        .maybeSingle();
      if (error) throw error;
      return data?.valor ?? "";
    },
  });

  useEffect(() => {
    setTexto(valor);
  }, [valor]);

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("ajustes")
        .upsert({ clave: "acerca_de", valor: texto }, { onConflict: "clave" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Información guardada");
      queryClient.invalidateQueries({ queryKey: ["ajustes", "acerca_de"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        titulo="Acerca de"
        descripcion="Identificación del sistema: código interno, versión, año y notas de referencia."
      />

      <div className="panel p-5">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="label-mono">Sistema</dt>
            <dd className="mt-1 text-sm font-medium">Activos TI · Registro y control</dd>
          </div>
          <div>
            <dt className="label-mono">Versión</dt>
            <dd className="mt-1 text-sm font-medium">{VERSION_SISTEMA}</dd>
          </div>
          <div>
            <dt className="label-mono">Año</dt>
            <dd className="mt-1 text-sm font-medium">{new Date().getFullYear()}</dd>
          </div>
        </dl>
      </div>

      <div className="panel mt-4 p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-md bg-secondary p-2 text-secondary-foreground">
            <Info className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Texto libre de identificación</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Código interno del documento (por ejemplo SI-P1-F3), responsable, versión institucional y cualquier
              otra nota que sirva para identificar al sistema.
            </p>

            {esAdmin ? (
              <>
                <Textarea
                  className="mt-3 min-h-40"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={"SI-P1-F3\nSistema de registro y control de activos informáticos\nAño: 2026"}
                  disabled={isLoading}
                />
                <Button
                  className="mt-3"
                  onClick={() => guardar.mutate()}
                  disabled={guardar.isPending || isLoading}
                >
                  <Save className="size-4" />
                  Guardar
                </Button>
              </>
            ) : (
              <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                {texto || "Sin información registrada."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
