import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatearFecha } from "@/lib/tipos";
import { PageHeader } from "@/components/PageHeader";
import { RecepcionDialog } from "@/components/RecepcionDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ETIQUETAS: Record<string, string> = {
  CELULAR: "Celular",
  LINEA: "Línea corporativa",
  LAPTOP: "Laptop",
  ESCRITORIO: "Escritorio",
  GENERICO: "Equipo",
};

type RecepcionRow = {
  id: string;
  fecha: string;
  tipo: string;
  formulario: string | null;
  revisor: string | null;
  personal_nombre: string | null;
  observaciones: string | null;
  respuestas: unknown;
  fotos: unknown;
};

export const Route = createFileRoute("/_authenticated/recepciones")({
  head: () => ({
    meta: [
      { title: "Recepciones | Activos TI" },
      {
        name: "description",
        content: "Formularios de recepción de celulares, líneas, laptops y equipos de escritorio con fotografías.",
      },
      { property: "og:title", content: "Recepciones | Activos TI" },
      {
        property: "og:description",
        content: "Checklists de devolución por tipo de activo, con carga de fotografías.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Recepciones,
});

function Recepciones() {
  const [abierto, setAbierto] = useState(false);
  const [detalle, setDetalle] = useState<RecepcionRow | null>(null);

  const { data: recepciones = [] } = useQuery({
    queryKey: ["recepciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recepciones")
        .select("id, fecha, tipo, formulario, revisor, personal_nombre, observaciones, respuestas, fotos")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RecepcionRow[];
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        titulo="Recepciones"
        descripcion="El formulario se adapta al tipo de activo registrado: celular, línea corporativa, laptop o escritorio."
      >
        <Button onClick={() => setAbierto(true)}>
          <Plus className="size-4" />
          Nueva recepción
        </Button>
      </PageHeader>

      <div className="panel overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 font-medium text-muted-foreground">Fecha</th>
              <th className="pb-2 font-medium text-muted-foreground">Colaborador</th>
              <th className="pb-2 font-medium text-muted-foreground">Formulario</th>
              <th className="pb-2 font-medium text-muted-foreground">Revisor</th>
              <th className="pb-2 font-medium text-muted-foreground">Fotos</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {recepciones.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-muted-foreground">
                  Sin recepciones registradas.
                </td>
              </tr>
            )}
            {recepciones.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="py-2">{formatearFecha(r.fecha)}</td>
                <td className="py-2">{r.personal_nombre ?? "—"}</td>
                <td className="py-2">{ETIQUETAS[r.formulario ?? ""] ?? r.tipo}</td>
                <td className="py-2">{r.revisor ?? "—"}</td>
                <td className="py-2 text-muted-foreground">
                  {Array.isArray(r.fotos) ? r.fotos.length : 0}
                </td>
                <td className="py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDetalle(r)}>
                    Ver detalle
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RecepcionDialog abierto={abierto} onOpenChange={setAbierto} />
      <DetalleDialog recepcion={detalle} onClose={() => setDetalle(null)} />
    </div>
  );
}

function DetalleDialog({
  recepcion,
  onClose,
}: {
  recepcion: RecepcionRow | null;
  onClose: () => void;
}) {
  const fotos = (Array.isArray(recepcion?.fotos) ? recepcion?.fotos : []) as {
    key: string;
    label: string;
    path: string;
  }[];

  const { data: urls = {} } = useQuery({
    queryKey: ["recepcion-fotos", recepcion?.id],
    enabled: Boolean(recepcion) && fotos.length > 0,
    queryFn: async () => {
      const mapa: Record<string, string> = {};
      for (const f of fotos) {
        const { data } = await supabase.storage.from("recepciones").createSignedUrl(f.path, 3600);
        if (data?.signedUrl) mapa[f.key] = data.signedUrl;
      }
      return mapa;
    },
  });

  const respuestas = (recepcion?.respuestas ?? {}) as Record<string, string>;

  return (
    <Dialog open={Boolean(recepcion)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {ETIQUETAS[recepcion?.formulario ?? ""] ?? "Recepción"} · {recepcion?.personal_nombre ?? "—"}
          </DialogTitle>
          <DialogDescription>
            {formatearFecha(recepcion?.fecha)} · Revisor: {recepcion?.revisor ?? "—"}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 text-sm">
          {Object.entries(respuestas).map(([pregunta, valor]) => (
            <div key={pregunta}>
              <dt className="font-medium">{pregunta}</dt>
              <dd className="text-muted-foreground">{valor}</dd>
            </div>
          ))}
          {recepcion?.observaciones && (
            <div>
              <dt className="font-medium">Observaciones</dt>
              <dd className="text-muted-foreground">{recepcion.observaciones}</dd>
            </div>
          )}
        </dl>

        {fotos.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {fotos.map((f) => (
              <figure key={f.key} className="space-y-1">
                {urls[f.key] ? (
                  <img
                    src={urls[f.key]}
                    alt={f.label}
                    loading="lazy"
                    className="w-full rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="h-32 rounded-md border border-border bg-muted" />
                )}
                <figcaption className="text-xs text-muted-foreground">{f.label}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
