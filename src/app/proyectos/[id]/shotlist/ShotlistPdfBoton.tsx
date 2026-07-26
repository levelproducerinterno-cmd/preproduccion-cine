"use client";

import { useState } from "react";
import { obtenerShotlistCompleto } from "./actions";
import { crearDocumentoConMachote, finalizarConPiePagina, imagenUrlABase64 } from "@/lib/pdf-machote";

export default function ShotlistPdfBoton({
  proyectoId,
  nombreProyecto,
  logoUrl,
  colorPrimario,
}: {
  proyectoId: string;
  nombreProyecto: string;
  logoUrl: string | null;
  colorPrimario: string;
}) {
  const [cargando, setCargando] = useState(false);

  async function descargar() {
    setCargando(true);
    const { escenas, tomas } = await obtenerShotlistCompleto(proyectoId);
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const doc = await crearDocumentoConMachote({
      tituloDocumento: "Shotlist",
      proyectoNombre: nombreProyecto,
      logoUrl,
      colorPrimario,
    });

    let y = 40;
    const columnas = [
      "Ref.",
      "Setup#",
      "Shot#",
      "Subject",
      "Shot size",
      "Cámara",
      "Ángulo",
      "Movimiento",
      "Equipo",
      "Lente",
      "Sonido",
      "Descripción",
      "Notas",
      "Importancia",
    ];

    for (const esc of escenas) {
      const tomasEscena = tomas.filter((t) => t.escena_id === esc.id);
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(
        `Escena ${esc.numero} — ${esc.int_ext ?? "?"}. ${esc.locacion ?? "Sin locación"} - ${esc.momento ?? "?"}`,
        14,
        y
      );
      y += 5;

      if (tomasEscena.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Sin tomas capturadas.", 14, y + 4);
        y += 12;
        continue;
      }

      const imagenesDataUrl = await Promise.all(
        tomasEscena.map((t) => (t.imagen_url ? imagenUrlABase64(t.imagen_url) : Promise.resolve(null)))
      );

      const filas = tomasEscena.map((t) => [
        "",
        t.setup_num ?? "-",
        t.shot_num ?? "-",
        t.subject ?? "-",
        t.shot_size ?? "-",
        t.camara ?? "-",
        t.angulo ?? "-",
        t.movimiento ?? "-",
        t.equipo ?? "-",
        t.lente ?? "-",
        t.sonido ?? "-",
        t.descripcion ?? "-",
        t.notas ?? "-",
        t.importancia,
      ]);

      autoTable(doc, {
        startY: y,
        head: [columnas],
        body: filas,
        theme: "grid",
        styles: { fontSize: 6.5, cellPadding: 1.5, overflow: "linebreak" },
        headStyles: { fillColor: [10, 9, 8], textColor: 255 },
        columnStyles: { 0: { cellWidth: 12, minCellHeight: 12 } },
        margin: { left: 14, right: 14 },
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index === 0) {
            const url = imagenesDataUrl[data.row.index];
            if (url) {
              try {
                doc.addImage(url, data.cell.x + 1, data.cell.y + 1, 9, 9);
              } catch {
                // formato no soportado, se omite
              }
            }
          }
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    await finalizarConPiePagina(doc);
    doc.save(`shotlist-${nombreProyecto.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setCargando(false);
  }

  return (
    <button
      onClick={descargar}
      disabled={cargando}
      className="rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
    >
      {cargando ? "Generando PDF..." : "Descargar shotlist en PDF"}
    </button>
  );
}
