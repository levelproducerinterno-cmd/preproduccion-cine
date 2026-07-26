-- Catálogo de departamentos (extensible)
create table departamentos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null default 0
);

-- Crew / personas (vinculadas a Supabase Auth)
create table personas (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  nombre text not null,
  email text not null unique,
  telefono text,
  color text not null default '#c72a09',
  created_at timestamptz not null default now()
);

-- Departamentos "por defecto" de una persona (se usan para prellenar al asignarla a un proyecto)
create table persona_departamentos (
  persona_id uuid not null references personas(id) on delete cascade,
  departamento_id uuid not null references departamentos(id) on delete cascade,
  primary key (persona_id, departamento_id)
);

-- Proyectos (entidad raíz: cada cortometraje/largometraje es independiente)
create table proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null default 'Cortometraje',
  fecha_dia1_rodaje date,
  created_by uuid references personas(id),
  created_at timestamptz not null default now()
);

-- Crew asignado a un proyecto específico
create table proyecto_crew (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  persona_id uuid not null references personas(id) on delete cascade,
  puesto_especifico text,
  status_confirmacion text not null default 'por_confirmar'
    check (status_confirmacion in ('confirmado','por_confirmar','declinado')),
  fecha_limite_confirmacion date,
  fecha_confirmado date,
  notas text,
  created_at timestamptz not null default now(),
  unique (proyecto_id, persona_id)
);

-- Departamentos que cubre esa persona DENTRO de ese proyecto (multi-select, ej. "AD y Producción")
create table proyecto_crew_departamentos (
  proyecto_crew_id uuid not null references proyecto_crew(id) on delete cascade,
  departamento_id uuid not null references departamentos(id) on delete cascade,
  primary key (proyecto_crew_id, departamento_id)
);

-- Guiones
create table guiones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  titulo text not null default 'Guion',
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Escenas (generadas a partir de los encabezados de escena del guion)
create table escenas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  guion_id uuid not null references guiones(id) on delete cascade,
  numero text not null,
  int_ext text check (int_ext in ('INT','EXT','INT/EXT')),
  locacion text,
  momento text check (momento in ('DÍA','NOCHE','AMANECER','ATARDECER')),
  orden int not null,
  dia_rodaje_numero int,
  orden_del_dia int,
  created_at timestamptz not null default now()
);

-- Bloques del guion en orden (formato screenplay: cada línea tiene un tipo)
create table guion_bloques (
  id uuid primary key default gen_random_uuid(),
  guion_id uuid not null references guiones(id) on delete cascade,
  escena_id uuid references escenas(id) on delete set null,
  orden int not null,
  tipo text not null check (tipo in ('encabezado_escena','accion','personaje','dialogo','parentesis','transicion')),
  contenido text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categorías de desglose (catálogo estándar de industria + custom por proyecto)
create table desglose_categorias (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos(id) on delete cascade, -- null = estándar global
  nombre text not null,
  es_estandar boolean not null default false,
  orden int not null default 0
);

-- Elementos de desglose (escena x elemento)
create table desglose_elementos (
  id uuid primary key default gen_random_uuid(),
  escena_id uuid not null references escenas(id) on delete cascade,
  categoria_id uuid not null references desglose_categorias(id),
  descripcion text not null,
  notas text,
  departamento_id uuid references departamentos(id),
  status text not null default 'pendiente' check (status in ('pendiente','confirmado')),
  created_by uuid references personas(id),
  created_at timestamptz not null default now()
);

create index on proyecto_crew (proyecto_id);
create index on proyecto_crew (persona_id);
create index on escenas (proyecto_id);
create index on guion_bloques (guion_id, orden);
create index on desglose_elementos (escena_id);
