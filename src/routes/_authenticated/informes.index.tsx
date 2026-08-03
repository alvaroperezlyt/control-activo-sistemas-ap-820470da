import { createFileRoute, Link } from "@tanstack/react-router";
import { FileBarChart, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

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
] as const;

function InformesIndex() {
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
      </div>
    </div>
  );
}
