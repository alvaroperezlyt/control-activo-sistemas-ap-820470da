import { createFileRoute, Link } from "@tanstack/react-router";
import { Laptop, Smartphone, Printer, Network, Building, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Activos TI · Registro y control de equipos" },
      {
        name: "description",
        content:
          "Sistema de registro y control de activos informáticos: ingresos, asignaciones, sucursales, recepciones, fallas y reparaciones.",
      },
      { property: "og:title", content: "Activos TI · Registro y control de equipos" },
      {
        property: "og:description",
        content: "Controla computadoras, teléfonos, impresoras, líneas y dispositivos de red en un solo lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const bloques = [
  { icon: Laptop, titulo: "Ingresos", texto: "Registra computadoras, impresoras y más con sus campos técnicos." },
  { icon: Smartphone, titulo: "Asignaciones", texto: "Entrega equipos a personal y controla ASIGNADO, LIBRE y BAJA." },
  { icon: Building, titulo: "Sucursales", texto: "Define sucursales con nombre y lugar para ubicar cada activo." },
  { icon: Printer, titulo: "Recepciones", texto: "Formularios de devolución con estado y observaciones." },
  { icon: Network, titulo: "Fallas y reparaciones", texto: "Proveedor, costo y factura por cada intervención." },
  { icon: BellRing, titulo: "Avisos de RRHH", texto: "Alerta automática cuando alguien pasa a DESVINCULADO." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold">Activos TI</span>
          <Button asChild size="sm">
            <Link to="/auth">Ingresar</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="label-mono">Inventario tecnológico</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Registro y control de activos informáticos
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Todo el ciclo de vida del equipo: ingreso, asignación al personal, devolución, fallas y reparaciones, con el
          padrón de personal sincronizado desde la hoja oficial de RRHH.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Acceder al sistema</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bloques.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="panel p-5">
              <Icon className="size-5 text-primary" />
              <h2 className="mt-3 font-semibold">{titulo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
