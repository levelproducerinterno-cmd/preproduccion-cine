-- Helpers -------------------------------------------------------------

create or replace function public.persona_id_actual()
returns uuid language sql stable security definer set search_path = public as $$
  select id from personas where auth_user_id = auth.uid()
$$;

create or replace function public.es_miembro_proyecto(p_proyecto_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from proyecto_crew pc
    where pc.proyecto_id = p_proyecto_id and pc.persona_id = persona_id_actual()
  )
$$;

create or replace function public.tiene_departamento_en_proyecto(p_proyecto_id uuid, p_departamento_nombre text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from proyecto_crew pc
    join proyecto_crew_departamentos pcd on pcd.proyecto_crew_id = pc.id
    join departamentos d on d.id = pcd.departamento_id
    where pc.proyecto_id = p_proyecto_id
      and pc.persona_id = persona_id_actual()
      and d.nombre = p_departamento_nombre
  )
$$;

create or replace function public.es_ad_o_produccion(p_proyecto_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select tiene_departamento_en_proyecto(p_proyecto_id, 'Dirección/AD')
      or tiene_departamento_en_proyecto(p_proyecto_id, 'Producción')
$$;

create or replace function public.proyecto_de_guion(p_guion_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select proyecto_id from guiones where id = p_guion_id
$$;

create or replace function public.proyecto_de_escena(p_escena_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select proyecto_id from escenas where id = p_escena_id
$$;

-- Enable RLS ------------------------------------------------------------

alter table departamentos enable row level security;
alter table personas enable row level security;
alter table persona_departamentos enable row level security;
alter table proyectos enable row level security;
alter table proyecto_crew enable row level security;
alter table proyecto_crew_departamentos enable row level security;
alter table guiones enable row level security;
alter table escenas enable row level security;
alter table guion_bloques enable row level security;
alter table desglose_categorias enable row level security;
alter table desglose_elementos enable row level security;

-- departamentos: catálogo de solo lectura para cualquier usuario autenticado
create policy "departamentos_select" on departamentos for select to authenticated using (true);

-- personas: cualquier autenticado puede ver el directorio (equipo interno, no multi-tenant público)
create policy "personas_select" on personas for select to authenticated using (true);
create policy "personas_insert_propia" on personas for insert to authenticated
  with check (auth_user_id = auth.uid());
create policy "personas_update_propia" on personas for update to authenticated
  using (auth_user_id = auth.uid());

-- persona_departamentos: visible a todos, editable solo por el dueño
create policy "persona_departamentos_select" on persona_departamentos for select to authenticated using (true);
create policy "persona_departamentos_write" on persona_departamentos for all to authenticated
  using (persona_id = persona_id_actual()) with check (persona_id = persona_id_actual());

-- proyectos: miembros ven su proyecto; cualquier autenticado puede crear uno (se vuelve su AD/Producción)
create policy "proyectos_select" on proyectos for select to authenticated
  using (es_miembro_proyecto(id));
create policy "proyectos_insert" on proyectos for insert to authenticated
  with check (created_by = persona_id_actual());
create policy "proyectos_update" on proyectos for update to authenticated
  using (es_ad_o_produccion(id));

-- proyecto_crew: miembros del proyecto ven el crew; solo AD/Producción administra
create policy "proyecto_crew_select" on proyecto_crew for select to authenticated
  using (es_miembro_proyecto(proyecto_id));
create policy "proyecto_crew_write" on proyecto_crew for all to authenticated
  using (es_ad_o_produccion(proyecto_id) or not es_miembro_proyecto(proyecto_id))
  with check (es_ad_o_produccion(proyecto_id) or not es_miembro_proyecto(proyecto_id));

-- proyecto_crew_departamentos: visibles a miembros del proyecto; administra AD/Producción
create policy "pcd_select" on proyecto_crew_departamentos for select to authenticated
  using (es_miembro_proyecto((select proyecto_id from proyecto_crew where id = proyecto_crew_id)));
create policy "pcd_write" on proyecto_crew_departamentos for all to authenticated
  using (es_ad_o_produccion((select proyecto_id from proyecto_crew where id = proyecto_crew_id)))
  with check (es_ad_o_produccion((select proyecto_id from proyecto_crew where id = proyecto_crew_id)));

-- guiones/escenas/guion_bloques: cualquier miembro del proyecto lee; solo Dirección/AD escribe
create policy "guiones_select" on guiones for select to authenticated
  using (es_miembro_proyecto(proyecto_id));
create policy "guiones_write" on guiones for all to authenticated
  using (tiene_departamento_en_proyecto(proyecto_id, 'Dirección/AD'))
  with check (tiene_departamento_en_proyecto(proyecto_id, 'Dirección/AD'));

create policy "escenas_select" on escenas for select to authenticated
  using (es_miembro_proyecto(proyecto_id));
create policy "escenas_write" on escenas for all to authenticated
  using (tiene_departamento_en_proyecto(proyecto_id, 'Dirección/AD'))
  with check (tiene_departamento_en_proyecto(proyecto_id, 'Dirección/AD'));

create policy "guion_bloques_select" on guion_bloques for select to authenticated
  using (es_miembro_proyecto(proyecto_de_guion(guion_id)));
create policy "guion_bloques_write" on guion_bloques for all to authenticated
  using (tiene_departamento_en_proyecto(proyecto_de_guion(guion_id), 'Dirección/AD'))
  with check (tiene_departamento_en_proyecto(proyecto_de_guion(guion_id), 'Dirección/AD'));

-- desglose_categorias: estándar (proyecto_id null) visible a todos; custom visible a miembros del proyecto
create policy "desglose_categorias_select" on desglose_categorias for select to authenticated
  using (proyecto_id is null or es_miembro_proyecto(proyecto_id));
create policy "desglose_categorias_insert" on desglose_categorias for insert to authenticated
  with check (proyecto_id is not null and es_ad_o_produccion(proyecto_id));

-- desglose_elementos: cualquier miembro del proyecto lee (es la info de la junta de producción);
-- escribe AD/Producción, o el propio departamento responsable del elemento
create policy "desglose_elementos_select" on desglose_elementos for select to authenticated
  using (es_miembro_proyecto(proyecto_de_escena(escena_id)));
create policy "desglose_elementos_insert" on desglose_elementos for insert to authenticated
  with check (es_ad_o_produccion(proyecto_de_escena(escena_id)));
create policy "desglose_elementos_update" on desglose_elementos for update to authenticated
  using (
    es_ad_o_produccion(proyecto_de_escena(escena_id))
    or exists (
      select 1 from proyecto_crew pc
      join proyecto_crew_departamentos pcd on pcd.proyecto_crew_id = pc.id
      where pc.proyecto_id = proyecto_de_escena(escena_id)
        and pc.persona_id = persona_id_actual()
        and pcd.departamento_id = desglose_elementos.departamento_id
    )
  );
create policy "desglose_elementos_delete" on desglose_elementos for delete to authenticated
  using (es_ad_o_produccion(proyecto_de_escena(escena_id)));
