-- Helpers para el arranque en frío (crear proyecto -> primer miembro AD)
create or replace function public.proyecto_crew_vacio(p_proyecto_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists(select 1 from proyecto_crew where proyecto_id = p_proyecto_id)
$$;

create or replace function public.es_creador_proyecto(p_proyecto_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from proyectos where id = p_proyecto_id and created_by = persona_id_actual())
$$;

create or replace function public.proyecto_sin_departamentos_asignados(p_proyecto_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists(
    select 1 from proyecto_crew_departamentos pcd
    join proyecto_crew pc on pc.id = pcd.proyecto_crew_id
    where pc.proyecto_id = p_proyecto_id
  )
$$;

-- proyecto_crew: además de AD/Producción, permite al creador del proyecto darse de alta
-- a sí mismo como el primer miembro (arranque en frío, antes de que exista ningún AD)
drop policy "proyecto_crew_write" on proyecto_crew;
create policy "proyecto_crew_write" on proyecto_crew for all to authenticated
  using (
    es_ad_o_produccion(proyecto_id)
    or (proyecto_crew_vacio(proyecto_id) and es_creador_proyecto(proyecto_id) and persona_id = persona_id_actual())
  )
  with check (
    es_ad_o_produccion(proyecto_id)
    or (proyecto_crew_vacio(proyecto_id) and es_creador_proyecto(proyecto_id) and persona_id = persona_id_actual())
  );

-- proyecto_crew_departamentos: mismo arranque en frío para asignarse el departamento Dirección/AD
drop policy "pcd_write" on proyecto_crew_departamentos;
create policy "pcd_write" on proyecto_crew_departamentos for all to authenticated
  using (
    es_ad_o_produccion((select proyecto_id from proyecto_crew where id = proyecto_crew_id))
    or (
      proyecto_sin_departamentos_asignados((select proyecto_id from proyecto_crew where id = proyecto_crew_id))
      and es_creador_proyecto((select proyecto_id from proyecto_crew where id = proyecto_crew_id))
      and (select persona_id from proyecto_crew where id = proyecto_crew_id) = persona_id_actual()
    )
  )
  with check (
    es_ad_o_produccion((select proyecto_id from proyecto_crew where id = proyecto_crew_id))
    or (
      proyecto_sin_departamentos_asignados((select proyecto_id from proyecto_crew where id = proyecto_crew_id))
      and es_creador_proyecto((select proyecto_id from proyecto_crew where id = proyecto_crew_id))
      and (select persona_id from proyecto_crew where id = proyecto_crew_id) = persona_id_actual()
    )
  );

-- personas: permite pre-registrar crew (auth_user_id null) por cualquier autenticado (equipo interno de confianza),
-- y permite "reclamar" ese registro cuando esa persona finalmente se registra con la misma cuenta/correo.
drop policy "personas_insert_propia" on personas;
create policy "personas_insert" on personas for insert to authenticated
  with check (auth_user_id = auth.uid() or auth_user_id is null);

drop policy "personas_update_propia" on personas;
create policy "personas_update_propia" on personas for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "personas_claim" on personas for update to authenticated
  using (auth_user_id is null and lower(email) = lower(coalesce(auth.jwt()->>'email','')))
  with check (auth_user_id = auth.uid() and lower(email) = lower(coalesce(auth.jwt()->>'email','')));
