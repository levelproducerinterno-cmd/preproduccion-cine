import { getProyectoContext } from "@/lib/proyecto-context";
import type { Talento, TalentoFoto } from "@/lib/types";
import { actualizarTalento } from "./actions";
import { agregarTalento, eliminarTalento } from "../plan-rodaje/actions";
import FotosTalento from "./FotosTalento";

export default async function CastingPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, esAdOProduccion } = await getProyectoContext(proyectoId);

  const { data: talentoRaw } = await supabase
    .from("talento")
    .select(
      "id, proyecto_id, personaje, nombre, telefono, orden, sexo, estatura, tallas, medidas, descripcion, caracterizacion"
    )
    .eq("proyecto_id", proyectoId)
    .order("orden");
  const talento = (talentoRaw ?? []) as Talento[];

  const { data: fotosRaw } = await supabase
    .from("talento_fotos")
    .select("id, talento_id, url, orden")
    .in("talento_id", talento.map((t) => t.id))
    .order("orden");
  const fotos = (fotosRaw ?? []) as TalentoFoto[];
  const fotosPorTalento = new Map<string, TalentoFoto[]>();
  for (const f of fotos) {
    fotosPorTalento.set(f.talento_id, [...(fotosPorTalento.get(f.talento_id) ?? []), f]);
  }

  return (
    <div className="grid gap-6">
      <p className="text-sm text-neutral-500">
        Un lugar por personaje: arriba la caracterización que escribió Dirección (para tener claro a quién
        buscamos), abajo los datos reales del actor/actriz elegido y sus fotos, para comparar de un vistazo.
      </p>

      <div className="grid gap-4">
        {talento.map((t) => (
          <div key={t.id} className="rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Personaje</span>
                  <h3 className="text-lg font-semibold text-negro">{t.personaje || "Sin nombre de personaje"}</h3>
                </div>
                {esAdOProduccion && (
                  <form action={eliminarTalento.bind(null, proyectoId, t.id)}>
                    <button className="text-xs text-neutral-300 hover:text-rojo">Eliminar</button>
                  </form>
                )}
              </div>
              <p className="mt-1 text-sm italic text-neutral-600">
                {t.caracterizacion || "Sin caracterización todavía."}
              </p>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto]">
              <div className="grid gap-2 text-sm">
                <div>
                  <span className="font-semibold text-negro">{t.nombre}</span>
                  {t.telefono && <span className="ml-2 text-xs text-neutral-400">{t.telefono}</span>}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-600 sm:grid-cols-4">
                  <div>
                    <span className="block font-bold uppercase text-neutral-400">Sexo</span>
                    {t.sexo || "-"}
                  </div>
                  <div>
                    <span className="block font-bold uppercase text-neutral-400">Estatura</span>
                    {t.estatura || "-"}
                  </div>
                  <div>
                    <span className="block font-bold uppercase text-neutral-400">Tallas</span>
                    {t.tallas || "-"}
                  </div>
                  <div>
                    <span className="block font-bold uppercase text-neutral-400">Medidas</span>
                    {t.medidas || "-"}
                  </div>
                </div>
                {t.descripcion && <p className="text-xs text-neutral-500">{t.descripcion}</p>}
              </div>

              <FotosTalento
                proyectoId={proyectoId}
                talentoId={t.id}
                fotos={fotosPorTalento.get(t.id) ?? []}
                puedeEditar={esAdOProduccion}
              />
            </div>

            {esAdOProduccion && (
              <details className="border-t border-neutral-100 p-4">
                <summary className="cursor-pointer text-xs font-semibold text-neutral-400 hover:text-negro">
                  Editar datos
                </summary>
                <form
                  action={actualizarTalento.bind(null, proyectoId, t.id)}
                  className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                  <input
                    name="personaje"
                    defaultValue={t.personaje ?? ""}
                    placeholder="Personaje"
                    className="col-span-2 rounded border border-neutral-300 px-2 py-1.5 text-sm sm:col-span-4"
                  />
                  <textarea
                    name="caracterizacion"
                    defaultValue={t.caracterizacion ?? ""}
                    placeholder="Caracterización del personaje (cómo es, cómo se ve, para comparar con el actor/actriz)"
                    rows={2}
                    className="col-span-2 rounded border border-neutral-300 px-2 py-1.5 text-sm sm:col-span-4"
                  />
                  <input
                    name="nombre"
                    defaultValue={t.nombre}
                    required
                    placeholder="Nombre del actor/actriz"
                    className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    name="telefono"
                    defaultValue={t.telefono ?? ""}
                    placeholder="Teléfono"
                    className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    name="sexo"
                    defaultValue={t.sexo ?? ""}
                    placeholder="Sexo"
                    className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    name="estatura"
                    defaultValue={t.estatura ?? ""}
                    placeholder="Estatura"
                    className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    name="tallas"
                    defaultValue={t.tallas ?? ""}
                    placeholder="Tallas (ropa, calzado...)"
                    className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    name="medidas"
                    defaultValue={t.medidas ?? ""}
                    placeholder="Medidas"
                    className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
                  />
                  <textarea
                    name="descripcion"
                    defaultValue={t.descripcion ?? ""}
                    placeholder="Descripción física / notas"
                    rows={2}
                    className="col-span-2 rounded border border-neutral-300 px-2 py-1.5 text-sm sm:col-span-4"
                  />
                  <button className="col-span-2 rounded bg-rojo px-3 py-2 text-sm font-semibold text-hueso hover:brightness-110 sm:col-span-4">
                    Guardar
                  </button>
                </form>
              </details>
            )}
          </div>
        ))}
        {talento.length === 0 && (
          <p className="rounded-lg border border-neutral-200 bg-white p-10 text-center text-neutral-500 shadow-sm">
            Aún no hay personajes/talento agregado.
          </p>
        )}
      </div>

      {esAdOProduccion && (
        <details className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-500">
            + Agregar personaje / talento
          </summary>
          <form action={agregarTalento.bind(null, proyectoId)} className="mt-3 grid grid-cols-3 gap-2">
            <input name="personaje" placeholder="Personaje" className="rounded border border-neutral-300 px-2 py-1.5 text-sm" />
            <input name="nombre" placeholder="Nombre del actor/actriz" required className="rounded border border-neutral-300 px-2 py-1.5 text-sm" />
            <input name="telefono" placeholder="Teléfono" className="rounded border border-neutral-300 px-2 py-1.5 text-sm" />
            <button className="col-span-3 rounded bg-rojo py-2 text-sm font-semibold text-hueso hover:brightness-110">
              + Agregar
            </button>
          </form>
        </details>
      )}
    </div>
  );
}
