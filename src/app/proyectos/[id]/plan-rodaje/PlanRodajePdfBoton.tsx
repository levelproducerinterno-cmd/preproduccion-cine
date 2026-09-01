"use client";

import { useState } from "react";
import type { DiaRodaje } from "@/lib/types";
import type { RenglonPlan } from "./PlanRodajeView";
import { crearDocumentoConMachote, finalizarConPiePagina } from "@/lib/pdf-machote";
import { colorEscenaRGB, LEYENDA_COLORES_RGB } from "./colorEscena";

export default function PlanRodajePdfBoton({
  proyectoNombre,
  logoUrl,
  colorPrimario,
  dias,
  renglonesPorDia,
}: {
  proyectoNombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  dias: DiaRodaje[];
  renglonesPorDia: Record<string, RenglonPlan[]>;
}) {
  const [cargando, setCargando] = useState(false);

  async function descargar() {
    setCargando(true);
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const doc = await crearDocumentoConMachote({
      tituloDocumento: "Plan de Rodaje",
      proyectoNombre,
      logoUrl,
      colorPrimario,
    });
    let y = 40;
    const columnas = ["Escena", "Hora", "Tiempo", "Plano", "Día/Noche", "Set", "Descripción", "Talento", "Locación", "Arte"];

    for (const dia of dias) {
      const renglones = renglonesPorDia[dia.id] ?? [];
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(
        `Día ${dia.numero}${dia.fecha ? ` — ${dia.fecha}` : ""}${dia.llamado_general ? ` — Llamado ${dia.llamado_general}` : ""}`,
        14,
        y
      );
      y += 5;

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      let xLeyenda = 14;
      for (const l of LEYENDA_COLORES_RGB) {
        doc.setFillColor(l.rgb[0], l.rgb[1], l.rgb[2]);
        doc.setDrawColor(200);
        doc.rect(xLeyenda, y - 2.5, 3, 3, "FD");
        doc.setTextColor(90);
        doc.text(l.etiqueta, xLeyenda + 4.5, y);
        xLeyenda += doc.getTextWidth(l.etiqueta) + 10;
      }
      y += 4;

      const filas = renglones.map((r) =>
        r.tipo === "bloque"
          ? ["", r.hora ?? "", { content: r.descripcion, colSpan: 8 }]
          : [
              r.escena.numero,
              r.toma.hora_inicio ?? "-",
              r.toma.tiempo_estimado ?? "-",
              r.toma.shot_num || r.toma.setup_num || "-",
              r.escena.momento ?? "-",
              r.toma.set_especifico || r.escena.locacion || "-",
              r.toma.descripcion ?? "-",
              r.toma.talento_en_toma || r.toma.subject || "-",
              r.escena.locacion ?? "-",
              r.toma.notas_arte ?? "-",
            ]
      );

      autoTable(doc, {
        startY: y,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        head: [columnas as any],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: filas as any,
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 1.5, overflow: "linebreak" },
        headStyles: { fillColor: [10, 9, 8], textColor: 255 },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.row.raw && Array.isArray(data.row.raw) && data.row.raw.length === 3) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [225, 225, 225];
          } else if (data.section === "body") {
            const renglon = renglones[data.row.index];
            if (renglon && renglon.tipo === "toma") {
              data.cell.styles.fillColor = colorEscenaRGB(renglon.escena);
            }
          }
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (dias.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("Aún no hay días de rodaje creados.", 14, y);
    }

    await finalizarConPiePagina(doc);
    doc.save(`plan-de-rodaje-${proyectoNombre.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setCargando(false);
  }

  return (
    <button
      onClick={descargar}
      disabled={cargando}
      className="rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
    >
      {cargando ? "Generando PDF..." : "Descargar Plan de Rodaje en PDF"}
    </button>
  );
}
