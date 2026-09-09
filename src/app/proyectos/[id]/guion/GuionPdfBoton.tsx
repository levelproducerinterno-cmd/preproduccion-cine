"use client";

import { useState } from "react";
import { crearDocumentoConMachote, finalizarConPiePagina } from "@/lib/pdf-machote";

export default function GuionPdfBoton({
  proyectoNombre,
  logoUrl,
  colorPrimario,
  contenido,
}: {
  proyectoNombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  contenido: string;
}) {
  const [cargando, setCargando] = useState(false);

  async function descargar() {
    setCargando(true);

    const doc = await crearDocumentoConMachote({
      tituloDocumento: "Guion",
      proyectoNombre,
      logoUrl,
      colorPrimario,
    });

    const margenIzq = 25;
    const anchoTexto = 165;
    let y = 42;

    doc.setFont("courier", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0);

    const parrafos = contenido.split("\n");
    for (const parrafo of parrafos) {
      const lineas = parrafo.trim() ? doc.splitTextToSize(parrafo, anchoTexto) : [""];
      for (const linea of lineas) {
        if (y > 280) {
          doc.addPage();
          y = 20;
          doc.setFont("courier", "normal");
          doc.setFontSize(11);
          doc.setTextColor(0);
        }
        doc.text(linea, margenIzq, y);
        y += 5.5;
      }
    }

    await finalizarConPiePagina(doc);
    doc.save(`guion-${proyectoNombre.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setCargando(false);
  }

  return (
    <button
      onClick={descargar}
      disabled={cargando || !contenido.trim()}
      className="rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
    >
      {cargando ? "Generando PDF..." : "Descargar guion en PDF"}
    </button>
  );
}
