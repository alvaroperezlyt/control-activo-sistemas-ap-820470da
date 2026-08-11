import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileDown, Search, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { formatearFecha } from "@/lib/tipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/informes/sucursal")({
  head: () => ({
    meta: [
      { title: "Equipos por sucursal | Informes" },
      {
        name: "description",
        content:
          "Informe de equipos asignados agrupados por sucursal o línea de negocio y por tipo de equipo.",
      },
      { property: "og:title", content: "Equipos por sucursal | Informes" },
      { property: "og:description", content: "Equipos asignados por sucursal/línea de negocio y tipo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InformePorSucursal,
});

type Fila = {
  id: string;
  tipo: string;
  codigo_interno: string;
  sucursal_id: string | null;
  sucursal_nombre: string;
  sucursal_lugar: string;
  asignado_a: string;
  puesto: string;
  resumen: string;
};

function etiquetaTipo(tipo: string): string {
  const map: Record<string, string> = {
    COMPUTADORA: "Computadora",
    TELEFONO: "Teléfono",
    IMPRESORA: "Impresora",
    LINEA: "Línea de telefonía",
    RED: "Dispositivo de red",
    OTRO: "Otro dispositivo",
  };
  return map[tipo] ?? tipo;
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
    partes.push(v("tipo_equipo"), v("procesador"), v("ram") && `RAM ${v("ram")}`, v("almacenamiento"), v("sistema_operativo"));
  } else if (e.tipo === "TELEFONO") {
    partes.push(v("imei1"), v("imei2"), v("ram") && `RAM ${v("ram")}`, v("almacenamiento"));
  } else if (e.tipo === "IMPRESORA") {
    partes.push(v("tipo_impresora"), v("tecnologia"), v("conectividad"), v("consumible"));
  } else if (e.tipo === "LINEA") {
    partes.push(v("operadora"), v("plan"), v("estado_linea"), v("equipo_vinculado"));
  } else if (e.tipo === "RED") {
    partes.push(v("tipo_dispositivo"), v("puertos"), v("mac"), v("ip"), v("ubicacion_fisica"));
  } else {
    partes.push(v("categoria"), v("descripcion"));
  }
  return partes.filter(Boolean).join(" · ") || "—";
}

function InformePorSucursal() {
  const [sucursal, setSucursal] = useState<string>("TODAS");
  const [tipo, setTipo] = useState<string>("TODOS");
  const [texto, setTexto] = useState("");
  const [seleccion, setSeleccion] = useState<Record<string, boolean>>({});

  const { data: filas = [], isLoading } = useQuery({
    queryKey: ["informes", "sucursal"],
    queryFn: async (): Promise<Fila[]> => {
      const { data, error } = await supabase
        .from("equipos")
        .select(
          "id, tipo, codigo_interno, estado_asignacion, marca, modelo, datos, almacen_id, almacenes(nombre, lugar), personal(nombre, puesto)",
        )
        .eq("estado_asignacion", "ASIGNADO");
      if (error) throw error;
      return (data ?? [])
        .map((e) => {
          const alm = e.almacenes as { nombre: string; lugar: string } | null;
          const per = e.personal as { nombre: string; puesto: string } | null;
          return {
            id: e.id,
            tipo: e.tipo,
            codigo_interno: e.codigo_interno,
            sucursal_id: e.almacen_id ?? null,
            sucursal_nombre: alm?.nombre ?? "Sin sucursal",
            sucursal_lugar: alm?.lugar ?? "—",
            asignado_a: per?.nombre ?? "—",
            puesto: per?.puesto ?? "—",
            resumen: resumenCaracteristicas({
              tipo: e.tipo,
              marca: e.marca,
              modelo: e.modelo,
              datos: (e.datos ?? {}) as Record<string, unknown>,
            }),
          };
        })
        .sort((a, b) => {
          if (a.sucursal_nombre !== b.sucursal_nombre) return a.sucursal_nombre.localeCompare(b.sucursal_nombre);
          if (a.tipo !== b.tipo) return a.tipo.localeCompare(b.tipo);
          return a.codigo_interno.localeCompare(b.codigo_interno);
        });
    },
  });

  const sucursales = useMemo(
    () => Array.from(new Map(filas.map((f) => [f.sucursal_id ?? "__ninguna", f.sucursal_nombre])).entries()),
    [filas],
  );

  const tipos = useMemo(() => Array.from(new Set(filas.map((f) => f.tipo))), [filas]);

  const visibles = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return filas.filter((f) => {
      if (sucursal !== "TODAS" && f.sucursal_id !== sucursal) return false;
      if (tipo !== "TODOS" && f.tipo !== tipo) return false;
      if (!q) return true;
      return [f.codigo_interno, f.tipo, f.asignado_a, f.puesto, f.resumen, f.sucursal_nombre, f.sucursal_lugar]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [filas, sucursal, tipo, texto]);

  const seleccionados = useMemo(() => visibles.filter((f) => seleccion[f.id]), [visibles, seleccion]);
  const todosVisiblesMarcados = visibles.length > 0 && visibles.every((f) => seleccion[f.id]);

  function alternarTodos(valor: boolean) {
    setSeleccion((prev) => {
      const siguiente = { ...prev };
      for (const f of visibles) siguiente[f.id] = valor;
      return siguiente;
    });
  }

  async function exportarPDF(filasPDF: Fila[], subtitulo: string, sufijo: string) {
    if (filasPDF.length === 0) return;
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
    doc.text("INFORME DE EQUIPOS ASIGNADOS POR SUCURSAL", ancho / 2, 16, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `${subtitulo} · Emitido: ${formatearFecha(new Date().toISOString().slice(0, 10))}`,
      ancho / 2,
      22,
      { align: "center" },
    );

    autoTable(doc, {
      startY: 30,
      head: [["#", "Código", "Tipo", "Sucursal / Lugar", "Asignado a", "Puesto", "Características"]],
      body: filasPDF.map((f, i) => [
        String(i + 1),
        f.codigo_interno,
        etiquetaTipo(f.tipo),
        `${f.sucursal_nombre} / ${f.sucursal_lugar}`,
        f.asignado_a,
        f.puesto,
        f.resumen,
      ]),
      styles: { fontSize: 7.5, cellPadding: 1.5, overflow: "linebreak" },
      headStyles: { fillColor: [222, 235, 247], textColor: 20, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { cellWidth: 45 },
        4: { cellWidth: 42 },
        5: { cellWidth: 36 },
      },
      margin: { left: 10, right: 10 },
    });

    doc.save(`informe-equipos-sucursal-${sufijo}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const base = seleccionados.length > 0 ? seleccionados : visibles;
  const grupos = useMemo(() => {
    const g = new Map<string, Fila[]>();
    for (const f of base) {
      const key = `${f.sucursal_nombre} / ${f.sucursal_lugar}`;
      if (!g.has(key)) g.set(key, []);
      g.get(key)!.push(f);
    }
    return g;
  }, [base]);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/informes"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Informes
      </Link>
      <PageHeader
        titulo="Equipos por sucursal / línea de negocio"
        descripcion="Equipos asignados agrupados por sucursal y tipo. Selecciona los equipos que entrarán al informe."
      >
        <Button variant="outline" onClick={() => exportarPDF(base, "Todos los equipos", "todos")} disabled={base.length === 0}>
          <FileDown className="size-4" />
          PDF {seleccionados.length > 0 ? `seleccionados (${base.length})` : "completo"}
        </Button>
      </PageHeader>

      <div className="panel p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar código, persona, puesto, característica o sucursal…"
              className="pl-9"
            />
          </div>
          <Select value={sucursal} onValueChange={setSucursal}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS">Todas las sucursales</SelectItem>
              {sucursales.map(([id, nombre]) => (
                <SelectItem key={id} value={id}>
                  {nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los tipos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t} value={t}>
                  {etiquetaTipo(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {seleccionados.length > 0 && (
            <Button variant="ghost" onClick={() => setSeleccion({})}>
              Limpiar selección
            </Button>
          )}
        </div>

        <div className="mt-4 tabla-scroll">
          <table className="w-full text-sm tabla-anclada">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2">
                  <Checkbox
                    checked={todosVisiblesMarcados}
                    onCheckedChange={(v) => alternarTodos(Boolean(v))}
                    aria-label="Seleccionar todos"
                  />
                </th>
                <th className="pb-2 font-medium text-muted-foreground">#</th>
                <th className="pb-2 font-medium text-muted-foreground">Código</th>
                <th className="pb-2 font-medium text-muted-foreground">Tipo</th>
                <th className="pb-2 font-medium text-muted-foreground">Sucursal / Lugar</th>
                <th className="pb-2 font-medium text-muted-foreground">Asignado a</th>
                <th className="pb-2 font-medium text-muted-foreground">Puesto</th>
                <th className="pb-2 font-medium text-muted-foreground">Características</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-6 text-muted-foreground">
                    Cargando…
                  </td>
                </tr>
              )}
              {!isLoading && visibles.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-muted-foreground">
                    Sin equipos asignados que coincidan con el filtro.
                  </td>
                </tr>
              )}
              {Array.from(grupos.entries()).map(([sucursalKey, items]) => (
                <>
                  <tr key={sucursalKey} className="bg-muted/50">
                    <td colSpan={8} className="py-1.5 pl-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Building2 className="mr-1 inline size-3" />
                      {sucursalKey}
                    </td>
                  </tr>
                  {items.map((f, i) => (
                    <tr key={f.id} className="border-b border-border/60 align-top last:border-0">
                      <td className="py-2">
                        <Checkbox
                          checked={Boolean(seleccion[f.id])}
                          onCheckedChange={(v) => setSeleccion((prev) => ({ ...prev, [f.id]: Boolean(v) }))}
                          aria-label={`Seleccionar ${f.codigo_interno}`}
                        />
                      </td>
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 font-mono">
                        <Link to="/equipos/$id" params={{ id: f.id }} className="hover:underline">
                          {f.codigo_interno}
                        </Link>
                      </td>
                      <td className="py-2">{etiquetaTipo(f.tipo)}</td>
                      <td className="py-2">
                        {f.sucursal_nombre}
                        <br />
                        <span className="text-xs text-muted-foreground">{f.sucursal_lugar}</span>
                      </td>
                      <td className="py-2">{f.asignado_a}</td>
                      <td className="py-2">{f.puesto}</td>
                      <td className="py-2 text-muted-foreground">{f.resumen}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {visibles.length} equipos listados · {seleccionados.length} seleccionados
          {seleccionados.length === 0 && " (sin selección se exportan todos los listados)"}
        </p>
      </div>
    </div>
  );
}
