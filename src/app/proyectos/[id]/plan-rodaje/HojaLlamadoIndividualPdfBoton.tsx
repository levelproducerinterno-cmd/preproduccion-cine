"use client";

import { useState } from "react";
import type { DiaRodaje, DiaRodajeTalentoLlamado, Talento } from "@/lib/types";
import { crearDocumentoConMachote, finalizarConPiePagina } from "@/lib/pdf-machote";

export default function HojaLlamadoIndividualPdfBoton({
  proyectoNombre,
  logoUrl,
  colorPrimario,
  talento,
  dias,
  talentoLlamados,
}: {
  proyectoNombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  talento: Pick<Talento, "nombre" | "personaje" | "telefono">;
  dias: DiaRodaje[];
  talentoLlamados: DiaRodajeTalentoLlamado[];
}) {
  const [cargando, setCargando] = useState(false);

  async function descargar() {
    setCargando(true);
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const doc = await crearDocumentoConMachote({
      tituloDocumento: `Hoja de Llamado — ${talento.personaje || talento.nombre}`,
      proyectoNombre,
      logoUrl,
      colorPrimario,
    });

    let y = 40;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(talento.personaje ? `${talento.personaje} — ${talento.nombre}` : talento.nombre, 14, y);
    y += 5;
    if (talento.telefono) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90);
      doc.text(`Tel. ${talento.telefono}`, 14, y);
      y += 7;
    } else {
      y += 3;
    }

    const llamadoPorDia = new Map(talentoLlamados.map((t) => [t.dia_rodaje_id, t]));
    const diasConLlamado = dias.filter((d) => {
      const ll = llamadoPorDia.get(d.id);
      return ll && !ll.no_se_ocupa;
    });

    if (diasConLlamado.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Día", "Fecha", "Llamado", "Locación"]],
        body: diasConLlamado.map((d) => {
          const ll = llamadoPorDia.get(d.id)!;
          return [
            `Día ${d.numero}`,
            d.fecha ?? "-",
            `${ll.llamado_desde ?? "-"} - ${ll.llamado_hasta ?? "-"}`,
            ll.locacion_url || "-",
          ];
        }),
        theme: "grid",
        styles: { fontSize: 8.5, cellPadding: 2 },
        headStyles: { fillColor: [10, 9, 8], textColor: 255 },
        margin: { left: 14, right: 14 },
      });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("Todavía no hay llamados capturados para este personaje.", 14, y);
    }

    await finalizarConPiePagina(doc);
    doc.save(`hoja-de-llamado-${(talento.personaje || talento.nombre).replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setCargando(false);
  }

  return (
    <button
      onClick={descargar}
      disabled={cargando}
      className="rounded border border-neutral-300 px-2 py-1 text-[0.65rem] font-semibold text-neutral-500 hover:border-rojo hover:text-rojo disabled:opacity-50"
    >
      {cargando ? "..." : "Hoja individual"}
    </button>
  );
}
