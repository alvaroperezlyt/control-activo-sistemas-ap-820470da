import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileDown, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { formatearFecha } from "@/lib/tipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/informes")({
  head: () => ({
    meta: [
      { title: "Informes | Activos TI" },
      {
        name: "description",
        content:
          "Informe de antigüedad de computadoras y teléfonos para decidir renovaciones y reasignaciones de equipos.",
      },
      { property: "og:title", content: "Informes | Activos TI" },
      { property: "og:description", content: "Antigüedad de equipos, asignados y características técnicas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Informes,
});

type Fila = {
  id: string;
  tipo: string;
  codigo_interno: string;
  fecha_compra: string | null;
  nombre: string;
  puesto: string;
  resumen: string;
  meses: number | null;
  estado_asignacion: string;
};

function mesesDesde(fecha: string | null): number | null {
  if (!fecha) return null;
  const [a, m, d] = fecha.split("-").map(Number);
  if (!a || !m || !d) return null;
  const hoy = new Date();
  let meses = (hoy.getFullYear() - a) * 12 + (hoy.getMonth() + 1 - m);
  if (hoy.getDate() < d) meses -= 1;
  return Math.max(0, meses);
}

function textoAntiguedad(meses: number | null): string {
  if (meses === null) return "Sin fecha de compra";
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  if (anios === 0) return `${resto} mes(es)`;
  if (resto === 0) return `${anios} año(s)`;
  return `${anios} año(s) ${resto} mes(es)`;
}

function resumenCaracteristicas(e: {
  tipo: string;
  marca: string | null;
  modelo: string | null;
  datos: Record<string, unknown> | null;
}): string {
  const d = (e.datos ?? {}) as Record<string, unknown>;
  const v = (k: string) => {
    const val = d[k];
    return typeof val === "string" && val.trim() ? val.trim() : null;
  };
  const partes: (string | null)[] = [[e.marca, e.modelo].filter(Boolean).join(" ") || null];
  if (e.tipo === "COMPUTADORA") {
    partes.push(v("tipo_equipo"), v("procesador"), v("ram") && `RAM ${v("ram")}`, v("almacenamiento"), v("sistema_operativo"), v("pantalla") && `${v("pantalla")}"`);
  } else {
    partes.push(v("ram") && `RAM ${v("ram")}`, v("almacenamiento"), v("sistema_operativo"), v("cargo"));
  }
  return partes.filter(Boolean).join(" · ") || "—";
}

function Informes() {
  const [tipo, setTipo] = useState<string>("TODOS");
  const [texto, setTexto] = useState("");

  const { data: filas = [], isLoading } = useQuery({
    queryKey: ["informes", "antiguedad"],
    queryFn: async (): Promise<Fila[]> => {
      const { data, error } = await supabase
        .from("equipos")
        .select(
          "id, tipo, codigo_interno, estado_asignacion, fecha_compra, marca, modelo, datos, personal(nombre, puesto)",
        )
        .in("tipo", ["COMPUTADORA", "TELEFONO"]);
      if (error) throw error;
      return (data ?? [])
        .map((e) => ({
          id: e.id,
          tipo: e.tipo,
          codigo_interno: e.codigo_interno,
          estado_asignacion: e.estado_asignacion,
          fecha_compra: e.fecha_compra,
          nombre: e.personal?.nombre ?? "—",
          puesto: e.personal?.puesto ?? "—",
          resumen: resumenCaracteristicas({
            tipo: e.tipo,
            marca: e.marca,
            modelo: e.modelo,
            datos: (e.datos ?? {}) as Record<string, unknown>,
          }),
          meses: mesesDesde(e.fecha_compra),
        }))
        .sort((a, b) => {
          if (a.fecha_compra && b.fecha_compra) return a.fecha_compra.localeCompare(b.fecha_compra);
          if (a.fecha_compra) return -1;
          if (b.fecha_compra) return 1;
          return a.codigo_interno.localeCompare(b.codigo_interno);
        });
    },
  });

  const visibles = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return filas.filter((f) => {
      if (tipo !== "TODOS" && f.tipo !== tipo) return false;
      if (!q) return true;
      return [f.codigo_interno, f.nombre, f.puesto, f.resumen]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [filas, tipo, texto]);

  async function exportarPDF() {
    const [{ default: jsPDF }, { default: autoTable }, { LOGO_EMPRESA }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
      import("@/assets/logo-empresa"),
    ]);
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
    const ancho = doc.internal.pageSize.getWidth();
    try {
      doc.addImage(LOGO_EMPRESA, "PNG", 10, 8, 38, 19);
    } catch {
      /* logo opcional */
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("INFORME DE ANTIGÜEDAD DE EQUIPOS", ancho / 2, 16, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Computadoras y teléfonos ordenados del más antiguo al más nuevo · Emitido: ${formatearFecha(
        new Date().toISOString().slice(0, 10),
      )}`,
      ancho / 2,
      22,
      { align: "center" },
    );

    autoTable(doc, {
      startY: 30,
      head: [["#", "Código", "Tipo", "Asignado a", "Puesto", "Fecha compra", "Antigüedad", "Características"]],
      body: visibles.map((f, i) => [
        String(i + 1),
        f.codigo_interno,
        f.tipo === "COMPUTADORA" ? "Computadora" : "Teléfono",
        f.nombre,
        f.puesto,
        formatearFecha(f.fecha_compra),
        textoAntiguedad(f.meses),
        f.resumen,
      ]),
      styles: { fontSize: 7.5, cellPadding: 1.5, overflow: "linebreak" },
      headStyles: { fillColor: [222, 235, 247], textColor: 20, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 24 },
        2: { cellWidth: 22 },
        3: { cellWidth: 45 },
        4: { cellWidth: 38 },
        5: { cellWidth: 22 },
        6: { cellWidth: 26 },
      },
      margin: { left: 10, right: 10 },
    });

    doc.save(`informe-antiguedad-equipos-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        titulo="Informes"
        descripcion="Reportes para la toma de decisiones sobre renovación y reasignación de activos."
      >
        <Button onClick={exportarPDF} disabled={visibles.length === 0}>
          <FileDown className="size-4" />
          Exportar PDF
        </Button>
      </PageHeader>

      <div className="panel p-4">
        <h2 className="text-lg font-semibold">Antigüedad de computadoras y teléfonos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ordenado del equipo más antiguo al más nuevo según su fecha de compra.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar código, persona, puesto o característica…"
              className="pl-9"
            />
          </div>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Computadoras y teléfonos</SelectItem>
              <SelectItem value="COMPUTADORA">Solo computadoras</SelectItem>
              <SelectItem value="TELEFONO">Solo teléfonos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted-foreground">#</th>
                <th className="pb-2 font-medium text-muted-foreground">Código</th>
                <th className="pb-2 font-medium text-muted-foreground">Asignado a</th>
                <th className="pb-2 font-medium text-muted-foreground">Puesto</th>
                <th className="pb-2 font-medium text-muted-foreground">Fecha compra</th>
                <th className="pb-2 font-medium text-muted-foreground">Antigüedad</th>
                <th className="pb-2 font-medium text-muted-foreground">Características</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-6 text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              )}
              {!isLoading && visibles.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-muted-foreground">
                    Sin equipos que coincidan con el filtro.
                  </td>
                </tr>
              )}
              {visibles.map((f, i) => (
                <tr key={f.id} className="border-b border-border/60 align-top last:border-0">
                  <td className="py-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 font-mono">
                    <Link to="/equipos/$id" params={{ id: f.id }} className="hover:underline">
                      {f.codigo_interno}
                    </Link>
                  </td>
                  <td className="py-2">{f.nombre}</td>
                  <td className="py-2">{f.puesto}</td>
                  <td className="py-2 whitespace-nowrap">{formatearFecha(f.fecha_compra)}</td>
                  <td className="py-2 whitespace-nowrap font-medium">{textoAntiguedad(f.meses)}</td>
                  <td className="py-2 text-muted-foreground">{f.resumen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{visibles.length} equipos listados</p>
      </div>
    </div>
  );
}
