// Acepta tanto "INT. LOCACIÓN - DÍA" (guion) como "EXT. LOCACIÓN. DÍA" (puntos)
export const ENCABEZADO_RE = /^(INT\/EXT|INT|EXT)\.?\s*(.+?)\s*[-.]\s*(D[IÍ]A|NOCHE|AMANECER|ATARDECER)\.?\s*$/i;

// Devuelve, para cada encabezado de escena detectado (en orden), el fragmento de texto
// del guion desde ese encabezado hasta justo antes del siguiente (o el final del guion).
export function extraerSegmentosPorEscena(contenido: string): string[] {
  const lineas = contenido.split("\n");
  const indicesEncabezado: number[] = [];
  lineas.forEach((linea, i) => {
    if (ENCABEZADO_RE.test(linea.trim())) indicesEncabezado.push(i);
  });

  return indicesEncabezado.map((inicio, idx) => {
    const fin = idx + 1 < indicesEncabezado.length ? indicesEncabezado[idx + 1] : lineas.length;
    return lineas.slice(inicio, fin).join("\n").trim();
  });
}
