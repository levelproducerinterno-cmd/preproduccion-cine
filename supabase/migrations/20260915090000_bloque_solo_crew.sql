alter table public.plan_rodaje_bloques
  add column if not exists solo_crew boolean not null default false;
