/** Acceso de solo lectura al Google Sheets oficial (relevamiento + personal de RRHH). */

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

export const SPREADSHEET_ID = "1Kr3eVp3vtn0UnMAiJiOLGYokOeC_L9bIdPmhbArVtro";

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
