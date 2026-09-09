create or replace function public.reordenar_dias_rodaje_por_fecha(p_proyecto_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  i int := 0;
begin
  if not es_ad_o_produccion(p_proyecto_id) then
    raise exception 'No autorizado';
  end if;

  create temporary table _mapa_dias (
    id uuid,
    numero_viejo int,
    numero_nuevo int
  ) on commit drop;

  for r in
    select id, numero
    from dias_rodaje
    where proyecto_id = p_proyecto_id
    order by (fecha is null), fecha, numero
  loop
    i := i + 1;
    insert into _mapa_dias values (r.id, r.numero, i);
  end loop;

  -- fase 1: mueve todos los días a números temporales negativos para evitar
  -- choques con la restricción unique (proyecto_id, numero) al reasignar
  update dias_rodaje d
  set numero = -m.numero_nuevo
  from _mapa_dias m
  where d.id = m.id;

  -- fase 2: números finales + orden de despliegue
  update dias_rodaje d
  set numero = m.numero_nuevo, orden = m.numero_nuevo
  from _mapa_dias m
  where d.id = m.id;

  -- reasigna las escenas que apuntaban al número viejo de cada día
  update escenas e
  set dia_rodaje_numero = m.numero_nuevo
  from _mapa_dias m
  where e.proyecto_id = p_proyecto_id
    and e.dia_rodaje_numero = m.numero_viejo
    and m.numero_viejo <> m.numero_nuevo;
end;
$$;
