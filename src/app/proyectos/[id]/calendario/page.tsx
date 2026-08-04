import { getProyectoContext } from "@/lib/proyecto-context";
import { agregarHito, actualizarStatusHito, eliminarHito } from "./actions";
import type { Departamento } from "@/lib/types";
import CopiarLinkCalendario from "./CopiarLinkCalendario";

const STATUS_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

const STATUS_COLOR: Record<string, string> = {
  pendiente: "bg-amarillo/20 text-amarillo",
  en_progreso: "bg-neutral-200 text-neutral-700",
  completado: "bg-verde/15 text-verde",
};

type Hito = {
  id: string;
  nombre: string;
  departamento_id: string | null;
  persona_id: string | null;
  fecha_limite: string | null;
  status: "pendiente" | "en_progreso" | "completado";
  notas: string | null;
  departamentos: { nombre: string } | null;
  personas: { nombre: string } | null;
};

type CrewParaAsignar = { id: string; personas: { id: string; nombre: string } };

export default async function CalendarioPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, esAdOProduccion, persona } = await getProyectoContext(proyectoId);

  const { data: hitosRaw } = await supabase
    .from("hitos_preproduccion")
    .select("id, nombre, departamento_id, persona_id, fecha_limite, status, notas, departamentos(nombre), personas(nombre)")
    .eq("proyecto_id", proyectoId)
    .order("fecha_limite", { ascending: true, nullsFirst: false });

  const hitos = (hitosRaw ?? []) as unknown as Hito[];
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: departamentos } = esAdOProduccion
    ? await supabase.from("departamentos").select("id, nombre, orden").order("orden")
    : { data: null };

  const { data: crewParaAsignar } = esAdOProduccion
    ? await supabase.from("proyecto_crew").select("id, personas(id, nombre)").eq("proyecto_id", proyectoId)
    : { data: null };

  return (
    <div className="grid gap-8">
      <CopiarLinkCalendario icalToken={persona.ical_token} />

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
          Calendario de preproducción ({hitos.length})
        </h2>
        <div className="grid gap-3">
          {hitos.map((h) => {
            const vencido = h.status !== "completado" && h.fecha_limite && h.fecha_limite < hoy;
            return (
              <div
                key={h.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm ${
                  vencido ? "border-rojo" : "border-neutral-200"
                }`}
              >
                <div>
                  <div className="font-semibold text-negro">{h.nombre}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    {h.departamentos && (
                      <span className="rounded bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-600">
                        {h.departamentos.nombre}
                      </span>
                    )}
                    {h.personas && (
                      <span className="rounded bg-neutral-100 px-2 py-0.5 font-semibold text-neutral-600">
                        → {h.personas.nombre}
                      </span>
                    )}
                    {h.fecha_limite && (
                      <span className={vencido ? "font-bold text-rojo" : ""}>
                        {vencido ? "Venció: " : "Fecha límite: "}
                        {h.fecha_limite}
                      </span>
                    )}
                    {h.notas && <span>· {h.notas}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {esAdOProduccion ? (
                    <div className="flex gap-1">
                      {(["pendiente", "en_progreso", "completado"] as const).map((s) => (
                        <form key={s} action={actualizarStatusHito.bind(null, proyectoId, h.id, s)}>
                          <button
                            className={`rounded border px-2 py-1 text-[0.65rem] font-semibold uppercase ${
                              h.status === s
                                ? "border-negro bg-negro text-hueso"
                                : "border-neutral-300 text-neutral-500 hover:border-negro"
                            }`}
                          >
                            {STATUS_LABEL[s]}
                          </button>
                        </form>
                      ))}
                      <form action={eliminarHito.bind(null, proyectoId, h.id)}>
                        <button className="rounded border border-neutral-300 px-2 py-1 text-[0.65rem] font-semibold text-neutral-400 hover:border-rojo hover:text-rojo">
                          Quitar
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${STATUS_COLOR[h.status]}`}>
                      {STATUS_LABEL[h.status]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {hitos.length === 0 && <p className="text-neutral-500">Aún no hay actividades en el calendario.</p>}
        </div>
      </section>

      {esAdOProduccion && (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
            Agregar actividad
          </h2>
          <form
            action={agregarHito.bind(null, proyectoId)}
            className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Actividad (ej. &quot;Entrega de propuesta de arte&quot;)
              </label>
              <input name="nombre" required className="w-full rounded border border-neutral-300 px-3 py-2" />
            </div>
            <div className="grid grid-cols-3 gap-4">
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
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Persona (opcional)
                </label>
                <select name="persona_id" className="w-full rounded border border-neutral-300 px-3 py-2">
                  <option value="">— Nadie en particular —</option>
                  {(crewParaAsignar as CrewParaAsignar[] | null)?.map((c) => (
                    <option key={c.id} value={c.personas.id}>
                      {c.personas.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Fecha límite
                </label>
                <input type="date" name="fecha_limite" className="w-full rounded border border-neutral-300 px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Notas (opcional)
              </label>
              <input name="notas" className="w-full rounded border border-neutral-300 px-3 py-2" />
            </div>
            <button className="mt-2 rounded bg-rojo py-3 font-semibold text-hueso hover:brightness-110">
              + Agregar al calendario
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
