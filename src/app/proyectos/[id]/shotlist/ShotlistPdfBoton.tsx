"use client";

import { useState } from "react";
import { obtenerShotlistCompleto } from "./actions";

async function imagenABase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function ShotlistPdfBoton({ proyectoId, nombreProyecto }: { proyectoId: string; nombreProyecto: string }) {
  const [cargando, setCargando] = useState(false);

  async function descargar() {
    setCargando(true);
    const { escenas, tomas } = await obtenerShotlistCompleto(proyectoId);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    let y = 20;
    doc.setFontSize(16);
    doc.text(`Shotlist — ${nombreProyecto}`, 14, y);
    y += 12;

    for (const esc of escenas) {
      const tomasEscena = tomas.filter((t) => t.escena_id === esc.id);
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `Escena ${esc.numero} — ${esc.int_ext ?? "?"}. ${esc.locacion ?? "Sin locación"} - ${esc.momento ?? "?"}`,
        14,
        y
      );
      y += 8;

      if (tomasEscena.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Sin tomas capturadas.", 14, y);
        y += 8;
        continue;
      }

      for (const t of tomasEscena) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Setup ${t.setup_num ?? "-"} / Shot ${t.shot_num ?? "-"} — ${t.subject ?? ""}`, 18, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        const linea1 = `${t.shot_size ?? ""} · ${t.camara ?? ""} · ${t.angulo ?? ""} · ${t.movimiento ?? ""} · ${t.equipo ?? ""} · ${t.lente ?? ""} · ${t.sonido ?? ""}`;
        doc.text(doc.splitTextToSize(linea1, 170), 18, y);
        y += 5;
        if (t.descripcion) {
          doc.text(doc.splitTextToSize(`Desc: ${t.descripcion}`, 170), 18, y);
          y += 5;
        }
        if (t.notas) {
          doc.text(doc.splitTextToSize(`Notas: ${t.notas}`, 170), 18, y);
          y += 5;
        }
        if (t.imagen_url) {
          const dataUrl = await imagenABase64(t.imagen_url);
          if (dataUrl) {
            if (y > 220) {
              doc.addPage();
              y = 20;
            }
            try {
              doc.addImage(dataUrl, "JPEG", 18, y, 40, 30);
            } catch {
              // formato no soportado, se omite
            }
            y += 34;
          }
        }
        y += 3;
      }
      y += 4;
    }

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
