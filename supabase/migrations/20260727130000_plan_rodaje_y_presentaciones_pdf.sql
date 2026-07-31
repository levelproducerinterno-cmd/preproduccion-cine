-- Presentaciones: opción simple de subir tu propio PDF por departamento (además del generador Arte/Dirección)
create table presentaciones_pdf (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  departamento_id uuid not null references departamentos(id),
  archivo_url text,
  nombre_archivo text,
  updated_at timestamptz not null default now(),
  updated_by uuid references personas(id),
  unique(proyecto_id, departamento_id)
);

alter table presentaciones_pdf enable row level security;

create policy "presentaciones_pdf_select" on presentaciones_pdf for select to authenticated
  using (es_miembro_proyecto(proyecto_id));

create policy "presentaciones_pdf_write" on presentaciones_pdf for all to authenticated
  using (
    es_ad_o_produccion(proyecto_id)
    or tiene_departamento_en_proyecto(proyecto_id, (select nombre from departamentos where id = departamento_id))
  )
  with check (
    es_ad_o_produccion(proyecto_id)
    or tiene_departamento_en_proyecto(proyecto_id, (select nombre from departamentos where id = departamento_id))
  );

-- Plan de Rodaje: columnas adicionales en tomas para el horario del plan
alter table tomas add column hora_inicio text;
alter table tomas add column tiempo_estimado text;
alter table tomas add column talento_en_toma text;
alter table tomas add column set_especifico text;
alter table tomas add column notas_arte text;

-- Días de rodaje (encabezado de cada día del plan / hoja de llamado)
create table dias_rodaje (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  numero int not null,
  fecha date,
  llamado_general text,
  jornada_horas text,
  ready_to_shoot text,
  orden int not null default 0,
  unique(proyecto_id, numero)
);

alter table dias_rodaje enable row level security;

create policy "dias_rodaje_select" on dias_rodaje for select to authenticated
  using (es_miembro_proyecto(proyecto_id));
create policy "dias_rodaje_write" on dias_rodaje for all to authenticated
  using (es_ad_o_produccion(proyecto_id)) with check (es_ad_o_produccion(proyecto_id));

-- Bloques no-toma del plan de rodaje (llegada, desayuno, traslado, comida, desmontaje...)
create table plan_rodaje_bloques (
  id uuid primary key default gen_random_uuid(),
  dia_rodaje_id uuid not null references dias_rodaje(id) on delete cascade,
  hora text,
  descripcion text not null,
  orden int not null default 0,
  created_by uuid references personas(id)
);

alter table plan_rodaje_bloques enable row level security;

create policy "plan_rodaje_bloques_select" on plan_rodaje_bloques for select to authenticated
  using (es_miembro_proyecto((select proyecto_id from dias_rodaje where id = dia_rodaje_id)));
create policy "plan_rodaje_bloques_write" on plan_rodaje_bloques for all to authenticated
  using (es_ad_o_produccion((select proyecto_id from dias_rodaje where id = dia_rodaje_id)))
  with check (es_ad_o_produccion((select proyecto_id from dias_rodaje where id = dia_rodaje_id)));

-- Locaciones del día (para la hoja de llamado, con link de mapa)
create table dia_rodaje_locaciones (
  id uuid primary key default gen_random_uuid(),
  dia_rodaje_id uuid not null references dias_rodaje(id) on delete cascade,
  nombre text not null,
  url_maps text,
  orden int not null default 0
);

alter table dia_rodaje_locaciones enable row level security;

create policy "dia_rodaje_locaciones_select" on dia_rodaje_locaciones for select to authenticated
  using (es_miembro_proyecto((select proyecto_id from dias_rodaje where id = dia_rodaje_id)));
create policy "dia_rodaje_locaciones_write" on dia_rodaje_locaciones for all to authenticated
  using (es_ad_o_produccion((select proyecto_id from dias_rodaje where id = dia_rodaje_id)))
  with check (es_ad_o_produccion((select proyecto_id from dias_rodaje where id = dia_rodaje_id)));

-- Llamado de crew por día (opcional, si no se define usa dias_rodaje.llamado_general)
create table dia_rodaje_crew_llamados (
  id uuid primary key default gen_random_uuid(),
  dia_rodaje_id uuid not null references dias_rodaje(id) on delete cascade,
  proyecto_crew_id uuid not null references proyecto_crew(id) on delete cascade,
  llamado text,
  locacion_url text,
  unique(dia_rodaje_id, proyecto_crew_id)
);

alter table dia_rodaje_crew_llamados enable row level security;

create policy "dia_rodaje_crew_llamados_select" on dia_rodaje_crew_llamados for select to authenticated
  using (es_miembro_proyecto((select proyecto_id from dias_rodaje where id = dia_rodaje_id)));
create policy "dia_rodaje_crew_llamados_write" on dia_rodaje_crew_llamados for all to authenticated
  using (es_ad_o_produccion((select proyecto_id from dias_rodaje where id = dia_rodaje_id)))
  with check (es_ad_o_produccion((select proyecto_id from dias_rodaje where id = dia_rodaje_id)));

-- Talento (elenco): roster reutilizable por proyecto
create table talento (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  personaje text,
  nombre text not null,
  telefono text,
  orden int not null default 0
);

alter table talento enable row level security;

create policy "talento_select" on talento for select to authenticated
  using (es_miembro_proyecto(proyecto_id));
create policy "talento_write" on talento for all to authenticated
  using (es_ad_o_produccion(proyecto_id)) with check (es_ad_o_produccion(proyecto_id));

-- Llamado de talento por día
create table dia_rodaje_talento_llamados (
  id uuid primary key default gen_random_uuid(),
  dia_rodaje_id uuid not null references dias_rodaje(id) on delete cascade,
  talento_id uuid not null references talento(id) on delete cascade,
  llamado_desde text,
  llamado_hasta text,
  locacion_url text,
  unique(dia_rodaje_id, talento_id)
);

alter table dia_rodaje_talento_llamados enable row level security;

create policy "dia_rodaje_talento_llamados_select" on dia_rodaje_talento_llamados for select to authenticated
  using (es_miembro_proyecto((select proyecto_id from dias_rodaje where id = dia_rodaje_id)));
create policy "dia_rodaje_talento_llamados_write" on dia_rodaje_talento_llamados for all to authenticated
  using (es_ad_o_produccion((select proyecto_id from dias_rodaje where id = dia_rodaje_id)))
  with check (es_ad_o_produccion((select proyecto_id from dias_rodaje where id = dia_rodaje_id)));
