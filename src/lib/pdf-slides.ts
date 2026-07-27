import type jsPDF from "jspdf";
import { imagenUrlABase64 } from "./pdf-machote";

// Ancho/alto en mm de una diapositiva 16:9 (mismo estándar que PowerPoint widescreen).
export const SLIDE_W = 338.67;
export const SLIDE_H = 190.5;

export async function crearDocSlides() {
  const { jsPDF } = await import("jspdf");
  return new jsPDF({ orientation: "landscape", unit: "mm", format: [SLIDE_W, SLIDE_H] });
}

function cargarImagen(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

// Recorta (crop) una imagen para llenar exactamente una caja de proporción targetW:targetH
// sin deformarla (equivalente a object-fit: cover). Devuelve un dataURL JPEG ya recortado,
// listo para pasar a doc.addImage con el ancho/alto exactos de la caja.
export async function recortarImagenACover(
  url: string,
  targetW: number,
  targetH: number
): Promise<string | null> {
  const dataUrl = await imagenUrlABase64(url);
  if (!dataUrl) return null;
  const img = await cargarImagen(dataUrl);
  if (!img) return null;

  const proporcionCaja = targetW / targetH;
  const proporcionImg = img.naturalWidth / img.naturalHeight;

  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (proporcionImg > proporcionCaja) {
    // La imagen es más ancha que la caja: recortamos los lados.
    sw = img.naturalHeight * proporcionCaja;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    // La imagen es más alta que la caja: recortamos arriba/abajo.
    sh = img.naturalWidth / proporcionCaja;
    sy = (img.naturalHeight - sh) / 2;
  }

  const canvas = document.createElement("canvas");
  const escala = 3; // resolución razonable para impresión sin generar archivos enormes
  canvas.width = Math.round(targetW * escala);
  canvas.height = Math.round(targetH * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export async function agregarImagenCover(
  doc: jsPDF,
  url: string | null | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  colorFondo: [number, number, number] = [20, 20, 20]
) {
  doc.setFillColor(...colorFondo);
  doc.rect(x, y, w, h, "F");
  if (!url) return;
  try {
    const recortada = await recortarImagenACover(url, w, h);
    if (recortada) doc.addImage(recortada, "JPEG", x, y, w, h);
  } catch {
    // si la imagen no se puede procesar, se deja el fondo sólido
  }
}

export function hexARgbSlide(hex: string): [number, number, number] {
  const limpio = (hex || "#c72a09").replace("#", "");
  const num = parseInt(limpio.length === 3 ? limpio.split("").map((c) => c + c).join("") : limpio, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
