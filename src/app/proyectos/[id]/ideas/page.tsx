import { redirect } from "next/navigation";
import { getProyectoContext } from "@/lib/proyecto-context";
import { agregarIdea, aprobarYPasarAlCalendario, eliminarIdea } from "./actions";
import type { Departamento } from "@/lib/types";

type Idea = {
  id: string;
  descripcion: string;
  prioridad: "Importante" | "No importante" | "Idea para dejar después";
  departamento_id: string | null;
  status: "idea" | "aprobada";
  departamentos: { nombre: string } | null;
};

const PRIORIDADES: Idea["prioridad"][] = ["Importante", "No importante", "Idea para dejar después"];

const COLOR_PRIORIDAD: Record<string, string> = {
  Importante: "border-rojo",
  "No importante": "border-neutral-200",
  "Idea para dejar después": "border-amarillo",
};

export default async function IdeasPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, miDepartamentos } = await getProyectoContext(proyectoId);

  if (!miDepartamentos.includes("Dirección/AD")) redirect(`/proyectos/${proyectoId}/crew`);

  const { data: ideasRaw } = await supabase
    .from("ideas")
    .select("id, descripcion, prioridad, departamento_id, status, departamentos(nombre)")
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: false });
  const ideas = (ideasRaw ?? []) as unknown as Idea[];

  const { data: departamentos } = await supabase.from("departamentos").select("id, nombre, orden").order("orden");

  return (
    <div className="grid gap-8">
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
          Tablero de ideas
        </h2>
        <p className="mb-4 text-xs text-neutral-400">
          Espacio privado tuyo — nadie más del crew ve esto. Cuando una idea esté lista, apruébala
          para que se convierta en una actividad del Calendario y AD la organice con el departamento
          correspondiente.
        </p>

        {PRIORIDADES.map((prioridad) => {
          const ideasPrioridad = ideas.filter((i) => i.prioridad === prioridad);
          if (ideasPrioridad.length === 0) return null;
          return (
            <div key={prioridad} className="mb-6">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">{prioridad}</h3>
              <div className="grid gap-2">
                {ideasPrioridad.map((idea) => (
                  <div
                    key={idea.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-4 bg-white p-4 shadow-sm ${COLOR_PRIORIDAD[idea.prioridad]}`}
                  >
                    <div>
                      <p className="text-sm text-negro">{idea.descripcion}</p>
                      {idea.departamentos && (
                        <span className="mt-1 inline-block rounded bg-neutral-100 px-2 py-0.5 text-[0.7rem] font-semibold text-neutral-600">
                          {idea.departamentos.nombre}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {idea.status === "aprobada" ? (
                        <span className="rounded bg-verde/15 px-2 py-1 text-xs font-bold uppercase text-verde">
                          En el calendario
                        </span>
                      ) : (
                        <form action={aprobarYPasarAlCalendario.bind(null, proyectoId, idea.id)}>
                          <button className="rounded bg-rojo px-3 py-1.5 text-xs font-semibold text-hueso hover:brightness-110">
                            ✓ Que se realice
                          </button>
                        </form>
                      )}
                      <form action={eliminarIdea.bind(null, proyectoId, idea.id)}>
                        <button className="text-xs text-neutral-300 hover:text-rojo">✕</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {ideas.length === 0 && (
          <p className="rounded-lg border border-neutral-200 bg-white p-10 text-center text-neutral-500 shadow-sm">
            Aún no has anotado ideas.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">Nueva idea</h2>
        <form
          action={agregarIdea.bind(null, proyectoId)}
          className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
              Descripción
            </label>
            <input name="descripcion" required className="w-full rounded border border-neutral-300 px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Prioridad
              </label>
              <select name="prioridad" className="w-full rounded border border-neutral-300 px-3 py-2">
                {PRIORIDADES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Departamento
              </label>
              <select name="departamento_id" className="w-full rounded border border-neutral-300 px-3 py-2">
                <option value="">— General —</option>
                {(departamentos as Departamento[] | null)?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="mt-2 rounded bg-rojo py-3 font-semibold text-hueso hover:brightness-110">
            + Agregar idea
          </button>
        </form>
      </section>
    </div>
  );
}
