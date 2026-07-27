import type { PresentacionArteDatos, PresentacionDireccionDatos } from "./types";

export function datosArtePorDefecto(): PresentacionArteDatos {
  return {
    portada: { nombreDirector: "", imagen: null },
    emociones: {
      comoSeSiente: "",
      aQuienVaDirigido: "",
      queEmocionTransmite: "",
      emocionesPredominantes: "",
    },
    galeria: Array(9).fill(null),
    descripcion: {
      emocionesAEvitar: "",
      recuerdosOSensaciones: "",
      siFueraPersona: "",
      colores: ["#000000", "#000000", "#000000", "#000000"],
    },
    persona: { descripcion: "", imagenIzquierda: null, imagenDerecha: null },
    palabraEmocion: { texturas: "", objetosFisicos: "", materiales: "" },
    texturas: { justificacion: "", imagenes: [null, null, null] },
    ambiente: { justificacion: "", imagenes: [null, null, null] },
    objetoClave: {
      justificacion: "",
      items: [
        { imagen: null, detalle: "Detalles aquí" },
        { imagen: null, detalle: "Detalles aquí" },
        { imagen: null, detalle: "Detalles aquí" },
      ],
    },
    moodboard: { imagen: null },
  };
}

export function datosDireccionPorDefecto(): PresentacionDireccionDatos {
  return {
    portada: { logline: "", imagen: null },
    peliculasSimilares: { parrafo: "", imagenes: [null, null] },
    ubicacionDivisor: { imagen: null },
    ubicaciones: [
      { titulo: "Ubicación 1", justificacion: "", imagenes: [null, null, null] },
      { titulo: "Ubicación 2", justificacion: "", imagenes: [null, null, null] },
    ],
    fotografiaDivisor: { imagen: null },
    fotografia: {
      parrafo: "",
      items: [
        { imagen: null, detalle: "Detalles aquí" },
        { imagen: null, detalle: "Detalles aquí" },
        { imagen: null, detalle: "Detalles aquí" },
      ],
    },
    vestuarioDivisor: { imagen: null },
    personajes: [
      { nombre: "", descripcion: "", imagenIzquierda: null, imagenDerecha: null },
      { nombre: "", descripcion: "", imagenIzquierda: null, imagenDerecha: null },
    ],
    galeriaFinal: Array(10).fill(null),
  };
}

export function fusionarConDefault<T>(defecto: T, guardado: unknown): T {
  if (!guardado || typeof guardado !== "object") return defecto;
  return { ...defecto, ...(guardado as object) } as T;
}
