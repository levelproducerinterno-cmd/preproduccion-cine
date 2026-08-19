import { getProyectoContext } from "@/lib/proyecto-context";
import { agregarCategoriaCustom } from "./actions";
import type { DesgloseElemento, Escena, Departamento, DesgloseCategoria } from "@/lib/types";
import { extraerSegmentosPorEscena } from "@/lib/guion-parse";
import EscenaTexto from "@/components/EscenaTexto";
import DesgloseForm from "./DesgloseForm";
import DesgloseGeneralForm from "./DesgloseGeneralForm";
import ElementoDesgloseRow from "./ElementoDesgloseRow";

export default async function EscenasPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, esAdOProduccion, miDepartamentos } = await getProyectoContext(proyectoId);

  const { data: escenas } = await supabase
    .from("escenas")
    .select("id, proyecto_id, guion_id, numero, int_ext, locacion, momento, orden, dia_rodaje_numero, orden_del_dia")
    .eq("proyecto_id", proyectoId)
    .order("orden");

  const { data: guion } = await supabase
    .from("guiones")
    .select("contenido")
    .eq("proyecto_id", proyectoId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const segmentosGuion = extraerSegmentosPorEscena(guion?.contenido ?? "");

  const { data: categorias } = await supabase
    .from("desglose_categorias")
    .select("id, proyecto_id, nombre, es_estandar, orden")
    .or(`proyecto_id.eq.${proyectoId},proyecto_id.is.null`)
    .order("orden");

  const { data: departamentos } = await supabase
    .from("departamentos")
    .select("id, nombre, orden")
    .order("orden");

  const { data: rubros } = await supabase
    .from("presupuesto_rubros")
    .select("id, nombre, orden")
    .or(`proyecto_id.eq.${proyectoId},proyecto_id.is.null`)
    .order("orden");

  const SELECT_ELEMENTO =
    "id, escena_id, categoria_id, descripcion, notas, departamento_id, status, desglose_categorias(id, nombre), departamentos(id, nombre), presupuesto_items(id, rubro_id, cantidad, tipo_unidad, costo_unitario, importancia, es_prestado, prestado_de)";

  const { data: elementosRaw } = await supabase
    .from("desglose_elementos")
    .select(SELECT_ELEMENTO)
    .in("escena_id", (escenas ?? []).map((e) => e.id));

  const { data: elementosGeneralesRaw } = await supabase
    .from("desglose_elementos")
    .select(SELECT_ELEMENTO)
    .eq("proyecto_id", proyectoId)
    .is("escena_id", null);

  const elementosPorEscena = new Map<string, DesgloseElemento[]>();
  for (const el of (elementosRaw ?? []) as unknown as (DesgloseElemento & { escena_id: string })[]) {
    const lista = elementosPorEscena.get(el.escena_id) ?? [];
    lista.push(el);
    elementosPorEscena.set(el.escena_id, lista);
  }

  const puedeVerElemento = (el: DesgloseElemento) =>
    esAdOProduccion || !el.departamento_id || miDepartamentos.includes(el.departamentos?.nombre ?? "");
  const puedeEditarElemento = (el: DesgloseElemento) =>
    esAdOProduccion || (el.departamento_id && miDepartamentos.includes(el.departamentos?.nombre ?? ""));

  const elementosGenerales = ((elementosGeneralesRaw ?? []) as unknown as DesgloseElemento[]).filter(
    puedeVerElemento
  );
  const misDepartamentosObjetos = ((departamentos as Departamento[] | null) ?? []).filter((d) =>
    miDepartamentos.includes(d.nombre)
  );

  return (
    <div className="grid gap-4">
      {esAdOProduccion && (
        <details className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-500">
            + Agregar categoría de desglose personalizada
          </summary>
          <form action={agregarCategoriaCustom.bind(null, proyectoId)} className="mt-3 flex gap-2">
            <input
              name="nombre_categoria"
              placeholder="Ej. Drones, Permisos..."
              className="flex-1 rounded border border-neutral-300 px-3 py-2"
            />
            <button className="rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-hueso">Agregar</button>
          </form>
        </details>
      )}

      <details className="rounded-lg border border-neutral-200 bg-white shadow-sm" open>
        <summary className="cursor-pointer px-5 py-4 font-semibold text-negro">
          Equipo y desglose general
          <span className="ml-2 text-xs font-normal text-neutral-400">
            (no ligado a una escena — ej. equipo de cámara/luces)
          </span>
        </summary>
        <div className="border-t border-neutral-100 p-5">
          <div className="grid gap-2">
            {elementosGenerales.map((el) => (
              <ElementoDesgloseRow
                key={el.id}
                proyectoId={proyectoId}
                el={el}
                puedeEditar={!!puedeEditarElemento(el)}
                esAdOProduccion={esAdOProduccion}
                rubros={rubros ?? []}
                categorias={(categorias as DesgloseCategoria[] | null) ?? []}
                departamentos={(departamentos as Departamento[] | null) ?? []}
              />
            ))}
            {elementosGenerales.length === 0 && <p className="text-sm text-neutral-400">Nada pedido todavía.</p>}
          </div>

          {(esAdOProduccion || misDepartamentosObjetos.length > 0) && (
            <DesgloseGeneralForm
              proyectoId={proyectoId}
              categorias={(categorias as DesgloseCategoria[] | null) ?? []}
              departamentos={(departamentos as Departamento[] | null) ?? []}
              misDepartamentos={misDepartamentosObjetos}
              rubros={rubros ?? []}
              esAdOProduccion={esAdOProduccion}
            />
          )}
        </div>
      </details>

      {(escenas ?? []).length === 0 && (
        <p className="rounded-lg border border-neutral-200 bg-white p-10 text-center text-neutral-500 shadow-sm">
          Aún no hay escenas. Se crean automáticamente al escribir encabezados de escena en la pestaña Guion.
        </p>
      )}

      {(escenas as Escena[] | null)?.map((esc, idx) => {
        const elementos = (elementosPorEscena.get(esc.id) ?? []).filter(puedeVerElemento);
        return (
          <details key={esc.id} className="rounded-lg border border-neutral-200 bg-white shadow-sm" open>
            <summary className="cursor-pointer px-5 py-4 font-semibold text-negro">
              Escena {esc.numero} — {esc.int_ext ?? "?"}. {esc.locacion ?? "Sin locación"} - {esc.momento ?? "?"}
            </summary>
            <div className="border-t border-neutral-100 p-5">
              <EscenaTexto texto={segmentosGuion[idx] ?? ""} />
              <div className="grid gap-2">
                {elementos.map((el) => (
                  <ElementoDesgloseRow
                    key={el.id}
                    proyectoId={proyectoId}
                    el={el}
                    puedeEditar={!!puedeEditarElemento(el)}
                    esAdOProduccion={esAdOProduccion}
                    rubros={rubros ?? []}
                    categorias={(categorias as DesgloseCategoria[] | null) ?? []}
                    departamentos={(departamentos as Departamento[] | null) ?? []}
                  />
                ))}
                {elementos.length === 0 && <p className="text-sm text-neutral-400">Sin desglose todavía.</p>}
              </div>

              {esAdOProduccion && (
                <DesgloseForm
                  proyectoId={proyectoId}
                  escenaId={esc.id}
                  categorias={(categorias as DesgloseCategoria[] | null) ?? []}
                  departamentos={(departamentos as Departamento[] | null) ?? []}
                  rubros={rubros ?? []}
                />
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
