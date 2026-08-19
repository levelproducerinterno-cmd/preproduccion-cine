import { actualizarStatusElemento, actualizarElemento, eliminarElemento } from "./actions";
import AplicaPresupuestoInline from "./AplicaPresupuestoInline";
import type { DesgloseElemento, DesgloseCategoria, Departamento } from "@/lib/types";

export default function ElementoDesgloseRow({
  proyectoId,
  el,
  puedeEditar,
  esAdOProduccion,
  rubros,
  categorias,
  departamentos,
}: {
  proyectoId: string;
  el: DesgloseElemento;
  puedeEditar: boolean;
  esAdOProduccion: boolean;
  rubros: { id: string; nombre: string }[];
  categorias: DesgloseCategoria[];
  departamentos: Departamento[];
}) {
  return (
    <div className="rounded border border-neutral-100 bg-neutral-50 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="mr-2 rounded bg-neutral-200 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-neutral-600">
            {el.desglose_categorias.nombre}
          </span>
          <span className="text-sm text-negro">{el.descripcion}</span>
          {el.notas && <span className="ml-2 text-xs text-neutral-400">({el.notas})</span>}
          {el.departamentos && (
            <span className="ml-2 text-xs font-semibold text-neutral-400">→ {el.departamentos.nombre}</span>
          )}
        </div>
        {puedeEditar ? (
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

      {puedeEditar && (
        <details className="mt-1">
          <summary className="cursor-pointer text-[0.65rem] font-semibold text-neutral-400 hover:text-negro">
            Editar
          </summary>
          <form
            action={actualizarElemento.bind(null, proyectoId, el.id)}
            className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4"
          >
            <select
              name="categoria_id"
              defaultValue={el.categoria_id}
              required
              className="rounded border border-neutral-300 px-2 py-1.5 text-xs"
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <input
              name="descripcion"
              defaultValue={el.descripcion}
              required
              className="col-span-2 rounded border border-neutral-300 px-2 py-1.5 text-xs md:col-span-1"
            />
            <input
              name="notas"
              defaultValue={el.notas ?? ""}
              placeholder="Notas"
              className="rounded border border-neutral-300 px-2 py-1.5 text-xs"
            />
            <select
              name="departamento_id"
              defaultValue={el.departamento_id ?? ""}
              className="rounded border border-neutral-300 px-2 py-1.5 text-xs"
            >
              <option value="">Depto. responsable</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
            <button className="col-span-2 rounded bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-hueso md:col-span-4">
              Guardar
            </button>
          </form>
        </details>
      )}

      {puedeEditar && el.departamento_id && (
        <AplicaPresupuestoInline
          proyectoId={proyectoId}
          elementoId={el.id}
          departamentoId={el.departamento_id}
          rubros={rubros}
          itemExistente={el.presupuesto_items?.[0] ?? null}
        />
      )}
    </div>
  );
}
