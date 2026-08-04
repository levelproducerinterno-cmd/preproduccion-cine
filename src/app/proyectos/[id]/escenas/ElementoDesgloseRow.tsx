import { actualizarStatusElemento, eliminarElemento } from "./actions";
import AplicaPresupuestoInline from "./AplicaPresupuestoInline";
import type { DesgloseElemento } from "@/lib/types";

export default function ElementoDesgloseRow({
  proyectoId,
  el,
  puedeEditar,
  esAdOProduccion,
  rubros,
}: {
  proyectoId: string;
  el: DesgloseElemento;
  puedeEditar: boolean;
  esAdOProduccion: boolean;
  rubros: { id: string; nombre: string }[];
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
