-- Permite elementos de desglose "generales" (no ligados a una escena específica),
-- para casos como el equipo de cámara/luces que pide Fotografía: no pertenece a
-- ninguna escena en particular, pertenece a todo el rodaje.
alter table desglose_elementos add column proyecto_id uuid references proyectos(id);
update desglose_elementos de set proyecto_id = (select e.proyecto_id from escenas e where e.id = de.escena_id);
alter table desglose_elementos alter column proyecto_id set not null;
alter table desglose_elementos alter column escena_id drop not null;

drop policy if exists "desglose_elementos_select" on desglose_elementos;
drop policy if exists "desglose_elementos_insert" on desglose_elementos;
drop policy if exists "desglose_elementos_update" on desglose_elementos;
drop policy if exists "desglose_elementos_delete" on desglose_elementos;

create policy "desglose_elementos_select" on desglose_elementos for select to authenticated
  using (es_miembro_proyecto(proyecto_id));

-- AD/Producción puede crear cualquier elemento (de escena o general). Cualquier
-- departamento puede crear SOLO elementos generales (sin escena) para sí mismo,
-- como el equipo que pide Fotografía sin necesidad de pasar por AD.
create policy "desglose_elementos_insert" on desglose_elementos for insert to authenticated
  with check (
    es_ad_o_produccion(proyecto_id)
    or (
      escena_id is null
      and departamento_id is not null
      and tiene_departamento_en_proyecto(proyecto_id, (select nombre from departamentos where id = departamento_id))
    )
  );

create policy "desglose_elementos_update" on desglose_elementos for update to authenticated
  using (
    es_ad_o_produccion(proyecto_id)
    or exists (
      select 1 from proyecto_crew pc
      join proyecto_crew_departamentos pcd on pcd.proyecto_crew_id = pc.id
      where pc.proyecto_id = desglose_elementos.proyecto_id
        and pc.persona_id = persona_id_actual()
        and pcd.departamento_id = desglose_elementos.departamento_id
    )
  );

create policy "desglose_elementos_delete" on desglose_elementos for delete to authenticated
  using (es_ad_o_produccion(proyecto_id));
