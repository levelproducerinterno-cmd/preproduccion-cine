alter table public.dia_rodaje_talento_llamados
  add column if not exists indicaciones text;

create table if not exists public.dia_rodaje_talento_fotos (
  id uuid primary key default gen_random_uuid(),
  dia_rodaje_id uuid not null references public.dias_rodaje(id) on delete cascade,
  talento_id uuid not null references public.talento(id) on delete cascade,
  url text not null,
  orden int not null default 0
);

alter table public.dia_rodaje_talento_fotos enable row level security;

create policy dia_rodaje_talento_fotos_select on public.dia_rodaje_talento_fotos
  for select using (es_miembro_proyecto((select proyecto_id from dias_rodaje where id = dia_rodaje_talento_fotos.dia_rodaje_id)));

create policy dia_rodaje_talento_fotos_write on public.dia_rodaje_talento_fotos
  for all using (es_ad_o_produccion((select proyecto_id from dias_rodaje where id = dia_rodaje_talento_fotos.dia_rodaje_id)))
  with check (es_ad_o_produccion((select proyecto_id from dias_rodaje where id = dia_rodaje_talento_fotos.dia_rodaje_id)));
