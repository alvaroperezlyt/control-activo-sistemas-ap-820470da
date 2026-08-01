/** Acceso de solo lectura al Google Sheets oficial (relevamiento + personal de RRHH). */

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

export const SPREADSHEET_ID = "1Kr3eVp3vtn0UnMAiJiOLGYokOeC_L9bIdPmhbArVtro";

async function leerRango(rango: string): Promise<string[][]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !sheetsKey) {
    throw new Error("La conexión con Google Sheets no está configurada.");
  }

  const url = `${GATEWAY}/spreadsheets/${SPREADSHEET_ID}/values/${rango}?valueRenderOption=FORMATTED_VALUE`;
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

function fechaISO(valor: string | undefined): string | null {
  const v = (valor ?? "").trim();
  if (!v) return null;
  const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const [, d, mes, a] = m;
    return `${a}-${mes!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return null;
}

function numero(valor: string | undefined): number | null {
  const v = (valor ?? "").replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
