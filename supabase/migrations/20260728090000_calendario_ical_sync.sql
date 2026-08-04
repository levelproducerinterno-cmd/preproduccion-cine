-- Token secreto por persona para su feed de calendario (.ics), y asignación directa
-- de hitos a una persona específica (además de o en vez de un departamento).
alter table personas add column ical_token uuid not null default gen_random_uuid() unique;
alter table hitos_preproduccion add column persona_id uuid references personas(id);

create or replace function public.obtener_hitos_para_ical(p_token uuid)
returns table (
  hito_id uuid,
  proyecto_nombre text,
  nombre text,
  fecha_limite date,
  notas text,
  status text
)
language sql stable security definer set search_path = public as $$
  select distinct h.id, pr.nombre, h.nombre, h.fecha_limite, h.notas, h.status
  from personas per
  join proyecto_crew pc on pc.persona_id = per.id
  join proyectos pr on pr.id = pc.proyecto_id
  join hitos_preproduccion h on h.proyecto_id = pc.proyecto_id
  where per.ical_token = p_token
    and h.fecha_limite is not null
    and (
      h.departamento_id is null
      or h.persona_id = per.id
      or exists (
        select 1 from proyecto_crew_departamentos pcd
        where pcd.proyecto_crew_id = pc.id and pcd.departamento_id = h.departamento_id
      )
    )
$$;

grant execute on function public.obtener_hitos_para_ical(uuid) to anon, authenticated;
