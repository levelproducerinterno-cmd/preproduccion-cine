import type jsPDF from "jspdf";

export async function imagenUrlABase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
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

function hexARgb(hex: string): [number, number, number] {
  const limpio = hex.replace("#", "");
  const num = parseInt(limpio.length === 3 ? limpio.split("").map((c) => c + c).join("") : limpio, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export async function crearDocumentoConMachote(opts: {
  tituloDocumento: string;
  proyectoNombre: string;
  logoUrl?: string | null;
  colorPrimario?: string;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  let x = 14;
  if (opts.logoUrl) {
    const dataUrl = await imagenUrlABase64(opts.logoUrl);
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", x, 10, 18, 18);
        x += 24;
      } catch {
        // formato de imagen no soportado por jsPDF, se omite el logo
      }
    }
  }

  const [r, g, b] = hexARgb(opts.colorPrimario || "#c72a09");
  doc.setFontSize(15);
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.text(opts.proyectoNombre, x, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(opts.tituloDocumento, x, 24);

  const fecha = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Generado el ${fecha}`, x, 29);

  doc.setDrawColor(225);
  doc.line(14, 34, 196, 34);
  doc.setTextColor(0);

  return doc;
}

// Agrega el pie de página (número de página + marca de Level.Producer.System) a todas
// las páginas del documento. Llamar justo antes de doc.save().
export async function finalizarConPiePagina(doc: jsPDF) {
  const logoLevel = await imagenUrlABase64("/level-logo.png");
  const totalPaginas = doc.getNumberOfPages();

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.setFont("helvetica", "normal");
    doc.text(`Página ${i} de ${totalPaginas}`, 14, 290);

    if (logoLevel) {
      try {
        doc.addImage(logoLevel, "PNG", 178, 281, 10, 10);
        doc.text("Level.Producer.System", 168, 293, { align: "right" });
      } catch {
        doc.text("Level.Producer.System", 196, 290, { align: "right" });
      }
    } else {
      doc.text("Level.Producer.System", 196, 290, { align: "right" });
    }
  }
}
