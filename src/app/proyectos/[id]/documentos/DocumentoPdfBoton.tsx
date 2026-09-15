"use client";

import { useMemo, useState } from "react";
import { crearDocumentoConMachote, finalizarConPiePagina, imagenUrlABase64 } from "@/lib/pdf-machote";

function etiquetaCampo(campo: string) {
  const texto = campo.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Encuentra los {{campo}} del texto, en el orden en que aparecen y sin
// repetidos. "proyecto" se excluye porque se llena solo con el nombre del
// proyecto, no hace falta pedirlo.
function extraerCampos(cuerpo: string) {
  const encontrados = cuerpo.match(/\{\{\s*[a-z0-9_]+\s*\}\}/gi) ?? [];
  const nombres = encontrados.map((m) => m.replace(/[{}]/g, "").trim().toLowerCase());
  const unicos: string[] = [];
  for (const n of nombres) {
    if (n !== "proyecto" && !unicos.includes(n)) unicos.push(n);
  }
  return unicos;
}

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
  const campos = useMemo(() => extraerCampos(cuerpo), [cuerpo]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [abierto, setAbierto] = useState(false);
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
    const nombreGeneradoPara = valores["nombre"]?.trim() || valores["cliente"]?.trim() || valores["prestador"]?.trim();
    if (nombreGeneradoPara) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text(`Generado para: ${nombreGeneradoPara}`, 14, y);
      y += 8;
    }

    let cuerpoFinal = cuerpo.replace(/\{\{\s*proyecto\s*\}\}/gi, proyectoNombre);
    for (const campo of campos) {
      const patron = new RegExp(`\\{\\{\\s*${campo}\\s*\\}\\}`, "gi");
      cuerpoFinal = cuerpoFinal.replace(patron, valores[campo]?.trim() || "____________________");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lineas = doc.splitTextToSize(cuerpoFinal, 182);
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

  if (campos.length === 0) {
    return (
      <button
        onClick={descargar}
        disabled={cargando}
        className="rounded bg-rojo px-3 py-1.5 text-xs font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
      >
        {cargando ? "Generando..." : "Descargar PDF"}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setAbierto((a) => !a)}
        className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:border-rojo hover:text-rojo"
      >
        {abierto ? "Ocultar campos" : `Llenar datos y descargar (${campos.length})`}
      </button>
      {abierto && (
        <div className="mt-3 grid gap-2 rounded border border-neutral-100 bg-neutral-50 p-3 sm:grid-cols-2">
          {campos.map((campo) => (
            <label key={campo} className="grid gap-0.5 text-xs">
              <span className="font-semibold text-neutral-600">{etiquetaCampo(campo)}</span>
              <input
                value={valores[campo] ?? ""}
                onChange={(e) => setValores((v) => ({ ...v, [campo]: e.target.value }))}
                placeholder="Déjalo vacío para imprimir una línea en blanco"
                className="rounded border border-neutral-300 px-2 py-1.5"
              />
            </label>
          ))}
          <button
            onClick={descargar}
            disabled={cargando}
            className="col-span-full mt-1 rounded bg-rojo px-3 py-2 text-sm font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
          >
            {cargando ? "Generando..." : "Descargar PDF"}
          </button>
        </div>
      )}
    </div>
  );
}
