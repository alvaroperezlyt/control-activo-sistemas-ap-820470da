/** Publica en el Google Sheets de activos el estado actual de equipos y líneas (excepto BAJA). */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TIPOS, type TipoEquipo } from "./tipos";

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
export const ACTIVOS_SHEET_ID = "13tXXCc9clnw3vbKbzcy0sRwdSoJ19AawGyOp-3F8Mh8";

async function llamar(method: string, path: string, body?: unknown) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !sheetsKey) throw new Error("La conexión con Google Sheets no está configurada.");
  const res = await fetch(`${GATEWAY}/spreadsheets/${ACTIVOS_SHEET_ID}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": sheetsKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const t = await res.text();
    console.error(`Google Sheets error [${res.status}]: ${t}`);
    throw new Error(`No se pudo escribir en el Google Sheets [${res.status}]: ${t}`);
  }
}

function descripcion(tipo: string, datos: Record<string, unknown>): string {
  const def = TIPOS[tipo as TipoEquipo];
  const campos = def ? def.campos.filter((c) => !c.base) : [];
  const partes = campos
    .map((c) => {
      const v = datos?.[c.key];
      return v === null || v === undefined || String(v).trim() === "" ? null : `${c.label}: ${String(v).trim()}`;
    })
    .filter(Boolean);
  const etiqueta = def?.labelSingular ?? tipo;
  return [etiqueta, ...partes].join("\n");
}

export async function sincronizarActivosEnSheets() {
  const { data: equipos, error } = await supabaseAdmin
    .from("equipos")
    .select("id, tipo, codigo_interno, estado_asignacion, personal_codigo, serie, color, marca, modelo, datos")
    .neq("estado_asignacion", "BAJA")
    .order("codigo_interno");
  if (error) throw new Error(error.message);

  const [{ data: personal, error: e1 }, { data: asigs, error: e2 }] = await Promise.all([
    supabaseAdmin.from("personal").select("codigo, nombre, puesto"),
    supabaseAdmin.from("asignaciones").select("equipo_id"),
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);

  const personas = new Map((personal ?? []).map((p) => [p.codigo, p]));
  const conteo = new Map<string, number>();
  for (const a of asigs ?? []) conteo.set(a.equipo_id, (conteo.get(a.equipo_id) ?? 0) + 1);

  const filasEquipos: string[][] = [];
  const filasLineas: string[][] = [];
  for (const e of equipos ?? []) {
    const asignado = e.estado_asignacion === "ASIGNADO";
    const p = asignado && e.personal_codigo ? personas.get(e.personal_codigo) : undefined;
    const datos = (e.datos ?? {}) as Record<string, unknown>;
    if (e.tipo === "LINEA") {
      filasLineas.push([
        e.codigo_interno,
        String(datos["corto"] ?? ""),
        p?.nombre ?? "",
        asignado ? (e.personal_codigo ?? "") : "",
      ]);
      continue;
    }
    const n = conteo.get(e.id) ?? 0;
    const nuevo = asignado ? n <= 1 : n === 0;
    filasEquipos.push([
      p ? (e.personal_codigo ?? "") : "",
      p?.nombre ?? "",
      p?.puesto ?? "",
      e.codigo_interno,
      descripcion(e.tipo, datos),
      e.serie ?? "",
      e.color ?? "",
      e.marca ?? "",
      e.modelo ?? "",
      nuevo ? "nuevo" : "usado",
    ]);
  }

  await llamar("POST", "/values:batchClear", { ranges: ["equipos!A2:J", "lineas!A2:D"] });
  await llamar("POST", "/values:batchUpdate", {
    valueInputOption: "RAW",
    data: [
      { range: `equipos!A2:J${filasEquipos.length + 1}`, values: filasEquipos },
      { range: `lineas!A2:D${filasLineas.length + 1}`, values: filasLineas },
    ].filter((d) => d.values.length > 0),
  });

  return { equipos: filasEquipos.length, lineas: filasLineas.length };
}
