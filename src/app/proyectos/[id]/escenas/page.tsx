import { getProyectoContext } from "@/lib/proyecto-context";
import { actualizarStatusElemento, eliminarElemento, agregarCategoriaCustom } from "./actions";
import type { DesgloseElemento, Escena, Departamento, DesgloseCategoria } from "@/lib/types";
import { extraerSegmentosPorEscena } from "@/lib/guion-parse";
import EscenaTexto from "@/components/EscenaTexto";
import DesgloseForm from "./DesgloseForm";
import AplicaPresupuestoInline from "./AplicaPresupuestoInline";

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

  const { data: elementosRaw } = await supabase
    .from("desglose_elementos")
    .select(
      "id, escena_id, categoria_id, descripcion, notas, departamento_id, status, desglose_categorias(id, nombre), departamentos(id, nombre), presupuesto_items(id, rubro_id, cantidad, tipo_unidad, costo_unitario, importancia, es_prestado, prestado_de)"
    )
    .in("escena_id", (escenas ?? []).map((e) => e.id));

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
                  <div key={el.id} className="rounded border border-neutral-100 bg-neutral-50 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="mr-2 rounded bg-neutral-200 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-neutral-600">
                          {el.desglose_categorias.nombre}
                        </span>
                        <span className="text-sm text-negro">{el.descripcion}</span>
                        {el.notas && <span className="ml-2 text-xs text-neutral-400">({el.notas})</span>}
                        {el.departamentos && (
                          <span className="ml-2 text-xs font-semibold text-neutral-400">
                            → {el.departamentos.nombre}
                          </span>
                        )}
                      </div>
                      {puedeEditarElemento(el) ? (
                        <div className="flex items-center gap-2">
                          <form
                            action={actualizarStatusElemento.bind(
                              null,
                              proyectoId,
                              el.id,
                              el.status === "confirmado" ? "pendiente" : "confirmado"
                            )}
                          >
                            <button
                              className={`rounded px-2 py-1 text-[0.65rem] font-bold uppercase ${
                                el.status === "confirmado" ? "bg-verde/15 text-verde" : "bg-amarillo/20 text-amarillo"
                              }`}
                            >
                              {el.status === "confirmado" ? "Confirmado" : "Pendiente"}
                            </button>
                          </form>
                          {esAdOProduccion && (
                            <form action={eliminarElemento.bind(null, proyectoId, el.id)}>
                              <button className="text-xs text-neutral-300 hover:text-rojo">✕</button>
                            </form>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`rounded px-2 py-1 text-[0.65rem] font-bold uppercase ${
                            el.status === "confirmado" ? "bg-verde/15 text-verde" : "bg-amarillo/20 text-amarillo"
                          }`}
                        >
                          {el.status === "confirmado" ? "Confirmado" : "Pendiente"}
                        </span>
                      )}
                    </div>
                    {puedeEditarElemento(el) && el.departamento_id && (
                      <AplicaPresupuestoInline
                        proyectoId={proyectoId}
                        elementoId={el.id}
                        departamentoId={el.departamento_id}
                        rubros={rubros ?? []}
                        itemExistente={el.presupuesto_items?.[0] ?? null}
                      />
                    )}
                  </div>
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
