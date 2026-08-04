export const PASOS_PORCENTAJE = [0, 20, 50, 70, 100] as const;

export function colorBarra(p: number) {
  if (p >= 100) return "bg-verde";
  if (p <= 0) return "bg-rojo";
  return "bg-amarillo";
}

export function colorPastilla(p: number) {
  if (p >= 100) return "bg-verde/15 text-verde";
  if (p <= 0) return "bg-rojo/15 text-rojo";
  return "bg-amarillo/20 text-amarillo";
}

export function colorTarjeta(p: number) {
  if (p >= 100) return "border-verde/30 bg-verde/5";
  if (p <= 0) return "border-rojo/30 bg-rojo/5";
  return "border-amarillo/40 bg-amarillo/10";
}

export function etiquetaPorcentaje(p: number) {
  return p >= 100 ? "Hecho" : `${p}%`;
}
