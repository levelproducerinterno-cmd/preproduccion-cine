alter table public.dia_rodaje_talento_llamados
  add column if not exists no_se_ocupa boolean not null default false;
