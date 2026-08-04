import { createClient } from "@/lib/supabase/server";
import { crearProyecto } from "./actions";
import { signOutAction } from "@/lib/actions/auth";
import Link from "next/link";

export default async function ProyectosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: persona } = await supabase
    .from("personas")
    .select("id, nombre")
    .eq("auth_user_id", user!.id)
    .single();

  const { data: crewRows } = await supabase
    .from("proyecto_crew")
    .select("proyecto_id, puesto_especifico, proyectos(id, nombre, tipo, fecha_dia1_rodaje)")
    .eq("persona_id", persona?.id ?? "");

  const proyectos = (crewRows ?? [])
    .map((r) => ({ ...(r.proyectos as unknown as { id: string; nombre: string; tipo: string; fecha_dia1_rodaje: string | null }), puesto: r.puesto_especifico }))
    .filter(Boolean);

  return (
    <div className="min-h-full bg-neutral-100">
      <header className="flex items-center justify-between bg-negro px-8 py-4 text-hueso">
        <h1 className="text-lg font-semibold tracking-wide">
          Pre<span className="text-rojo">producción</span>
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <span>{persona?.nombre}</span>
          <form action={signOutAction}>
            <button className="rounded border border-neutral-500 px-3 py-1 hover:border-hueso">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
          Tus proyectos
        </h2>
        <div className="mb-10 grid gap-3">
          {proyectos.length === 0 && (
            <p className="text-neutral-500">Aún no perteneces a ningún proyecto. Crea el primero abajo.</p>
          )}
          {proyectos.map((p) => (
            <Link
              key={p.id}
              href={`/proyectos/${p.id}/calendario`}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4 shadow-sm hover:border-rojo"
            >
              <div>
                <div className="font-semibold text-negro">{p.nombre}</div>
                <div className="text-xs uppercase tracking-wide text-neutral-500">
                  {p.tipo} {p.fecha_dia1_rodaje ? `· Día 1 de rodaje: ${p.fecha_dia1_rodaje}` : ""}
                </div>
              </div>
              <span className="text-xs font-semibold text-neutral-400">{p.puesto}</span>
            </Link>
          ))}
        </div>

        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
          Nuevo proyecto
        </h2>
        <form action={crearProyecto} className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
              Nombre
            </label>
            <input
              name="nombre"
              required
              placeholder="Ej. Cortometraje X"
              className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-rojo focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Tipo
              </label>
              <select name="tipo" className="w-full rounded border border-neutral-300 px-3 py-2">
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
                className="w-full rounded border border-neutral-300 px-3 py-2"
              />
            </div>
          </div>
          <button className="mt-2 rounded bg-rojo py-3 font-semibold text-hueso hover:brightness-110">
            Crear proyecto
          </button>
        </form>
      </main>
    </div>
  );
}
