-- 1) La persona asignada a un hito puede actualizarlo ella misma (ej. mover su propio % de avance).
create policy "hitos_update_asignado" on hitos_preproduccion for update to authenticated
  using (persona_id = persona_id_actual())
  with check (persona_id = persona_id_actual());

-- 2) Disponibilidad del crew por día de rodaje (para marcar "no disponible este día").
alter table dia_rodaje_crew_llamados add column no_disponible boolean not null default false;

-- 3) Casting y Talento: campos adicionales sobre cada actor/personaje, y galería de fotos.
alter table talento add column sexo text;
alter table talento add column estatura text;
alter table talento add column tallas text;
alter table talento add column medidas text;
alter table talento add column descripcion text;
alter table talento add column caracterizacion text;

create table talento_fotos (
  id uuid primary key default gen_random_uuid(),
  talento_id uuid not null references talento(id) on delete cascade,
  url text not null,
  orden int not null default 0
);

alter table talento_fotos enable row level security;

create policy "talento_fotos_select" on talento_fotos for select to authenticated
  using (es_miembro_proyecto((select proyecto_id from talento where id = talento_id)));
create policy "talento_fotos_write" on talento_fotos for all to authenticated
  using (es_ad_o_produccion((select proyecto_id from talento where id = talento_id)))
  with check (es_ad_o_produccion((select proyecto_id from talento where id = talento_id)));

insert into storage.buckets (id, name, public)
values ('casting', 'casting', true)
on conflict (id) do nothing;

create policy "casting_media_select" on storage.objects for select
  using (bucket_id = 'casting');
create policy "casting_media_insert" on storage.objects for insert
  with check (bucket_id = 'casting');
create policy "casting_media_update" on storage.objects for update
  using (bucket_id = 'casting');
create policy "casting_media_delete" on storage.objects for delete
  using (bucket_id = 'casting');
