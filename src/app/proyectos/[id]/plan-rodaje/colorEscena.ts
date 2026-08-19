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
