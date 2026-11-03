import jsPDF from "jspdf";
import { LOGO_EMPRESA } from "@/assets/logo-empresa";
import autoTable from "jspdf-autotable";
import {
  AMARILLO,
  COLORES_LUGAR,
  CONFIG_PLAN,
  GRIS_NO_LABORABLE,
  MESES,
  colorLugar,
  diaSemanaISO,
  rangoFechas,
  textoRango,
  type ItemPlan,
  type TipoPlan,
} from "./planes";

export type PlanPDF = {
  tipo: TipoPlan;
  anio: number;
  mes: number;
  numero: number;
  fecha_elaboracion: string;
  fecha_realizacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  objetivo: string;
  alcance: string;
  recursos: string;
  nota: string | null;
  elabora: string;
  autoriza: string;
};


const AZUL_CLARO: [number, number, number] = [222, 235, 247];
const BORDE: [number, number, number] = [120, 120, 120];

function fechaCorta(f: string) {
  const [a, m, d] = f.split("-").map(Number);
  const abrev = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
  return `${String(d).padStart(2, "0")}-${abrev[(m ?? 1) - 1]}-${String(a).slice(2)}`;
}

function cabecera(doc: jsPDF, plan: PlanPDF, ancho: number, logo?: string | null) {
  const cfg = CONFIG_PLAN[plan.tipo];
  const x = 10;
  const y = 10;
  const alto = 16;
  const colLogo = 38;
  const colDato = 34;
  const colValor = 24;
  const colTitulo = ancho - x * 2 - colLogo - colDato - colValor;

  doc.setDrawColor(...BORDE);
  doc.setLineWidth(0.2);
  doc.rect(x, y, ancho - x * 2, alto);
  doc.rect(x, y, colLogo, alto);
  doc.rect(x + colLogo, y, colTitulo, alto);

  if (logo) {
    try {
      // El logo es 500x250 (2:1): se ajusta sin deformarlo y se centra en la celda.
      const maxW = colLogo - 4;
      const maxH = alto - 3;
      const w = Math.min(maxW, maxH * 2);
      const h = w / 2;
      doc.addImage(logo, "PNG", x + (colLogo - w) / 2, y + (alto - h) / 2, w, h, undefined, "FAST");
    } catch {
      /* logo opcional */
    }
  }


  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("SISTEMA DE GESTIÓN INTEGRADO", x + colLogo + colTitulo / 2, y + 5, { align: "center" });
  doc.setFontSize(6.5);
  doc.text(cfg.titulo, x + colLogo + colTitulo / 2, y + 11, { align: "center", maxWidth: colTitulo - 4 });

  const filas: [string, string][] = [
    ["Codigo:", cfg.codigo],
    ["Version:", "5"],
    ["Vigente a partir de:", "24-sept-19"],
    ["Fecha de Última Revision:", "31-may-24"],
  ];
  const hf = alto / filas.length;
  doc.setFontSize(5.8);
  filas.forEach(([k, v], i) => {
    const fy = y + i * hf;
    doc.rect(x + colLogo + colTitulo, fy, colDato, hf);
    doc.rect(x + colLogo + colTitulo + colDato, fy, colValor, hf);
    doc.setFont("helvetica", "normal");
    doc.text(k, x + colLogo + colTitulo + colDato - 1, fy + hf / 2 + 1, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(v, x + colLogo + colTitulo + colDato + colValor / 2, fy + hf / 2 + 1, { align: "center" });
  });

  return y + alto;
}

export function generarPlanPDF(
  plan: PlanPDF,
  items: ItemPlan[],
  feriados: string[] = [],
  logo: string | null = LOGO_EMPRESA,
) {
  const setFeriados = new Set(feriados);
  const cfg = CONFIG_PLAN[plan.tipo];
  const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
  const anchoP = doc.internal.pageSize.getWidth();

  // ---------- Página 1 ----------
  let y = cabecera(doc, plan, anchoP, logo) + 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`${cfg.etiquetaNumero}: ${plan.numero}/${plan.anio}`, 10, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    theme: "grid",
    styles: { fontSize: 7, lineColor: BORDE, lineWidth: 0.2, cellPadding: 1.2 },
    body: [
      [
        { content: "FECHA DE ELABORACION:", styles: { fontStyle: "bold" } },
        fechaCorta(plan.fecha_elaboracion),
        { content: "FECHA DE REALIZACION:", styles: { fontStyle: "bold" } },
        textoRango(plan.fecha_inicio, plan.fecha_fin) || plan.fecha_realizacion,

      ],
      [
        {
          content: `OBJETIVO DEL ${plan.tipo === "RESPALDO" ? "RESPALDO DE LA INFORMACION" : "MANTENIMIENTO TECNICO PREVENTIVO"}`,
          colSpan: 4,
          styles: { fontStyle: "bold", halign: "center", fillColor: [240, 240, 240] as [number, number, number] },
        },
      ],
      [{ content: plan.objetivo, colSpan: 4 }],
      [
        {
          content: "ALCANCE",
          colSpan: 4,
          styles: { fontStyle: "bold", halign: "center", fillColor: [240, 240, 240] as [number, number, number] },
        },
      ],
      [{ content: plan.alcance, colSpan: 4 }],
    ],
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    theme: "grid",
    styles: { fontSize: 6.5, lineColor: BORDE, lineWidth: 0.2, cellPadding: 0.9 },
    head: [
      [
        {
          content: "RESPONSABLES DE LOS EQUIPOS",
          colSpan: 2,
          styles: { halign: "center" as const },
        },
      ],
      ["NOMBRE DEL RESPONSABLE", "EQUIPO"],
    ],
    headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: "bold" },
    columnStyles: { 1: { cellWidth: 40, halign: "center" } },
    body: items.map((i) => [i.personal_nombre, i.codigo_interno]),
    foot: [
      [{ content: "RECURSOS", colSpan: 2, styles: { halign: "center" as const } }],
      [{ content: plan.recursos, colSpan: 2, styles: { fontStyle: "normal" as const, halign: "left" as const } }],
    ],
    footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;
  if (plan.nota) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.text(`NOTA: ${plan.nota}`, 10, y, { maxWidth: anchoP - 20 });
    y += 8;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    theme: "grid",
    styles: { fontSize: 7, lineColor: BORDE, lineWidth: 0.2, halign: "center", cellPadding: 1.5 },
    head: [["ELABORA", "AUTORIZA"]],
    headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: "bold", halign: "center" },
    body: [[plan.elabora, plan.autoriza]],
  });

  // ---------- Página 2: matriz ----------
  doc.addPage("letter", "landscape");
  const anchoL = doc.internal.pageSize.getWidth();
  const top = cabecera(doc, plan, anchoL, logo) + 3;

  const fechas = rangoFechas(plan.fecha_inicio, plan.fecha_fin);
  const total = Math.max(1, fechas.length);

  const marca = plan.tipo === "RESPALDO" ? null : "x";
  const anchoNombre = 68;
  const anchoNro = 8;
  const anchoDia = (anchoL - 20 - anchoNombre - anchoNro) / total;

  const body = items.map((it, idx) => {
    const fila: (string | { content: string })[] = [String(idx + 1), `${it.personal_nombre} (${it.codigo_interno})`];
    for (const f of fechas) {
      const activo = it.fecha === f;
      fila.push(activo ? (marca ?? (it.turno === "MANANA" ? "MAÑANA" : "TARDE")) : "");
    }
    return fila;
  });

  const mesesRango = Array.from(new Set(fechas.map((f) => MESES[Number(f.split("-")[1]) - 1]))).join(" / ");

  autoTable(doc, {
    startY: top,
    margin: { left: 10, right: 10 },
    theme: "grid",
    styles: {
      fontSize: 4.2,
      lineColor: BORDE,
      lineWidth: 0.1,
      cellPadding: 0.3,
      halign: "center",
      valign: "middle",
      overflow: "hidden",
      fillColor: AZUL_CLARO,
      cellWidth: anchoDia,
    },
    head: [
      [
        { content: "NRO", styles: { fillColor: [255, 255, 255] as [number, number, number] } },
        { content: `AÑO ${plan.anio} · ${mesesRango}`, styles: { halign: "right" as const } },
        ...fechas.map((f) => ({ content: String(Number(f.split("-")[2])) })),
      ],
    ],
    headStyles: { fillColor: [31, 56, 100], textColor: 255, fontSize: 4.6, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: anchoNro },
      1: { cellWidth: anchoNombre, halign: "left", fontSize: 4.6 },
    },
    body,
    didParseCell: (data) => {
      const col = data.column.index;
      if (data.section !== "body") return;
      if (col === 1) {
        const it = items[data.row.index];
        data.cell.styles.fillColor = colorLugar(it?.lugar);
        return;
      }
      if (col === 0) {
        data.cell.styles.fillColor = [255, 255, 255];
        return;
      }
      const fecha = fechas[col - 2];
      if (!fecha) return;
      if (diaSemanaISO(fecha) === 0 || setFeriados.has(fecha)) {
        data.cell.styles.fillColor = GRIS_NO_LABORABLE;
        return;
      }
      if (data.cell.text.join("").trim()) {
        data.cell.styles.fillColor = AMARILLO;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });


  // Leyenda
  let ly = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  const leyenda: [string, [number, number, number]][] = [
    ...COLORES_LUGAR.map((c) => [c.label, c.rgb] as [string, [number, number, number]]),
    ["FERIADO/DOMINGO", GRIS_NO_LABORABLE],
  ];
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  for (const [label, rgb] of leyenda) {
    doc.setFillColor(...rgb);
    doc.setDrawColor(...BORDE);
    doc.rect(60, ly, 20, 4, "FD");
    doc.text(label, 82, ly + 3);
    ly += 4;
  }

  const nombre = `PLAN_${plan.tipo === "RESPALDO" ? "RESPALDOS" : "MANTENIMIENTO"}_${MESES[plan.mes - 1]}_${plan.anio}.pdf`;
  doc.save(nombre);
}


