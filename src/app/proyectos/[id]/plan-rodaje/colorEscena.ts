import type { Escena } from "@/lib/types";

const EXT_DIA = "bg-orange-50";
const INT_DIA = "bg-yellow-50";
const EXT_NOCHE = "bg-indigo-50";
const INT_NOCHE = "bg-purple-50";

export function colorEscena(escena: Pick<Escena, "int_ext" | "momento">) {
  const exterior = escena.int_ext === "EXT";
  const noche = escena.momento === "NOCHE" || escena.momento === "ATARDECER";
  if (exterior && noche) return EXT_NOCHE;
  if (!exterior && noche) return INT_NOCHE;
  if (exterior && !noche) return EXT_DIA;
  return INT_DIA;
}

export const LEYENDA_COLORES = [
  { etiqueta: "Ext. Día", clase: EXT_DIA },
  { etiqueta: "Int. Día", clase: INT_DIA },
  { etiqueta: "Ext. Noche", clase: EXT_NOCHE },
  { etiqueta: "Int. Noche", clase: INT_NOCHE },
];

// Mismos tonos que las clases bg-*-50 de Tailwind, en RGB para usar en el PDF
// (jsPDF no puede leer clases de Tailwind).
const EXT_DIA_RGB: [number, number, number] = [255, 247, 237];
const INT_DIA_RGB: [number, number, number] = [254, 252, 232];
const EXT_NOCHE_RGB: [number, number, number] = [238, 242, 255];
const INT_NOCHE_RGB: [number, number, number] = [250, 245, 255];

export function colorEscenaRGB(escena: Pick<Escena, "int_ext" | "momento">): [number, number, number] {
  const exterior = escena.int_ext === "EXT";
  const noche = escena.momento === "NOCHE" || escena.momento === "ATARDECER";
  if (exterior && noche) return EXT_NOCHE_RGB;
  if (!exterior && noche) return INT_NOCHE_RGB;
  if (exterior && !noche) return EXT_DIA_RGB;
  return INT_DIA_RGB;
}

export const LEYENDA_COLORES_RGB = [
  { etiqueta: "Ext. Día", rgb: EXT_DIA_RGB },
  { etiqueta: "Int. Día", rgb: INT_DIA_RGB },
  { etiqueta: "Ext. Noche", rgb: EXT_NOCHE_RGB },
  { etiqueta: "Int. Noche", rgb: INT_NOCHE_RGB },
];
