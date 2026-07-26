"use client";

import { useState } from "react";
import { crearDocumentoConMachote, finalizarConPiePagina, imagenUrlABase64 } from "@/lib/pdf-machote";

export default function DocumentoPdfBoton({
  nombrePlantilla,
  cuerpo,
  proyectoNombre,
  logoUrl,
  colorPrimario,
  firmaUrl,
  nombreResponsable,
}: {
  nombrePlantilla: string;
  cuerpo: string;
  proyectoNombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  firmaUrl: string | null;
  nombreResponsable: string | null;
}) {
  const [paraQuien, setParaQuien] = useState("");
  const [cargando, setCargando] = useState(false);

  async function descargar() {
    setCargando(true);

    const doc = await crearDocumentoConMachote({
      tituloDocumento: nombrePlantilla,
      proyectoNombre,
      logoUrl,
      colorPrimario,
    });

    let y = 42;
    if (paraQuien.trim()) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(`Generado para: ${paraQuien.trim()}`, 14, y);
      y += 8;
    }

    const cuerpoConNombre = cuerpo.replace(/\{\{\s*nombre\s*\}\}/gi, paraQuien.trim() || "____________________");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lineas = doc.splitTextToSize(cuerpoConNombre, 182);
    for (const linea of lineas) {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.text(linea, 14, y);
      y += 5.5;
    }

    y += 12;
    if (y > 250) {
      doc.addPage();
      y = 30;
    }

    if (firmaUrl) {
      const firmaDataUrl = await imagenUrlABase64(firmaUrl);
      if (firmaDataUrl) {
        try {
          doc.addImage(firmaDataUrl, 14, y, 40, 18);
        } catch {
          // formato no soportado, se omite
        }
      }
    }
    doc.setDrawColor(150);
    doc.line(14, y + 20, 70, y + 20);
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(nombreResponsable || "Responsable", 14, y + 25);
    doc.text("Firma del responsable", 14, y + 29);

    await finalizarConPiePagina(doc);
    doc.save(`${nombrePlantilla.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setCargando(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={paraQuien}
        onChange={(e) => setParaQuien(e.target.value)}
        placeholder="Generado para (opcional)"
        className="rounded border border-neutral-300 px-2 py-1.5 text-xs"
      />
      <button
        onClick={descargar}
        disabled={cargando}
        className="rounded bg-rojo px-3 py-1.5 text-xs font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
      >
        {cargando ? "Generando..." : "Descargar PDF"}
      </button>
    </div>
  );
}
