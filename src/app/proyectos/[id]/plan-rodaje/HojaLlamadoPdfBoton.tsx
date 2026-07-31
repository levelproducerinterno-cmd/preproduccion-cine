"use client";

import { useState } from "react";
import type { DiaRodaje, DiaRodajeLocacion, DiaRodajeCrewLlamado, Talento, DiaRodajeTalentoLlamado } from "@/lib/types";
import type { RenglonPlan, CrewParaLlamado } from "./PlanRodajeView";
import { crearDocumentoConMachote, finalizarConPiePagina } from "@/lib/pdf-machote";

export default function HojaLlamadoPdfBoton({
  proyectoNombre,
  logoUrl,
  colorPrimario,
  dias,
  renglonesPorDia,
  locaciones,
  crew,
  crewLlamados,
  talento,
  talentoLlamados,
}: {
  proyectoNombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  dias: DiaRodaje[];
  renglonesPorDia: Record<string, RenglonPlan[]>;
  locaciones: DiaRodajeLocacion[];
  crew: CrewParaLlamado[];
  crewLlamados: DiaRodajeCrewLlamado[];
  talento: Talento[];
  talentoLlamados: DiaRodajeTalentoLlamado[];
}) {
  const [cargando, setCargando] = useState(false);

  async function descargar() {
    setCargando(true);
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const doc = await crearDocumentoConMachote({
      tituloDocumento: "Hoja de Llamado",
      proyectoNombre,
      logoUrl,
      colorPrimario,
    });

    let primero = true;
    for (const dia of dias) {
      if (!primero) doc.addPage();
      primero = false;
      let y = 40;

      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(`Hoja de llamado — Día ${dia.numero}`, 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90);
      doc.text(
        `Fecha: ${dia.fecha ?? "-"}   Hora general: ${dia.llamado_general ?? "-"}   Jornada: ${dia.jornada_horas ?? "-"}   Ready to shoot: ${dia.ready_to_shoot ?? "-"}`,
        14,
        y
      );
      y += 6;

      const locacionesDia = locaciones.filter((l) => l.dia_rodaje_id === dia.id);
      if (locacionesDia.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Locaciones", "Link"]],
          body: locacionesDia.map((l) => [l.nombre, l.url_maps ?? "-"]),
          theme: "grid",
          styles: { fontSize: 7.5, cellPadding: 1.5 },
          headStyles: { fillColor: [10, 9, 8], textColor: 255 },
          margin: { left: 14, right: 14 },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      const llamadoPorCrew = new Map(crewLlamados.filter((c) => c.dia_rodaje_id === dia.id).map((c) => [c.proyecto_crew_id, c]));
      autoTable(doc, {
        startY: y,
        head: [["Puesto", "Nombre", "Llamado", "Locación"]],
        body: crew.map((c) => {
          const ll = llamadoPorCrew.get(c.id);
          return [c.puesto_especifico ?? "-", c.personas.nombre, ll?.llamado || dia.llamado_general || "-", ll?.locacion_url ?? "-"];
        }),
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 1.5 },
        headStyles: { fillColor: [10, 9, 8], textColor: 255 },
        margin: { left: 14, right: 14 },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 6;

      const llamadoPorTalento = new Map(talentoLlamados.filter((t) => t.dia_rodaje_id === dia.id).map((t) => [t.talento_id, t]));
      if (talento.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Personaje", "Nombre", "Llamado", "Locación"]],
          body: talento.map((t) => {
            const ll = llamadoPorTalento.get(t.id);
            return [
              t.personaje ?? "-",
              t.nombre,
              `${ll?.llamado_desde ?? "-"} - ${ll?.llamado_hasta ?? "-"}`,
              ll?.locacion_url ?? "-",
            ];
          }),
          theme: "grid",
          styles: { fontSize: 7.5, cellPadding: 1.5 },
          headStyles: { fillColor: [10, 9, 8], textColor: 255 },
          margin: { left: 14, right: 14 },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 6;
      }

      const renglones = renglonesPorDia[dia.id] ?? [];
      if (renglones.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Hora", "Plan de rodaje"]],
          body: renglones.map((r) => [
            r.tipo === "bloque" ? r.hora ?? "" : r.toma.hora_inicio ?? "",
            r.tipo === "bloque" ? r.descripcion : r.toma.descripcion ?? r.escena.locacion ?? "-",
          ]),
          theme: "grid",
          styles: { fontSize: 7.5, cellPadding: 1.5 },
          headStyles: { fillColor: [10, 9, 8], textColor: 255 },
          margin: { left: 14, right: 14 },
        });
      }
    }

    await finalizarConPiePagina(doc);
    doc.save(`hoja-de-llamado-${proyectoNombre.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setCargando(false);
  }

  return (
    <button
      onClick={descargar}
      disabled={cargando}
      className="rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
    >
      {cargando ? "Generando PDF..." : "Descargar Hojas de Llamado en PDF"}
    </button>
  );
}
