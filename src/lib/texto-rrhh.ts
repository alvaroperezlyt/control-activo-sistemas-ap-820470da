import { TIPOS, formatearFecha, type TipoEquipo } from "@/lib/tipos";

export type EquipoTexto = {
  codigo_interno: string;
  tipo: string;
  marca?: string | null;
  modelo?: string | null;
  serie?: string | null;
  color?: string | null;
  datos?: unknown;
};

const EXCLUIR = new Set(["costo", "costo_mensual", "observaciones", "lugar", "fecha_compra"]);

/** Detalle técnico de un equipo para el texto de RRHH (sin costos ni observaciones). */
export function detalleEquipo(e: EquipoTexto): string[] {
  const datos = (e.datos ?? {}) as Record<string, unknown>;
  const def = TIPOS[e.tipo as TipoEquipo];
  const etiqueta = def?.labelSingular ?? e.tipo;
  if (e.tipo === "LINEA") {
    const corto = String(datos["corto"] ?? "").trim();
    return [`• ${etiqueta}: ${e.codigo_interno}`, ...(corto ? [`   Número corto: ${corto}`] : [])];
  }
  const lineas = [`• ${etiqueta} · Código: ${e.codigo_interno}`];
  const base: [string, unknown][] = [
    ["Marca", e.marca],
    ["Modelo", e.modelo],
    ["Serie", e.serie],
    ["Color", e.color],
  ];
  for (const [l, v] of base) if (v) lineas.push(`   ${l}: ${v}`);
  for (const c of def?.campos ?? []) {
    if (c.base || EXCLUIR.has(c.key)) continue;
    const v = datos[c.key];
    if (v === undefined || v === null || String(v).trim() === "") continue;
    lineas.push(`   ${c.label}: ${String(v).trim()}`);
  }
  return lineas;
}

export function textoAsignacion(nombre: string, codigo: string | null, equipos: EquipoTexto[], fecha?: string) {
  const out = [
    "CONSTANCIA DE ENTREGA DE ACTIVOS DE TI",
    `Colaborador: ${nombre}${codigo ? ` (CI ${codigo})` : ""}`,
    `Fecha: ${formatearFecha(fecha ?? new Date().toISOString().slice(0, 10))}`,
    "",
    `Equipos asignados (${equipos.length}):`,
  ];
  for (const e of equipos) out.push(...detalleEquipo(e), "");
  return out.join("\n").trim();
}

export type RecepcionTexto = {
  fecha: string;
  formulario: string | null;
  tipo: string;
  revisor: string | null;
  personal_nombre: string | null;
  personal_codigo: string | null;
  observaciones: string | null;
  respuestas: unknown;
  codigo_interno?: string | null;
};

function ordenar(r: Record<string, string>) {
  return Object.entries(r).sort(([a], [b]) => {
    const na = Number.parseInt(a, 10);
    const nb = Number.parseInt(b, 10);
    if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b, "es");
    return na - nb;
  });
}

export function textoRecepcion(recs: RecepcionTexto[], etiquetas: Record<string, string>) {
  const p = recs[0];
  if (!p) return "";
  const out = [
    "CONSTANCIA DE RECEPCIÓN DE ACTIVOS DE TI",
    `Colaborador: ${p.personal_nombre ?? "—"}${p.personal_codigo ? ` (CI ${p.personal_codigo})` : ""}`,
    "",
    `Equipos recepcionados (${recs.length}):`,
  ];
  for (const r of recs) {
    out.push(
      `• ${etiquetas[r.formulario ?? ""] ?? r.tipo}${r.codigo_interno ? ` · Código: ${r.codigo_interno}` : ""}`,
      `   Fecha de recepción: ${formatearFecha(r.fecha)} · Revisor TI: ${r.revisor ?? "—"}`,
      "   Puntos revisados:",
    );
    for (const [q, v] of ordenar((r.respuestas ?? {}) as Record<string, string>)) out.push(`     ${q}: ${v}`);
    if (r.observaciones) out.push(`   Observaciones: ${r.observaciones}`);
    out.push("");
  }
  return out.join("\n").trim();
}

export async function copiarTexto(texto: string) {
  await navigator.clipboard.writeText(texto);
}
