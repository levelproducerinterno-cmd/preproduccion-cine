import { headers } from "next/headers";
import { getProyectoContext } from "@/lib/proyecto-context";
import {
  agregarCrew,
  actualizarStatusConfirmacion,
  eliminarCrew,
  generarInvitacion,
  desactivarInvitacion,
} from "./actions";
import type { Departamento, ProyectoCrew } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  confirmado: "Confirmado",
  por_confirmar: "Por confirmar",
  declinado: "Declinó",
};

const STATUS_COLOR: Record<string, string> = {
  confirmado: "bg-verde/15 text-verde",
  por_confirmar: "bg-amarillo/20 text-amarillo",
  declinado: "bg-rojo/15 text-rojo",
};

export default async function CrewPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, esAdOProduccion } = await getProyectoContext(proyectoId);

  const { data: departamentos } = await supabase
    .from("departamentos")
    .select("id, nombre, orden")
    .order("orden");

  const { data: crewRaw } = await supabase
    .from("proyecto_crew")
    .select(
      "id, puesto_especifico, status_confirmacion, fecha_limite_confirmacion, fecha_confirmado, notas, personas(id, nombre, email, telefono, color), proyecto_crew_departamentos(departamento_id, departamentos(id, nombre, orden))"
    )
    .eq("proyecto_id", proyectoId);

  const crew = (crewRaw ?? []) as unknown as ProyectoCrew[];
  const hoy = new Date().toISOString().slice(0, 10);

  let invitaciones: { id: string; token: string; created_at: string }[] = [];
  let origin = "";
  if (esAdOProduccion) {
    const { data } = await supabase
      .from("invitaciones")
      .select("id, token, created_at")
      .eq("proyecto_id", proyectoId)
      .eq("activa", true)
      .order("created_at", { ascending: false });
    invitaciones = data ?? [];
    const h = await headers();
    const host = h.get("host");
    const protocol = host?.startsWith("localhost") ? "http" : "https";
    origin = host ? `${protocol}://${host}` : "";
  }

  return (
    <div className="grid gap-8">
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
          Crew del proyecto ({crew.length})
        </h2>
        <div className="grid gap-3">
          {crew.map((c) => {
            const vencido =
              c.status_confirmacion === "por_confirmar" &&
              c.fecha_limite_confirmacion &&
              c.fecha_limite_confirmacion < hoy;
            return (
              <div
                key={c.id}
                className={`rounded-lg border bg-white p-4 shadow-sm ${vencido ? "border-rojo" : "border-neutral-200"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: c.personas.color }}
                      />
                      <span className="font-semibold text-negro">{c.personas.nombre}</span>
                      <span className="text-xs text-neutral-400">{c.personas.email}</span>
                    </div>
                    {c.puesto_especifico && (
                      <div className="text-sm text-neutral-600">{c.puesto_especifico}</div>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.proyecto_crew_departamentos.map((d) => (
                        <span
                          key={d.departamento_id}
                          className="rounded bg-neutral-100 px-2 py-0.5 text-[0.7rem] font-semibold text-neutral-600"
                        >
                          {d.departamentos.nombre}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_COLOR[c.status_confirmacion]}`}
                    >
                      {STATUS_LABEL[c.status_confirmacion]}
                    </span>
                    {c.fecha_limite_confirmacion && (
                      <span className={`text-xs ${vencido ? "font-bold text-rojo" : "text-neutral-500"}`}>
                        {vencido ? "Venció: " : "Límite: "}
                        {c.fecha_limite_confirmacion}
                      </span>
                    )}
                    {esAdOProduccion && (
                      <div className="flex gap-1">
                        {(["confirmado", "por_confirmar", "declinado"] as const).map((s) => (
                          <form key={s} action={actualizarStatusConfirmacion.bind(null, proyectoId, c.id, s)}>
                            <button
                              className={`rounded border px-2 py-1 text-[0.65rem] font-semibold uppercase ${
                                c.status_confirmacion === s
                                  ? "border-negro bg-negro text-hueso"
                                  : "border-neutral-300 text-neutral-500 hover:border-negro"
                              }`}
                            >
                              {STATUS_LABEL[s]}
                            </button>
                          </form>
                        ))}
                        <form action={eliminarCrew.bind(null, proyectoId, c.id)}>
                          <button className="rounded border border-neutral-300 px-2 py-1 text-[0.65rem] font-semibold text-neutral-400 hover:border-rojo hover:text-rojo">
                            Quitar
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {crew.length === 0 && <p className="text-neutral-500">Aún no hay crew en este proyecto.</p>}
        </div>
      </section>

      {esAdOProduccion && (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
            Links de invitación (auto-registro)
          </h2>
          <div className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-neutral-500">
              Comparte este link con alguien del crew: crea su cuenta y elige su propio puesto y
              departamento(s) directamente en este proyecto, sin que tengas que darla de alta a mano.
            </p>
            {invitaciones.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-100 bg-neutral-50 px-3 py-2"
              >
                <code className="text-xs text-neutral-700">{origin}/unirse/{inv.token}</code>
                <form action={desactivarInvitacion.bind(null, proyectoId, inv.id)}>
                  <button className="text-xs text-neutral-400 hover:text-rojo">Desactivar</button>
                </form>
              </div>
            ))}
            <form action={generarInvitacion.bind(null, proyectoId)}>
              <button className="rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-hueso hover:brightness-110">
                + Generar nuevo link
              </button>
            </form>
          </div>
        </section>
      )}

      {esAdOProduccion && (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
            Agregar persona al crew
          </h2>
          <form
            action={agregarCrew.bind(null, proyectoId)}
            className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Nombre
                </label>
                <input name="nombre" required className="w-full rounded border border-neutral-300 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Correo
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded border border-neutral-300 px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Puesto específico (ej. &quot;Asistente de Arte&quot;, &quot;Producción en línea&quot;)
              </label>
              <input
                name="puesto_especifico"
                className="w-full rounded border border-neutral-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Departamento(s) — puede marcar más de uno (ej. &quot;AD y Producción&quot;)
              </label>
              <div className="flex flex-wrap gap-3">
                {(departamentos as Departamento[] | null)?.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="departamentos" value={d.id} />
                    {d.nombre}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Fecha límite para confirmar
              </label>
              <input
                type="date"
                name="fecha_limite_confirmacion"
                className="w-full max-w-xs rounded border border-neutral-300 px-3 py-2"
              />
            </div>
            <button className="mt-2 rounded bg-rojo py-3 font-semibold text-hueso hover:brightness-110">
              Agregar al crew
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
