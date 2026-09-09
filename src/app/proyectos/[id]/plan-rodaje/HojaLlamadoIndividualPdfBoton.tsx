"use client";

import { useState } from "react";
import type { DiaRodaje, DiaRodajeTalentoLlamado, DiaRodajeTalentoFoto, Talento } from "@/lib/types";
import { crearDocumentoConMachote, finalizarConPiePagina, imagenUrlABase64 } from "@/lib/pdf-machote";
import type { RenglonPlan } from "./PlanRodajeView";

function dimensionesDeImagen(dataUrl: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function ajustarACaja(natural: { w: number; h: number }, maxAncho: number, maxAlto: number) {
  const proporcion = natural.w / natural.h;
  let ancho = maxAncho;
  let alto = ancho / proporcion;
  if (alto > maxAlto) {
    alto = maxAlto;
    ancho = alto * proporcion;
  }
  return { ancho, alto };
}

export default function HojaLlamadoIndividualPdfBoton({
  proyectoNombre,
  logoUrl,
  colorPrimario,
  talento,
  dias,
  talentoLlamados,
  fotosVestuario,
  renglonesPorDia,
}: {
  proyectoNombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  talento: Pick<Talento, "nombre" | "personaje" | "telefono">;
  dias: DiaRodaje[];
  talentoLlamados: DiaRodajeTalentoLlamado[];
  fotosVestuario: DiaRodajeTalentoFoto[];
  renglonesPorDia: Record<string, RenglonPlan[]>;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 8;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text("Todavía no hay llamados capturados para este personaje.", 14, y);
      y += 8;
    }

    for (const d of diasConLlamado) {
      const ll = llamadoPorDia.get(d.id)!;
      const fotosDia = fotosVestuario.filter((f) => f.dia_rodaje_id === d.id);
      const renglones = renglonesPorDia[d.id] ?? [];

      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      if (renglones.length > 0) {
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text(`Día ${d.numero} — Qué se rueda`, 14, y);
        y += 5;

        autoTable(doc, {
          startY: y,
          head: [["Hora", "Descripción"]],
          body: renglones.map((r) => [
            r.tipo === "bloque" ? r.hora ?? "" : r.toma.hora_inicio ?? "",
            r.tipo === "bloque"
              ? r.descripcion
              : `Esc. ${r.escena.numero} — ${r.toma.descripcion ?? r.escena.locacion ?? ""}`.trim() || "-",
          ]),
          theme: "grid",
          styles: { fontSize: 8, cellPadding: 1.5 },
          headStyles: { fillColor: [10, 9, 8], textColor: 255 },
          margin: { left: 14, right: 14 },
          didParseCell: (data) => {
            if (data.section === "body" && renglones[data.row.index]?.tipo === "bloque") {
              data.cell.styles.fontStyle = "bold";
              data.cell.styles.fillColor = [225, 225, 225];
            }
          },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      if (!ll.indicaciones && fotosDia.length === 0) continue;

      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(`Día ${d.numero} — Indicaciones / Vestuario`, 14, y);
      y += 5;

      if (ll.indicaciones) {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(70);
        const lineas = doc.splitTextToSize(ll.indicaciones, 180);
        doc.text(lineas, 14, y);
        y += lineas.length * 4 + 2;
      }

      if (fotosDia.length > 0) {
        const cajaMax = 30;
        let x = 14;
        let alturaFila = 0;
        for (const f of fotosDia) {
          const dataUrl = await imagenUrlABase64(f.url);
          if (!dataUrl) continue;
          const natural = await dimensionesDeImagen(dataUrl);
          const { ancho, alto } = natural ? ajustarACaja(natural, cajaMax, cajaMax) : { ancho: cajaMax, alto: cajaMax };
          if (x + ancho > 196) {
            x = 14;
            y += alturaFila + 3;
            alturaFila = 0;
          }
          if (y + alto > 280) {
            doc.addPage();
            y = 20;
            x = 14;
            alturaFila = 0;
          }
          try {
            doc.addImage(dataUrl, x, y, ancho, alto);
          } catch {
            // formato no soportado, se omite
          }
          x += ancho + 3;
          alturaFila = Math.max(alturaFila, alto);
        }
        y += alturaFila + 6;
      } else {
        y += 4;
      }
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
