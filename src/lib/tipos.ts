export type TipoEquipo = "COMPUTADORA" | "TELEFONO" | "IMPRESORA" | "LINEA" | "RED" | "OTRO";

export type CampoTipo = "text" | "number" | "date" | "textarea" | "select";

export type Campo = {
  key: string;
  label: string;
  tipo?: CampoTipo;
  opciones?: string[];
  base?: boolean;
  ancho?: "full" | "half";
};

export const ESTADOS_ASIGNACION = ["ASIGNADO", "LIBRE", "BAJA"] as const;
export type EstadoAsignacion = (typeof ESTADOS_ASIGNACION)[number];

const camposBase: Campo[] = [
  { key: "lugar", label: "Lugar / Ciudad", base: true },
  { key: "marca", label: "Marca", base: true },
  { key: "modelo", label: "Modelo", base: true },
  { key: "serie", label: "Serie", base: true },
  { key: "fecha_compra", label: "Fecha de compra", tipo: "date", base: true },
  { key: "costo", label: "Costo", tipo: "number", base: true },
  { key: "color", label: "Color", base: true },
];

export const TIPOS: Record<
  TipoEquipo,
  { label: string; labelSingular: string; codigoLabel: string; campos: Campo[] }
> = {
  COMPUTADORA: {
    label: "Computadoras",
    labelSingular: "Computadora",
    codigoLabel: "Código interno",
    campos: [
      ...camposBase,
      { key: "tipo_equipo", label: "Tipo", tipo: "select", opciones: ["PORTATIL", "ESCRITORIO", "TODO EN UNO", "SERVIDOR"] },
      { key: "sistema_operativo", label: "Sistema operativo" },
      { key: "office", label: "Office" },
      { key: "procesador", label: "Procesador" },
      { key: "motherboard", label: "Motherboard" },
      { key: "gpu", label: "GPU" },
      { key: "ram", label: "RAM" },
      { key: "almacenamiento", label: "Almacenamiento" },
      { key: "pantalla", label: "Tamaño de pantalla" },
      { key: "perifericos", label: "Periféricos incluidos", tipo: "textarea", ancho: "full" },
    ],
  },
  TELEFONO: {
    label: "Teléfonos",
    labelSingular: "Teléfono",
    codigoLabel: "Código interno",
    campos: [
      ...camposBase,
      { key: "imei1", label: "IMEI 1" },
      { key: "imei2", label: "IMEI 2" },
      
      { key: "accesorios", label: "Accesorios incluidos", tipo: "textarea", ancho: "full" },
    ],
  },
  IMPRESORA: {
    label: "Impresoras",
    labelSingular: "Impresora",
    codigoLabel: "Código interno",
    campos: [
      ...camposBase,
      { key: "tipo_impresora", label: "Tipo", tipo: "select", opciones: ["MONOFUNCIONAL", "MULTIFUNCIONAL", "MATRICIAL", "PLOTTER", "ETIQUETADORA"] },
      { key: "tecnologia", label: "Tecnología", tipo: "select", opciones: ["LASER", "TINTA", "MATRIZ DE PUNTOS", "TERMICA"] },
      { key: "conectividad", label: "Conectividad", tipo: "select", opciones: ["USB", "RED", "USB + RED", "WIFI", "USB + RED + WIFI"] },
      { key: "consumible", label: "Consumible / Tóner" },
      { key: "contador_paginas", label: "Contador de páginas", tipo: "number" },
    ],
  },
  LINEA: {
    label: "Líneas de telefonía",
    labelSingular: "Línea",
    codigoLabel: "Número de línea",
    campos: [
      { key: "lugar", label: "Lugar / Ciudad", base: true },
      { key: "corto", label: "Número corto" },
      { key: "operadora", label: "Operadora", tipo: "select", opciones: ["ENTEL", "TIGO", "VIVA", "OTRA"] },
      { key: "plan", label: "Plan" },
      { key: "estado_linea", label: "Estado de la línea", tipo: "select", opciones: ["ACTIVA", "SUSPENDIDA", "DADA DE BAJA"] },
      { key: "fecha_activacion", label: "Fecha de activación", tipo: "date" },
      { key: "costo_mensual", label: "Costo mensual", tipo: "number" },
      { key: "equipo_vinculado", label: "Código del teléfono vinculado" },
    ],
  },
  RED: {
    label: "Dispositivos de red",
    labelSingular: "Dispositivo de red",
    codigoLabel: "Código interno",
    campos: [
      ...camposBase,
      { key: "tipo_dispositivo", label: "Tipo", tipo: "select", opciones: ["ROUTER", "SWITCH", "ACCESS POINT", "FIREWALL", "MODEM", "NVR", "OTRO"] },
      { key: "puertos", label: "Puertos" },
      { key: "mac", label: "Dirección MAC" },
      { key: "ip", label: "Dirección IP" },
      { key: "firmware", label: "Firmware" },
      { key: "ubicacion_fisica", label: "Ubicación física" },
    ],
  },
  OTRO: {
    label: "Otros dispositivos",
    labelSingular: "Otro dispositivo",
    codigoLabel: "Código interno",
    campos: [
      ...camposBase,
      { key: "categoria", label: "Categoría" },
      { key: "descripcion", label: "Descripción", tipo: "textarea", ancho: "full" },
    ],
  },
};

export const TIPOS_LISTA = Object.keys(TIPOS) as TipoEquipo[];

/** Normaliza nombres provenientes de RRHH: mayúsculas, sin espacios extra ni intermedios dobles. */
export function normalizarNombre(valor: string | null | undefined): string {
  return (valor ?? "").toUpperCase().replace(/\s+/g, " ").trim();
}

export function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  const [y, m, d] = valor.split("-");
  if (!y || !m || !d) return valor;
  return `${d}/${m}/${y}`;
}
