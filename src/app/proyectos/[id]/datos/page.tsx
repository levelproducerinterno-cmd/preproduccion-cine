import { getProyectoContext } from "@/lib/proyecto-context";
import { guardarRespuestas, agregarPreguntaCustom, desactivarPregunta } from "./actions";
import DescargarPdfBoton from "./DescargarPdfBoton";

type Pregunta = { id: string; texto: string; orden: number; proyecto_id: string | null };
type Respuesta = { pregunta_id: string; respuesta: string | null };
type CrewConPersona = {
  id: string;
  puesto_especifico: string | null;
  personas: { nombre: string; email: string };
};

export default async function DatosPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, esAdOProduccion, miCrewId, proyecto } = await getProyectoContext(proyectoId);

  const { data: preguntasRaw } = await supabase
    .from("preguntas_registro")
    .select("id, texto, orden, proyecto_id")
    .or(`proyecto_id.eq.${proyectoId},proyecto_id.is.null`)
    .eq("activa", true)
    .order("orden");
  const preguntas = (preguntasRaw ?? []) as Pregunta[];

  const { data: misRespuestasRaw } = await supabase
    .from("respuestas_registro")
    .select("pregunta_id, respuesta")
    .eq("proyecto_crew_id", miCrewId);
  const misRespuestas = new Map(((misRespuestasRaw ?? []) as Respuesta[]).map((r) => [r.pregunta_id, r.respuesta ?? ""]));

  const sinResponder = preguntas.filter((p) => !(misRespuestas.get(p.id) ?? "").trim()).length;

  let crewConEstado: { crew: CrewConPersona; respondidas: number }[] = [];
  if (esAdOProduccion) {
    const { data: crewRaw } = await supabase
      .from("proyecto_crew")
      .select("id, puesto_especifico, personas(nombre, email)")
      .eq("proyecto_id", proyectoId);
    const crew = (crewRaw ?? []) as unknown as CrewConPersona[];

    const { data: todasRespuestas } = await supabase
      .from("respuestas_registro")
      .select("proyecto_crew_id, respuesta")
      .in("proyecto_crew_id", crew.map((c) => c.id));

    crewConEstado = crew.map((c) => ({
      crew: c,
      respondidas: (todasRespuestas ?? []).filter(
        (r) => r.proyecto_crew_id === c.id && (r.respuesta ?? "").trim()
      ).length,
    }));
  }

  return (
    <div className="grid gap-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500">
            Tus datos de producción
          </h2>
          {sinResponder > 0 && (
            <span className="rounded bg-amarillo/20 px-2 py-1 text-xs font-bold uppercase text-amarillo">
              {sinResponder} sin responder
            </span>
          )}
        </div>
        <form
          action={guardarRespuestas.bind(null, proyectoId, miCrewId)}
          className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
        >
          {preguntas.map((p) => (
            <div key={p.id}>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                {p.texto}
              </label>
              <input
                name={`pregunta_${p.id}`}
                defaultValue={misRespuestas.get(p.id) ?? ""}
                className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-rojo focus:outline-none"
              />
            </div>
          ))}
          <button className="mt-2 rounded bg-rojo py-3 font-semibold text-hueso hover:brightness-110">
            Guardar respuestas
          </button>
        </form>
      </section>

      {esAdOProduccion && (
        <>
          <section>
            <details className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-neutral-500">
                + Agregar pregunta a este proyecto
              </summary>
              <form action={agregarPreguntaCustom.bind(null, proyectoId)} className="mt-3 flex gap-2">
                <input
                  name="texto"
                  placeholder="Ej. ¿Sabes manejar equipo de rappel?"
                  className="flex-1 rounded border border-neutral-300 px-3 py-2"
                />
                <button className="rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-hueso">Agregar</button>
              </form>
              <p className="mt-2 text-xs text-neutral-400">
                Se agrega a este proyecto y le va a aparecer al crew como pendiente por responder.
              </p>
              {preguntas.filter((p) => p.proyecto_id === proyectoId).length > 0 && (
                <div className="mt-3 grid gap-1">
                  {preguntas
                    .filter((p) => p.proyecto_id === proyectoId)
                    .map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{p.texto}</span>
                        <form action={desactivarPregunta.bind(null, proyectoId, p.id)}>
                          <button className="text-neutral-300 hover:text-rojo">Quitar</button>
                        </form>
                      </div>
                    ))}
                </div>
              )}
            </details>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
              Estatus del crew ({crewConEstado.length})
            </h2>
            <div className="grid gap-2">
              {crewConEstado.map(({ crew, respondidas }) => (
                <div
                  key={crew.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <span className="font-semibold text-negro">{crew.personas.nombre}</span>
                    <span className="ml-2 text-xs text-neutral-400">{crew.personas.email ?? "Sin correo"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold uppercase ${
                        respondidas >= preguntas.length ? "text-verde" : "text-amarillo"
                      }`}
                    >
                      {respondidas}/{preguntas.length} respondidas
                    </span>
                    <DescargarPdfBoton
                      crewId={crew.id}
                      proyectoNombre={proyecto.nombre}
                      logoUrl={proyecto.logo_url}
                      colorPrimario={proyecto.color_primario}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
