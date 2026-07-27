export type Departamento = {
  id: string;
  nombre: string;
  orden: number;
};

export type Persona = {
  id: string;
  auth_user_id: string | null;
  nombre: string;
  email: string;
  telefono: string | null;
  color: string;
};

export type Proyecto = {
  id: string;
  nombre: string;
  tipo: string;
  fecha_dia1_rodaje: string | null;
  created_by: string | null;
  created_at: string;
  logo_url: string | null;
  color_primario: string;
  color_secundario: string;
  firma_url: string | null;
  nombre_responsable: string | null;
};

export type StatusConfirmacion = "confirmado" | "por_confirmar" | "declinado";

export type ProyectoCrew = {
  id: string;
  proyecto_id: string;
  persona_id: string;
  puesto_especifico: string | null;
  status_confirmacion: StatusConfirmacion;
  fecha_limite_confirmacion: string | null;
  fecha_confirmado: string | null;
  notas: string | null;
  personas: Persona;
  proyecto_crew_departamentos: { departamento_id: string; departamentos: Departamento }[];
};

export type Guion = {
  id: string;
  proyecto_id: string;
  titulo: string;
  version: number;
};

export type IntExt = "INT" | "EXT" | "INT/EXT";
export type Momento = "DÍA" | "NOCHE" | "AMANECER" | "ATARDECER";

export type Escena = {
  id: string;
  proyecto_id: string;
  guion_id: string;
  numero: string;
  int_ext: IntExt | null;
  locacion: string | null;
  momento: Momento | null;
  orden: number;
  dia_rodaje_numero: number | null;
  orden_del_dia: number | null;
};

export type TipoBloque =
  | "encabezado_escena"
  | "accion"
  | "personaje"
  | "dialogo"
  | "parentesis"
  | "transicion";

export type GuionBloque = {
  id: string;
  guion_id: string;
  escena_id: string | null;
  orden: number;
  tipo: TipoBloque;
  contenido: string;
};

export type DesgloseCategoria = {
  id: string;
  proyecto_id: string | null;
  nombre: string;
  es_estandar: boolean;
  orden: number;
};

export type PresupuestoItemDeElemento = {
  id: string;
  rubro_id: string;
  cantidad: number;
  tipo_unidad: string;
  costo_unitario: number;
  importancia: "Obligatorio" | "Bien si se toma";
};

export type DesgloseElemento = {
  id: string;
  escena_id: string;
  categoria_id: string;
  descripcion: string;
  notas: string | null;
  departamento_id: string | null;
  status: "pendiente" | "confirmado";
  desglose_categorias: DesgloseCategoria;
  departamentos: Departamento | null;
  presupuesto_items: PresupuestoItemDeElemento[];
};

export type ImagenSlide = string | null;

export type PresentacionArteDatos = {
  portada: { nombreDirector: string; imagen: ImagenSlide };
  emociones: {
    comoSeSiente: string;
    aQuienVaDirigido: string;
    queEmocionTransmite: string;
    emocionesPredominantes: string;
  };
  galeria: ImagenSlide[];
  descripcion: {
    emocionesAEvitar: string;
    recuerdosOSensaciones: string;
    siFueraPersona: string;
    colores: string[];
  };
  persona: { descripcion: string; imagenIzquierda: ImagenSlide; imagenDerecha: ImagenSlide };
  palabraEmocion: {
    texturas: string;
    objetosFisicos: string;
    materiales: string;
  };
  texturas: { justificacion: string; imagenes: ImagenSlide[] };
  ambiente: { justificacion: string; imagenes: ImagenSlide[] };
  objetoClave: { justificacion: string; items: { imagen: ImagenSlide; detalle: string }[] };
  moodboard: { imagen: ImagenSlide };
};

export type PersonajeDireccion = {
  nombre: string;
  descripcion: string;
  imagenIzquierda: ImagenSlide;
  imagenDerecha: ImagenSlide;
};

export type UbicacionDireccion = {
  titulo: string;
  justificacion: string;
  imagenes: ImagenSlide[];
};

export type PresentacionDireccionDatos = {
  portada: { logline: string; imagen: ImagenSlide };
  peliculasSimilares: { parrafo: string; imagenes: ImagenSlide[] };
  ubicacionDivisor: { imagen: ImagenSlide };
  ubicaciones: UbicacionDireccion[];
  fotografiaDivisor: { imagen: ImagenSlide };
  fotografia: { parrafo: string; items: { imagen: ImagenSlide; detalle: string }[] };
  vestuarioDivisor: { imagen: ImagenSlide };
  personajes: PersonajeDireccion[];
  galeriaFinal: ImagenSlide[];
};

export type Toma = {
  id: string;
  escena_id: string;
  setup_num: string | null;
  shot_num: string | null;
  subject: string | null;
  shot_size: string | null;
  camara: string | null;
  angulo: string | null;
  movimiento: string | null;
  equipo: string | null;
  lente: string | null;
  sonido: string | null;
  descripcion: string | null;
  notas: string | null;
  imagen_url: string | null;
  importancia: "Obligatorio" | "Bien si se toma";
  orden: number;
};
