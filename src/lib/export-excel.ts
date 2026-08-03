import { supabase } from "@/integrations/supabase/client";

type TablaExport = { tabla: string; hoja: string };

export const TABLAS_EXPORT: TablaExport[] = [
  { tabla: "equipos", hoja: "Equipos" },
  { tabla: "asignaciones", hoja: "Asignaciones" },
  { tabla: "recepciones", hoja: "Recepciones" },
  { tabla: "fallas", hoja: "Fallas" },
  { tabla: "reparaciones", hoja: "Reparaciones" },
  { tabla: "personal", hoja: "Personal" },
  { tabla: "almacenes", hoja: "Sucursales" },
  { tabla: "planes", hoja: "Planes" },
  { tabla: "plan_items", hoja: "Detalle de planes" },
  { tabla: "feriados", hoja: "Feriados" },
  { tabla: "notificaciones", hoja: "Notificaciones" },
  { tabla: "usuarios_autorizados", hoja: "Usuarios autorizados" },
];

function titulo(clave: string) {
  return clave
    .replace(/_/g, " ")
    .replace(/\bid\b/gi, "ID")
    .replace(/^./, (c) => c.toUpperCase());
}

function valorLegible(v: unknown): string | number | boolean {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "number") return v;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export async function exportarTodoExcel() {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Activos TI";
  wb.created = new Date();

  const resumen = wb.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Hoja", key: "hoja", width: 26 },
    { header: "Registros", key: "n", width: 14 },
  ];
  resumen.getRow(1).font = { bold: true };

  for (const { tabla, hoja } of TABLAS_EXPORT) {
    const { data, error } = await supabase.from(tabla as never).select("*");
    if (error) throw new Error(`${hoja}: ${error.message}`);
    const filas = (data ?? []) as Record<string, unknown>[];
    const ws = wb.addWorksheet(hoja);
    const claves = filas.length && filas[0] ? Object.keys(filas[0]) : ["sin datos"];

    ws.columns = claves.map((c) => ({
      header: titulo(c),
      key: c,
      width: Math.min(38, Math.max(14, titulo(c).length + 4)),
    }));
    const cabecera = ws.getRow(1);
    cabecera.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cabecera.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2A3B75" } };
    cabecera.alignment = { vertical: "middle" };
    ws.views = [{ state: "frozen", ySplit: 1 }];

    for (const f of filas) {
      ws.addRow(claves.reduce<Record<string, unknown>>((acc, c) => {
        acc[c] = valorLegible(f[c]);
        return acc;
      }, {}));
    }
    if (filas.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: claves.length } };

    resumen.addRow({ hoja, n: filas.length });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activos-ti-datos-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
