-- "Prestado": utilería/objetos conseguidos sin comprar, para que queden en el presupuesto con costo 0
-- pero con registro de quién lo prestó.
alter table presupuesto_items add column es_prestado boolean not null default false;
alter table presupuesto_items add column prestado_de text;

-- Orden manual del Plan de Rodaje (independiente del orden del shotlist): cuando es null se usa
-- el orden derivado de escena/orden_del_dia + toma.orden; al arrastrar se fija un valor explícito.
alter table tomas add column orden_plan_rodaje int;

-- Qué elementos de arte del desglose de la escena SÍ aplican a una toma específica.
-- Por default todos los elementos de arte de la escena aplican a todas sus tomas;
-- aquí solo se guardan las exclusiones manuales (para que los elementos nuevos del
-- desglose se agreguen automáticamente a las tomas existentes sin tener que re-marcarlos).
create table toma_arte_excluidos (
  toma_id uuid not null references tomas(id) on delete cascade,
  desglose_elemento_id uuid not null references desglose_elementos(id) on delete cascade,
  primary key (toma_id, desglose_elemento_id)
);

create or replace function public.proyecto_de_toma(p_toma_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select proyecto_de_escena(escena_id) from tomas where id = p_toma_id
$$;

alter table toma_arte_excluidos enable row level security;

create policy "toma_arte_excluidos_select" on toma_arte_excluidos for select to authenticated
  using (es_miembro_proyecto(proyecto_de_toma(toma_id)));
create policy "toma_arte_excluidos_write" on toma_arte_excluidos for all to authenticated
  using (
    es_ad_o_produccion(proyecto_de_toma(toma_id))
    or tiene_departamento_en_proyecto(proyecto_de_toma(toma_id), 'Arte')
  )
  with check (
    es_ad_o_produccion(proyecto_de_toma(toma_id))
    or tiene_departamento_en_proyecto(proyecto_de_toma(toma_id), 'Arte')
  );
