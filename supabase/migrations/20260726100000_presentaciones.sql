create table presentaciones (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  tipo text not null check (tipo in ('arte','direccion')),
  datos jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references personas(id),
  unique(proyecto_id, tipo)
);

alter table presentaciones enable row level security;

create policy "presentaciones_select" on presentaciones for select to authenticated
  using (es_miembro_proyecto(proyecto_id));

create policy "presentaciones_insert" on presentaciones for insert to authenticated
  with check (
    es_ad_o_produccion(proyecto_id)
    or (tipo = 'arte' and tiene_departamento_en_proyecto(proyecto_id, 'Arte'))
  );

create policy "presentaciones_update" on presentaciones for update to authenticated
  using (
    es_ad_o_produccion(proyecto_id)
    or (tipo = 'arte' and tiene_departamento_en_proyecto(proyecto_id, 'Arte'))
  );

insert into storage.buckets (id, name, public)
values ('presentaciones', 'presentaciones', true)
on conflict (id) do nothing;

create policy "presentaciones_media_select" on storage.objects for select
  using (bucket_id = 'presentaciones');
create policy "presentaciones_media_insert" on storage.objects for insert
  with check (bucket_id = 'presentaciones');
create policy "presentaciones_media_update" on storage.objects for update
  using (bucket_id = 'presentaciones');
create policy "presentaciones_media_delete" on storage.objects for delete
  using (bucket_id = 'presentaciones');
