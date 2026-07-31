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

export type EquipoSheet = {
  tipo: "COMPUTADORA" | "TELEFONO" | "LINEA";
  codigo_interno: string;
  asignado_nombre: string | null;
  estado_hoja: string;
  lugar: string | null;
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  fecha_compra: string | null;
  costo: number | null;
  color: string | null;
  observaciones: string | null;
  datos: Record<string, string | null>;
};

export async function leerComputadoras(): Promise<EquipoSheet[]> {
  const filas = await leerRango("Computadoras!A2:U2000");
  return filas
    .filter((f) => normalizar(f[0]))
    .map((f) => ({
      tipo: "COMPUTADORA" as const,
      codigo_interno: normalizar(f[0]),
      estado_hoja: normalizar(f[1]),
      asignado_nombre: normalizar(f[2]) || null,
      lugar: texto(f[3]),
      fecha_compra: fechaISO(f[4]),
      marca: texto(f[8]),
      modelo: texto(f[9]),
      serie: texto(f[10]),
      costo: numero(f[18]),
      color: texto(f[19]),
      observaciones: texto(f[20]),
      datos: {
        sistema_operativo: texto(f[5]),
        office: texto(f[6]),
        tipo_equipo: texto(f[7]),
        procesador: texto(f[11]),
        motherboard: texto(f[12]),
        gpu: texto(f[13]),
        ram: texto(f[14]),
        almacenamiento: texto(f[15]),
        pantalla: texto(f[16]),
        perifericos: texto(f[17]),
      },
    }));
}

export async function leerTelefonos(): Promise<EquipoSheet[]> {
  const filas = await leerRango("Telefonos!A2:M2000");
  return filas
    .filter((f) => normalizar(f[0]))
    .map((f) => ({
      tipo: "TELEFONO" as const,
      codigo_interno: normalizar(f[0]),
      estado_hoja: normalizar(f[1]),
      asignado_nombre: normalizar(f[2]) || null,
      lugar: texto(f[4]),
      fecha_compra: fechaISO(f[5]),
      marca: texto(f[6]),
      modelo: texto(f[7]),
      serie: texto(f[8]),
      costo: null,
      color: texto(f[11]),
      observaciones: texto(f[12]),
      datos: {
        cargo: texto(f[3]),
        imei1: texto(f[9]),
        imei2: texto(f[10]),
      },
    }));
}

export async function leerLineas(): Promise<EquipoSheet[]> {
  const filas = await leerRango("Lineas!A2:F2000");
  return filas
    .filter((f) => normalizar(f[0]))
    .map((f) => ({
      tipo: "LINEA" as const,
      codigo_interno: normalizar(f[0]),
      estado_hoja: normalizar(f[2]),
      asignado_nombre: normalizar(f[3]) || null,
      lugar: texto(f[4]),
      fecha_compra: null,
      marca: null,
      modelo: null,
      serie: null,
      costo: null,
      color: null,
      observaciones: texto(f[5]),
      datos: {
        corto: texto(f[1]),
        estado_linea: normalizar(f[2]) === "ACTIVO" ? "ACTIVA" : normalizar(f[2]) || null,
      },
    }));
}
