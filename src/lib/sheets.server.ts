/** Acceso de solo lectura al Google Sheets oficial (relevamiento + personal de RRHH). */

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

export const SPREADSHEET_ID = "1Kr3eVp3vtn0UnMAiJiOLGYokOeC_L9bIdPmhbArVtro";

/** Libro de activos (equipos y líneas), donde el sistema escribe. */
export const ACTIVOS_SHEET_ID = "13tXXCc9clnw3vbKbzcy0sRwdSoJ19AawGyOp-3F8Mh8";

/** Libros gestionados: "personal" (solo lectura) y "activos" (equipos y líneas). */
export const LIBROS = {
  personal: { clave: "sheets_personal_id", defecto: SPREADSHEET_ID },
  activos: { clave: "sheets_activos_id", defecto: ACTIVOS_SHEET_ID },
} as const;

export type Libro = keyof typeof LIBROS;

/** Resuelve la clave de ajuste y el ID por defecto de un libro pedido. */
export function configLibro(libro: string | undefined | null): { clave: string; defecto: string; libro: Libro } {
  const pedido = (libro ?? "").trim().toLowerCase();
  const elegido: Libro = pedido === "activos" || pedido === "equipos" ? "activos" : "personal";
  return { ...LIBROS[elegido], libro: elegido };
}

/** Lee un ID de hoja configurado en ajustes; usa el valor por defecto si no existe. */
export async function idHoja(clave: string, defecto: string): Promise<string> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("ajustes").select("valor").eq("clave", clave).maybeSingle();
    const v = (data?.valor ?? "").trim();
    return v || defecto;
  } catch {
    return defecto;
  }
}

async function leerRango(rango: string): Promise<string[][]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !sheetsKey) {
    throw new Error("La conexión con Google Sheets no está configurada.");
  }

  const id = await idHoja("sheets_personal_id", SPREADSHEET_ID);
  const url = `${GATEWAY}/spreadsheets/${id}/values/${rango}?valueRenderOption=FORMATTED_VALUE`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": sheetsKey,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Google Sheets error [${res.status}]: ${body}`);
    throw new Error(`No se pudo leer el Google Sheets [${res.status}]: ${body}`);
  }

  const json = (await res.json()) as { values?: string[][] };
  return json.values ?? [];
}

export function normalizar(valor: string | undefined | null): string {
  return (valor ?? "").toUpperCase().replace(/\s+/g, " ").trim();
}

function texto(valor: string | undefined): string | null {
  const limpio = (valor ?? "").replace(/\s+/g, " ").trim();
  return limpio === "" || limpio.toUpperCase() === "NA" ? null : limpio;
}

export type PersonalSheet = { codigo: string; nombre: string; puesto: string | null; estado: string };

export async function leerPersonal(): Promise<PersonalSheet[]> {
  const filas = await leerRango("Personal!A2:D2000");
  const salida: PersonalSheet[] = [];
  for (const f of filas) {
    const codigo = normalizar(f[0]);
    const nombre = normalizar(f[1]);
    if (!codigo || !nombre) continue;
    const estado = normalizar(f[3]) === "DESVINCULADO" ? "DESVINCULADO" : "ACTIVO";
    salida.push({ codigo, nombre, puesto: texto(f[2]), estado });
  }
  return salida;
}

async function gatewayGet(path: string): Promise<unknown> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !sheetsKey) throw new Error("La conexión con Google Sheets no está configurada.");
  const res = await fetch(`${GATEWAY}${path}`, {
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": sheetsKey },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Sheets [${res.status}]: ${body}`);
  }
  return res.json();
}

/** Lista las hojas (pestañas) del libro de RRHH configurado. */
export async function listarHojasPersonal() {
  const id = await idHoja("sheets_personal_id", SPREADSHEET_ID);
  const json = (await gatewayGet(
    `/spreadsheets/${id}?fields=properties.title,sheets.properties(sheetId,title,index,gridProperties)`,
  )) as {
    properties?: { title?: string };
    sheets?: { properties: { sheetId: number; title: string; index: number; gridProperties?: { rowCount?: number; columnCount?: number } } }[];
  };
  return {
    libro: json.properties?.title ?? "",
    hojas: (json.sheets ?? []).map((s) => ({
      id: s.properties.sheetId,
      nombre: s.properties.title,
      indice: s.properties.index,
      filas: s.properties.gridProperties?.rowCount ?? null,
      columnas: s.properties.gridProperties?.columnCount ?? null,
    })),
  };
}

/** Lee un rango arbitrario (A1) del libro de RRHH configurado. */
export async function leerRangoPersonal(rango: string): Promise<string[][]> {
  const id = await idHoja("sheets_personal_id", SPREADSHEET_ID);
  const json = (await gatewayGet(
    `/spreadsheets/${id}/values/${encodeURI(rango).replace(/%3A/gi, ":")}?valueRenderOption=FORMATTED_VALUE`,
  )) as { values?: string[][] };
  return json.values ?? [];
}
