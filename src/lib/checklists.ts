import type { TipoEquipo } from "@/lib/tipos";

export type Pregunta = {
  key: string;
  label: string;
  opciones: string[];
  /** Permite la opción "Otro" con texto libre. */
  otro?: boolean;
};

export type Foto = { key: string; label: string };

export type Formulario = {
  id: FormularioId;
  titulo: string;
  descripcion: string;
  /** Etiqueta del código de activo o número de línea. */
  codigoLabel: string;
  preguntas: Pregunta[];
  fotos: Foto[];
};

export type FormularioId = "CELULAR" | "LINEA" | "LAPTOP" | "ESCRITORIO" | "GENERICO";

const ACCESORIOS_CELULAR = [
  "Originales o con los que se entregó el celular",
  "No son los originales o no son con los que se entregó el celular",
  "Solo cubo cargador",
  "Solo cable",
  "No entregó los accesorios",
];

export const FORMULARIOS: Record<FormularioId, Formulario> = {
  CELULAR: {
    id: "CELULAR",
    titulo: "Recepción de teléfono celular",
    descripcion: "Condición física, aspectos funcionales, accesorios y fotografías del celular corporativo.",
    codigoLabel: "Código del activo (celular)",
    preguntas: [
      {
        key: "cuerpo",
        label: "1. Condición del cuerpo del dispositivo",
        opciones: [
          "Buena",
          "Con marcas de uso",
          "Con grietas en marco o tapa trasera",
          "Marco o tapa trasera rotos",
        ],
        otro: true,
      },
      {
        key: "pantalla",
        label: "2. Condición de pantalla",
        opciones: [
          "Buena y la pantalla muestra imagen",
          "Con grietas y la pantalla muestra imagen",
          "Con grietas pero la pantalla no muestra imagen",
          "Totalmente rota, no es funcional",
        ],
        otro: true,
      },
      {
        key: "botones",
        label: "3. Botones",
        opciones: [
          "Están presentes, pueden presionarse y activan su función específica",
          "Están presentes pero no se pueden presionar",
          "No están presentes",
        ],
        otro: true,
      },
      {
        key: "puertos",
        label: "4. Puertos de entrada/salida",
        opciones: [
          "Puerto USB recibe carga, es completamente funcional",
          "Puerto USB no recibe carga",
          "Puerto USB destruido, no es funcional",
        ],
        otro: true,
      },
      {
        key: "camara_trasera",
        label: "5. Cámara(s) trasera",
        opciones: [
          "Buen estado del cristal y captura fotografías con normalidad",
          "Buen estado del cristal pero no captura fotografías",
          "Mal estado del cristal pero captura fotografías con normalidad",
          "Mal estado del cristal y no captura fotografías",
        ],
        otro: true,
      },
      {
        key: "camara_delantera",
        label: "6. Cámara(s) delantera",
        opciones: ["Toma fotografías con normalidad", "No toma fotografías"],
        otro: true,
      },
      {
        key: "altavoz",
        label: "7. Altavoz y auricular",
        opciones: [
          "El altavoz y auricular funcionan con normalidad",
          "El altavoz funciona con normalidad pero el auricular no",
          "El altavoz no funciona pero el auricular funciona con normalidad",
          "Ninguno de los dos funciona",
        ],
        otro: true,
      },
      {
        key: "microfono",
        label: "8. Micrófono",
        opciones: ["Funciona con normalidad", "No funciona"],
        otro: true,
      },
      { key: "accesorios", label: "9. Accesorios", opciones: ACCESORIOS_CELULAR, otro: true },
    ],
    fotos: [
      { key: "pantalla_apagada", label: "Fotografía de la pantalla apagada (resaltar grietas)" },
      { key: "pantalla_encendida", label: "Fotografía de la pantalla encendida (resaltar fallas)" },
      { key: "posterior", label: "Fotografía de la parte posterior (resaltar grietas)" },
      { key: "marcos", label: "Fotografía de los marcos incluyendo botonera y puertos" },
    ],
  },

  LINEA: {
    id: "LINEA",
    titulo: "Recepción de línea corporativa",
    descripcion: "Recepción del SIM de línea corporativa y consulta de deuda de la línea.",
    codigoLabel: "Número línea corporativa",
    preguntas: [
      {
        key: "linea",
        label: "10. Línea corporativa",
        opciones: [
          "Entregó el SIM de línea corporativa sin deuda",
          "Entregó el SIM de línea corporativa con deuda",
          "No entregó el SIM de línea corporativa",
        ],
        otro: true,
      },
    ],
    fotos: [],
  },

  LAPTOP: {
    id: "LAPTOP",
    titulo: "Recepción de computadora portátil",
    descripcion: "Condición física, aspectos funcionales y fotografías de la laptop.",
    codigoLabel: "Código del activo (computadora)",
    preguntas: [
      {
        key: "cuerpo",
        label: "1. Condición del cuerpo del dispositivo",
        opciones: [
          "Buena",
          "Con marcas de uso",
          "Con grietas en marco de pantalla, área del teclado o tapa trasera",
          "Marco de pantalla, área del teclado o tapa trasera roto(s)",
        ],
        otro: true,
      },
      {
        key: "pantalla",
        label: "2. Condición de pantalla",
        opciones: [
          "Buena y la pantalla muestra imagen",
          "Golpe y la pantalla muestra imagen",
          "Totalmente rota o golpeada, no es funcional",
        ],
        otro: true,
      },
      {
        key: "teclado",
        label: "3. Teclado",
        opciones: [
          "Todas las teclas están presentes y todas funcionan",
          "No todas las teclas están presentes y las demás funcionan",
          "El teclado no funciona por completo",
        ],
        otro: true,
      },
      {
        key: "puertos",
        label: "4. Puertos de entrada/salida",
        opciones: [
          "Puertos USB, puerto de salida de video (VGA o HDMI) y jack de auriculares en buen estado y funcionan",
          "Puertos USB, puerto de salida de video (VGA o HDMI) y jack de auriculares deteriorados pero funcionan",
          "Puertos USB, puerto de salida de video (VGA o HDMI) y jack de auriculares no funcionan",
        ],
        otro: true,
      },
      {
        key: "camara_web",
        label: "5. Cámara web",
        opciones: [
          "Buen estado del cristal y captura fotografías con normalidad",
          "Buen estado del cristal pero no captura fotografías",
          "Mal estado del cristal pero captura fotografías con normalidad",
          "Mal estado del cristal y no captura fotografías",
        ],
        otro: true,
      },
      {
        key: "sistema_operativo",
        label: "6. Sistema operativo",
        opciones: [
          "La computadora enciende y funciona con normalidad",
          "La computadora enciende pero presenta problemas en su funcionalidad",
          "La computadora no enciende",
        ],
        otro: true,
      },
    ],
    fotos: [
      { key: "abierta", label: "Laptop abierta; vista del teclado y pantalla" },
      { key: "pantalla_encendida", label: "Pantalla encendida" },
      { key: "tapa_inferior", label: "Tapa inferior" },
      { key: "posterior_pantalla", label: "Posterior de la pantalla" },
      { key: "puertos_accesorios", label: "Puertos (USB, HDMI, JACK) y accesorios (cargador, mouse, etc.)" },
    ],
  },

  ESCRITORIO: {
    id: "ESCRITORIO",
    titulo: "Recepción de computadora de escritorio",
    descripcion: "Condición física, aspectos funcionales y fotografías del equipo de escritorio.",
    codigoLabel: "Código de activo",
    preguntas: [
      {
        key: "cpu",
        label: "1. Condición CPU",
        opciones: ["En buen estado", "Con signos de uso", "Con signos de golpes y con alguna parte rota"],
        otro: true,
      },
      {
        key: "monitor",
        label: "2. Monitor",
        opciones: ["En buen estado", "Con signos de uso", "Con signos de golpes y con alguna parte rota"],
        otro: true,
      },
      {
        key: "teclado_mouse",
        label: "3. Teclado y mouse",
        opciones: [
          "Ambos en buen estado",
          "Ambos con signos de uso",
          "Ambos con alguna parte rota o destruidos",
        ],
        otro: true,
      },
      {
        key: "sistema_operativo",
        label: "4. Sistema operativo",
        opciones: [
          "La computadora enciende y funciona correctamente",
          "La computadora enciende pero presenta problemas en su funcionalidad",
          "La computadora enciende pero algún periférico no funciona",
          "La computadora no enciende",
        ],
        otro: true,
      },
    ],
    fotos: [
      { key: "cpu", label: "Fotografía CPU, solo un lado" },
      { key: "monitor", label: "Monitor encendido" },
      { key: "teclado", label: "Teclado" },
      { key: "mouse", label: "Mouse" },
    ],
  },

  GENERICO: {
    id: "GENERICO",
    titulo: "Recepción de equipo",
    descripcion: "Revisión general del estado físico y accesorios del equipo devuelto.",
    codigoLabel: "Código del activo",
    preguntas: [
      {
        key: "estado_fisico",
        label: "1. Estado físico general",
        opciones: ["Bueno", "Regular", "Malo", "Con daños", "No enciende"],
        otro: true,
      },
      {
        key: "accesorios",
        label: "2. Accesorios",
        opciones: [
          "Entregó todos los accesorios",
          "Entregó accesorios incompletos",
          "No entregó los accesorios",
        ],
        otro: true,
      },
    ],
    fotos: [
      { key: "frontal", label: "Fotografía frontal del equipo" },
      { key: "posterior", label: "Fotografía posterior del equipo" },
    ],
  },
};

/** Determina el formulario de recepción según el tipo de activo registrado. */
export function formularioParaEquipo(
  tipo: TipoEquipo | string | null | undefined,
  datos?: Record<string, string | null> | null,
): FormularioId {
  if (tipo === "TELEFONO") return "CELULAR";
  if (tipo === "LINEA") return "LINEA";
  if (tipo === "COMPUTADORA") {
    const subtipo = (datos?.["tipo_equipo"] ?? "").toUpperCase();
    return subtipo.includes("PORTATIL") || subtipo.includes("PORTÁTIL") ? "LAPTOP" : "ESCRITORIO";
  }
  return "GENERICO";
}
