import { getProyectoContext } from "@/lib/proyecto-context";
import { redirect } from "next/navigation";
import { actualizarProyecto } from "./actions";

export default async function AjustesPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { proyecto, esAdOProduccion } = await getProyectoContext(proyectoId);

  if (!esAdOProduccion) redirect(`/proyectos/${proyectoId}/crew`);

  return (
    <div className="max-w-lg">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
        Ajustes del proyecto
      </h2>
      <form
        action={actualizarProyecto.bind(null, proyectoId)}
        className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
            Nombre
          </label>
          <input
            name="nombre"
            required
            defaultValue={proyecto.nombre}
            className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-rojo focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
              Tipo
            </label>
            <select
              name="tipo"
              defaultValue={proyecto.tipo}
              className="w-full rounded border border-neutral-300 px-3 py-2"
            >
              <option>Cortometraje</option>
              <option>Largometraje</option>
              <option>Serie</option>
              <option>Comercial</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
              Día 1 de rodaje
            </label>
            <input
              type="date"
              name="fecha_dia1_rodaje"
              defaultValue={proyecto.fecha_dia1_rodaje ?? ""}
              className="w-full rounded border border-neutral-300 px-3 py-2"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Puedes actualizarla cuando cambie el rodaje — el calendario de preproducción se
              recalculará a partir de esta fecha.
            </p>
          </div>
        </div>
        <button className="mt-2 rounded bg-rojo py-3 font-semibold text-hueso hover:brightness-110">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
