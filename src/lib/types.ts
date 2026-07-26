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
