export type TipoPlan = "RESPALDO" | "MANTENIMIENTO";
export type Turno = "MANANA" | "TARDE";

export const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

export const CONFIG_PLAN: Record<
  TipoPlan,
  {
    titulo: string;
    codigo: string;
    etiquetaNumero: string;
    meses: number[];
    objetivo: string;
    alcance: string;
    recursos: string;
    nota: string | null;
  }
> = {
  RESPALDO: {
    titulo: "PLAN DE RESPALDO DE LA INFORMACION DOCUMENTADA DIGITAL",
    codigo: "SI-P1-F2",
    etiquetaNumero: "RESPALDO No",
    meses: [2, 4, 6, 8, 10, 12],
    objetivo:
      "Mantener la informacion digital, que genera la organización, ordenada, resguardada y restaurable en caso de perdida de la misma en los equipos informaticos.",
    alcance:
      "Toda la informacion sensible para la organización, almacenada en discos duros mecanicos y discos duros de estado solido.",
    recursos:
      "Laptop, disco duro portatil, pendrive, programa de asistencia remota (TeamViewer, AnyDesk), Red VPN (Hamachi). Plataforma de almacenamiento en Google Drive y Red Interna de la empresa.",
    nota: null,
  },
  MANTENIMIENTO: {
    titulo: "PLAN DE MANTENIMIENTO TECNICO PREVENTIVO",
    codigo: "SI-P2-F2",
    etiquetaNumero: "MANTENIMIENTO No",
    meses: [5, 11],
    objetivo:
      "Detectar posibles fallas y defectos en los equipos informaticos en las etapas incipientes para evitar que estos fallos se manifiesten en uno mas grande durante su funcionamiento, evitando que ocacionen tiempos muertos causando un impacto negativo en las actividades de la organizacion.",
    alcance: "Todos los equipos informaticos dentro de la organización.",
    recursos: "Herramientas de montaje, soplador de aire, programas de mantenimiento y pasta termica.",
    nota: "Todos los usuarios deben tomar en cuenta que los equipos informáticos deben estar disponibles en los centros de trabajo según corresponda en el presente plan.",
  },
};

/** Colores de la leyenda por sucursal / lugar (RGB) */
export const COLORES_LUGAR: { patron: RegExp; label: string; rgb: [number, number, number] }[] = [
  { patron: /(EL ALTO|LA PAZ)/i, label: "EL ALTO/LA PAZ", rgb: [198, 224, 180] },
  { patron: /COCHABAMBA/i, label: "COCHABAMBA", rgb: [252, 228, 214] },
  { patron: /ORURO/i, label: "ORURO", rgb: [244, 177, 131] },
  { patron: /SANTA CRUZ/i, label: "SANTA CRUZ", rgb: [180, 198, 231] },
];

export const GRIS_NO_LABORABLE: [number, number, number] = [166, 166, 166];
export const AMARILLO: [number, number, number] = [255, 255, 0];

export function colorLugar(lugar?: string | null): [number, number, number] {
  if (lugar) {
    const hit = COLORES_LUGAR.find((c) => c.patron.test(lugar));
    if (hit) return hit.rgb;
  }
  return [255, 255, 255];
}

export function diasDelMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

export function iso(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function diaSemana(anio: number, mes: number, dia: number): number {
  // 0 = domingo
  return new Date(anio, mes - 1, dia).getDay();
}

export function fechaLarga(fecha: string): string {
  const [a, m, d] = fecha.split("-").map(Number);
  return `${d} de ${MESES[(m ?? 1) - 1]?.toLowerCase()} de ${a}`;
}

export type EquipoPlan = {
  equipo_id: string;
  codigo_interno: string;
  personal_nombre: string;
  sucursal_nombre: string | null;
  lugar: string | null;
};

export type ItemPlan = EquipoPlan & { fecha: string; turno: Turno; orden: number };

/**
 * Reparte los equipos entre los días del mes:
 * - excluye domingos y feriados
 * - sábados: máximo 2 equipos (medio día)
 * - lunes a viernes: carga automática y parejo según cantidad de equipos
 */
export function distribuir(
  equipos: EquipoPlan[],
  anio: number,
  mes: number,
  feriados: string[],
  desdeDia = 1,
): ItemPlan[] {
  const set = new Set(feriados);
  const total = diasDelMes(anio, mes);
  const habiles: { dia: number; sabado: boolean }[] = [];
  for (let d = desdeDia; d <= total; d++) {
    const dow = diaSemana(anio, mes, d);
    if (dow === 0) continue;
    if (set.has(iso(anio, mes, d))) continue;
    habiles.push({ dia: d, sabado: dow === 6 });
  }
  if (habiles.length === 0) return [];

  const sabados = habiles.filter((h) => h.sabado).length;
  const semana = habiles.length - sabados;
  const restantes = Math.max(0, equipos.length - sabados * 2);
  const porDia = semana > 0 ? Math.max(1, Math.ceil(restantes / semana)) : 2;

  const items: ItemPlan[] = [];
  let i = 0;
  for (const h of habiles) {
    const cupo = h.sabado ? 2 : porDia;
    for (let k = 0; k < cupo && i < equipos.length; k++, i++) {
      const eq = equipos[i]!;
      items.push({
        ...eq,
        fecha: iso(anio, mes, h.dia),
        turno: k % 2 === 0 ? "MANANA" : "TARDE",
        orden: i + 1,
      });
    }
    if (i >= equipos.length) break;
  }
  return items;
}
