// Supabase Storage rechaza ciertos caracteres en el nombre del archivo (key),
// como espacios, parentesis y acentos -- comunes en capturas de pantalla y
// fotos de celular ("Captura de pantalla ... a la(s) 6.11.34 p.m..png").
// Esto los reemplaza por guiones para que la subida nunca falle por el nombre.
export function sanitizarNombreArchivo(nombre: string): string {
  return nombre.replace(/[^a-zA-Z0-9.-]/g, "-").replace(/-+/g, "-");
}
