"use client";

import { useState } from "react";
import { obtenerRespuestasPersona } from "./actions";
import { crearDocumentoConMachote, finalizarConPiePagina } from "@/lib/pdf-machote";

export default function DescargarPdfBoton({
  crewId,
  proyectoNombre,
  logoUrl,
  colorPrimario,
}: {
  crewId: string;
  proyectoNombre: string;
  logoUrl: string | null;
  colorPrimario: string;
}) {
  const [cargando, setCargando] = useState(false);

  async function descargar() {
    setCargando(true);
    const datos = await obtenerRespuestasPersona(crewId);
    if (!datos) {
      setCargando(false);
      return;
    }

    const doc = await crearDocumentoConMachote({
      tituloDocumento: "Datos de producción",
      proyectoNombre,
      logoUrl,
      colorPrimario,
    });

    doc.setFontSize(11);
    doc.text(datos.nombre, 14, 42);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`${datos.email}${datos.puesto ? " · " + datos.puesto : ""}`, 14, 48);

    let y = 58;
    doc.setTextColor(0);
    for (const item of datos.items) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const preguntaLines = doc.splitTextToSize(item.texto, 180);
      doc.text(preguntaLines, 14, y);
      y += preguntaLines.length * 5 + 2;

      doc.setFont("helvetica", "normal");
      const respuestaLines = doc.splitTextToSize(item.respuesta || "(sin responder)", 180);
      doc.text(respuestaLines, 14, y);
      y += respuestaLines.length * 5 + 6;
    }

    await finalizarConPiePagina(doc);
    doc.save(`datos-produccion-${datos.nombre.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setCargando(false);
  }

  return (
    <button
      onClick={descargar}
      disabled={cargando}
      className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:border-rojo hover:text-rojo disabled:opacity-50"
    >
      {cargando ? "Generando..." : "Descargar PDF"}
    </button>
  );
}
