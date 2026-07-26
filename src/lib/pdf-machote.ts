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

function dimensionesDeImagen(dataUrl: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

// Calcula el tamaño (mm) que debe tener una imagen para caber dentro de una caja
// máxima sin deformarse (mantiene su proporción real).
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
    const natural = dataUrl ? await dimensionesDeImagen(dataUrl) : null;
    if (dataUrl && natural) {
      try {
        const { ancho, alto } = ajustarACaja(natural, 22, 16);
        // Centrado verticalmente en la franja del encabezado (8 a 26mm aprox.)
        const yImg = 8 + (18 - alto) / 2;
        doc.addImage(dataUrl, x, yImg, ancho, alto);
        x += ancho + 8;
      } catch {
        // formato de imagen no soportado por jsPDF, se omite el logo
      }
    }
  }

  const [r, g, b] = hexARgb(opts.colorPrimario || "#c72a09");
  doc.setFontSize(15);
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.text(opts.proyectoNombre, x, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(opts.tituloDocumento, x, 22);

  const fecha = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Generado el ${fecha}`, x, 27);

  doc.setDrawColor(225);
  doc.line(14, 32, 196, 32);
  doc.setTextColor(0);

  return doc;
}

// Agrega el pie de página (número de página + marca de Level.Producer.System) a todas
// las páginas del documento. Llamar justo antes de doc.save().
export async function finalizarConPiePagina(doc: jsPDF) {
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const margen = 14;
  const yBase = altoPagina - 10;

  const logoDataUrl = await imagenUrlABase64("/level-logo.png");
  const logoNatural = logoDataUrl ? await dimensionesDeImagen(logoDataUrl) : null;

  const totalPaginas = doc.getNumberOfPages();
  const textoMarca = "Level.Producer.System";

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);

    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.setFont("helvetica", "normal");
    doc.text(`Página ${i} de ${totalPaginas}`, margen, yBase);

    doc.setFontSize(7);
    const anchoTexto = doc.getTextWidth(textoMarca);

    if (logoDataUrl && logoNatural) {
      const { ancho, alto } = ajustarACaja(logoNatural, 12, 6);
      const espacio = 2;
      const anchoTotal = ancho + espacio + anchoTexto;
      const xInicio = anchoPagina - margen - anchoTotal;
      try {
        doc.addImage(logoDataUrl, xInicio, yBase - alto + 1.5, ancho, alto);
        doc.text(textoMarca, xInicio + ancho + espacio, yBase);
      } catch {
        doc.text(textoMarca, anchoPagina - margen, yBase, { align: "right" });
      }
    } else {
      doc.text(textoMarca, anchoPagina - margen, yBase, { align: "right" });
    }
  }
}