/** Lista de verificación de mantenimiento (SI-P2-F3): 20 filas por hoja para firma de conformidad. */
export function generarListaVerificacionPDF(
  plan: Pick<PlanPDF, "anio" | "mes">,
  items: ItemPlan[],
  logo: string | null = LOGO_EMPRESA,
) {
  const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();
  const POR_HOJA = 20;
  const hojas = Math.max(1, Math.ceil(items.length / POR_HOJA));
  const x = 10;
  const ancho = W - 20;
  const colLogo = 46;
  const colDato = 30;
  const colValor = 22;
  const colTitulo = ancho - colLogo - colDato - colValor;

  for (let h = 0; h < hojas; h++) {
    if (h > 0) doc.addPage();
    const y = 10;
    const alto = 20;
    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.rect(x, y, ancho, alto);
    doc.rect(x, y, colLogo, alto);
    doc.rect(x + colLogo, y, colTitulo, alto);
    doc.line(x + colLogo, y + 7, x + colLogo + colTitulo, y + 7);
    if (logo) {
      try {
        const w = Math.min(colLogo - 4, (alto - 3) * 2);
        doc.addImage(logo, "PNG", x + (colLogo - w) / 2, y + (alto - w / 2) / 2, w, w / 2, undefined, "FAST");
      } catch {
        /* opcional */
      }
    }
    const cx = x + colLogo + colTitulo / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("SISTEMA DE GESTION INTEGRADO", cx, y + 3, { align: "center" });
    doc.text("FORMULARIO O REGISTRO", cx, y + 6, { align: "center" });
    doc.setFontSize(10);
    doc.text("LISTA DE VERIFICACIÓN DE MANTENIMIENTO", cx, y + 14.5, { align: "center" });

    const dx = x + colLogo + colTitulo;
    const filas: [string, string][] = [
      ["Codigo:", "SI-P2-F3"],
      ["Version:", "3"],
      ["Fecha de Vigencia", "31-may-24"],
    ];
    const hf = 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    filas.forEach(([k, v], i) => {
      const fy = y + i * hf;
      doc.rect(dx, fy, colDato, hf);
      doc.rect(dx + colDato, fy, colValor, hf);
      doc.text(k, dx + colDato - 1, fy + 3.5, { align: "right" });
      doc.text(v, dx + colDato + colValor / 2, fy + 3.5, { align: "center" });
    });
    doc.rect(dx, y + 15, colDato + colValor, 5);
    doc.text(`Hoja: ${h + 1} de ${hojas}`, dx + (colDato + colValor) / 2, y + 18.5, { align: "center" });

    const pagina = items.slice(h * POR_HOJA, (h + 1) * POR_HOJA);
    const body = Array.from({ length: POR_HOJA }, (_, i) => {
      const it = pagina[i];
      return [
        String(h * POR_HOJA + i + 1),
        it ? `${it.personal_nombre} (${it.codigo_interno})` : "",
        it ? fechaCorta(it.fecha) : "",
        "",
      ];
    });

    autoTable(doc, {
      startY: y + alto,
      margin: { left: x, right: x },
      theme: "grid",
      styles: { fontSize: 8.5, lineColor: [0, 0, 0], lineWidth: 0.3, valign: "middle", minCellHeight: 11.2, textColor: 0 },
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold", halign: "center", minCellHeight: 5 },
      head: [["No.", "UEI / CODIGO EI", "FECHA", "FIRMA"]],
      body,
      columnStyles: {
        0: { cellWidth: 9, halign: "center" },
        1: { cellWidth: ancho * 0.51 - 9 },
        2: { cellWidth: ancho * 0.175, halign: "center" },
        3: { cellWidth: ancho * 0.315 },
      },
    });
    doc.setFontSize(8);
    doc.text("SI-P2-F3", W - x, doc.internal.pageSize.getHeight() - 8, { align: "right" });
  }

  doc.save(`LISTA_VERIFICACION_MTTO_${MESES[plan.mes - 1]}_${plan.anio}.pdf`);
}
