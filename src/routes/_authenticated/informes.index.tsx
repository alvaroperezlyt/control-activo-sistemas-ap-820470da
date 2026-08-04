import { createFileRoute, Link } from "@tanstack/react-router";
import { FileBarChart, ArrowRight, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { exportarTodoExcel } from "@/lib/export-excel";

export const Route = createFileRoute("/_authenticated/informes/")({
  head: () => ({
    meta: [
      { title: "Informes | Activos TI" },
      {
        name: "description",
        content:
          "Centro de informes de activos informáticos: antigüedad de equipos y otros reportes para la toma de decisiones.",
      },
      { property: "og:title", content: "Informes | Activos TI" },
      { property: "og:description", content: "Reportes de activos informáticos para gerencia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InformesIndex,
});

const informes = [
  {
    to: "/informes/antiguedad",
    titulo: "Antigüedad de equipos",
    descripcion:
      "Computadoras y teléfonos activos y libres ordenados del más antiguo al más nuevo, con asignado, puesto y características.",
  },
  {
    to: "/informes/sucursal",
    titulo: "Equipos por sucursal / línea de negocio",
    descripcion:
      "Equipos asignados agrupados por sucursal o línea de negocio y por tipo, con código, características y responsable.",
  },
] as const;

function InformesIndex() {
  const [exportando, setExportando] = useState(false);

  async function exportar() {
    setExportando(true);
    try {
      await exportarTodoExcel();
      toast.success("Archivo Excel generado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el Excel");
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        titulo="Informes"
        descripcion="Reportes para la toma de decisiones sobre renovación y reasignación de activos."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {informes.map((i) => (
          <Link key={i.to} to={i.to} className="panel group p-5 transition-colors hover:bg-accent/40">
            <div className="flex items-start gap-3">
              <span className="rounded-md bg-secondary p-2 text-secondary-foreground">
                <FileBarChart className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold">{i.titulo}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{i.descripcion}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Abrir informe
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}

        <div className="panel p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-md bg-secondary p-2 text-secondary-foreground">
              <FileSpreadsheet className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold">Exportar todos los datos a Excel</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Un archivo .xlsx con una hoja por tabla: equipos, asignaciones, recepciones, fallas, reparaciones,
                personal, sucursales, planes, feriados, notificaciones y usuarios autorizados.
              </p>
              <Button className="mt-3" onClick={exportar} disabled={exportando}>
                {exportando ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                {exportando ? "Generando..." : "Descargar Excel"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
