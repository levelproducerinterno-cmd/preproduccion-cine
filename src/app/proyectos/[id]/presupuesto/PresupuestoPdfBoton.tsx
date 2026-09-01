"use client";

import { useState } from "react";
import { crearDocumentoConMachote, finalizarConPiePagina } from "@/lib/pdf-machote";

export type ItemPresupuestoPdf = {
  rubro: string;
  objeto: string;
  cantidad: number;
  tipoUnidad: string;
  costoUnitario: number;
  subtotal: number;
  importancia: string;
  esPrestado: boolean;
  prestadoDe: string | null;
};

export type GrupoPresupuestoPdf = { departamento: string; items: ItemPresupuestoPdf[]; total: number };

const moneda = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });

export default function PresupuestoPdfBoton({
  nombreProyecto,
  logoUrl,
  colorPrimario,
  grupos,
  totalGeneral,
}: {
  nombreProyecto: string;
  logoUrl: string | null;
  colorPrimario: string;
  grupos: GrupoPresupuestoPdf[];
  totalGeneral: number;
}) {
  const [cargando, setCargando] = useState(false);

  async function descargar() {
    setCargando(true);
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const doc = await crearDocumentoConMachote({
      tituloDocumento: "Presupuesto",
      proyectoNombre: nombreProyecto,
      logoUrl,
      colorPrimario,
    });

    let y = 40;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(`Total general: ${moneda(totalGeneral)}`, 14, y);
    y += 8;

    const columnas = ["Rubro", "Objeto específico", "Cant.", "Unidad", "Costo unit.", "Subtotal", "Importancia"];

    for (const grupo of grupos) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(`${grupo.departamento} — ${moneda(grupo.total)}`, 14, y);
      y += 5;

      const filas = grupo.items.map((it) => [
        it.rubro,
        it.objeto + (it.esPrestado ? ` (Prestado${it.prestadoDe ? ` de: ${it.prestadoDe}` : ""})` : ""),
        String(it.cantidad),
        it.tipoUnidad,
        moneda(it.costoUnitario),
        moneda(it.subtotal),
        it.importancia,
      ]);

      autoTable(doc, {
        startY: y,
        head: [columnas],
        body: filas,
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 1.5, overflow: "linebreak" },
        headStyles: { fillColor: [10, 9, 8], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    await finalizarConPiePagina(doc);
    doc.save(`presupuesto-${nombreProyecto.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setCargando(false);
  }

  return (
    <button
      onClick={descargar}
      disabled={cargando || grupos.length === 0}
      className="rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
    >
      {cargando ? "Generando PDF..." : "Descargar presupuesto en PDF"}
    </button>
  );
}
