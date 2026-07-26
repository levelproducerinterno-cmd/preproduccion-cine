import { getProyectoContext } from "@/lib/proyecto-context";
import { eliminarToma } from "./actions";
import TomaForm from "./TomaForm";
import ShotlistPdfBoton from "./ShotlistPdfBoton";
import type { Escena, Toma } from "@/lib/types";
import { extraerSegmentosPorEscena } from "@/lib/guion-parse";
import EscenaTexto from "@/components/EscenaTexto";

export default async function ShotlistPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, proyecto, miDepartamentos, esAdOProduccion } = await getProyectoContext(proyectoId);

  const puedeEditar =
    esAdOProduccion || miDepartamentos.includes("Fotografía") || miDepartamentos.includes("Gaffer");

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

  const { data: tomasRaw } = await supabase
    .from("tomas")
    .select(
      "id, escena_id, setup_num, shot_num, subject, shot_size, camara, angulo, movimiento, equipo, lente, sonido, descripcion, notas, imagen_url, importancia, orden"
    )
    .in("escena_id", (escenas ?? []).map((e) => e.id))
    .order("orden");

  const tomasPorEscena = new Map<string, Toma[]>();
  for (const t of (tomasRaw ?? []) as Toma[]) {
    tomasPorEscena.set(t.escena_id, [...(tomasPorEscena.get(t.escena_id) ?? []), t]);
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <ShotlistPdfBoton
          proyectoId={proyectoId}
          nombreProyecto={proyecto.nombre}
          logoUrl={proyecto.logo_url}
          colorPrimario={proyecto.color_primario}
        />
      </div>

      {(escenas ?? []).length === 0 && (
        <p className="rounded-lg border border-neutral-200 bg-white p-10 text-center text-neutral-500 shadow-sm">
          Aún no hay escenas. Se crean automáticamente al escribir encabezados de escena en la pestaña Guion.
        </p>
      )}

      {(escenas as Escena[] | null)?.map((esc, idx) => {
        const tomas = tomasPorEscena.get(esc.id) ?? [];
        return (
          <details key={esc.id} className="rounded-lg border border-neutral-200 bg-white shadow-sm" open>
            <summary className="cursor-pointer px-5 py-4 font-semibold text-negro">
              Escena {esc.numero} — {esc.int_ext ?? "?"}. {esc.locacion ?? "Sin locación"} - {esc.momento ?? "?"}
              <span className="ml-2 text-xs font-normal text-neutral-400">
                ({tomas.length} toma{tomas.length === 1 ? "" : "s"})
              </span>
            </summary>
            <div className="border-t border-neutral-100 p-5">
              <EscenaTexto texto={segmentosGuion[idx] ?? ""} />
              {tomas.length > 0 ? (
                <div className="overflow-x-auto rounded border border-neutral-100">
                  <table className="w-full min-w-[900px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-negro text-hueso">
                        <th className="p-2 text-left font-semibold">Ref.</th>
                        <th className="p-2 text-left font-semibold">Setup#</th>
                        <th className="p-2 text-left font-semibold">Shot#</th>
                        <th className="p-2 text-left font-semibold">Subject</th>
                        <th className="p-2 text-left font-semibold">Shot size</th>
                        <th className="p-2 text-left font-semibold">Cámara</th>
                        <th className="p-2 text-left font-semibold">Ángulo</th>
                        <th className="p-2 text-left font-semibold">Movimiento</th>
                        <th className="p-2 text-left font-semibold">Equipo</th>
                        <th className="p-2 text-left font-semibold">Lente</th>
                        <th className="p-2 text-left font-semibold">Sonido</th>
                        <th className="p-2 text-left font-semibold">Descripción</th>
                        <th className="p-2 text-left font-semibold">Notas</th>
                        <th className="p-2 text-left font-semibold">Importancia</th>
                        {puedeEditar && <th className="p-2"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {tomas.map((t, i) => (
                        <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}>
                          <td className="border border-neutral-100 p-2">
                            {t.imagen_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={t.imagen_url} alt="Referencia" className="h-10 w-10 rounded object-cover" />
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="border border-neutral-100 p-2">{t.setup_num ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.shot_num ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.subject ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.shot_size ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.camara ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.angulo ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.movimiento ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.equipo ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.lente ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.sonido ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.descripcion ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">{t.notas ?? "-"}</td>
                          <td className="border border-neutral-100 p-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase ${
                                t.importancia === "Obligatorio" ? "bg-rojo/15 text-rojo" : "bg-neutral-200 text-neutral-600"
                              }`}
                            >
                              {t.importancia}
                            </span>
                          </td>
                          {puedeEditar && (
                            <td className="border border-neutral-100 p-2">
                              <form action={eliminarToma.bind(null, proyectoId, t.id)}>
                                <button className="text-neutral-300 hover:text-rojo">✕</button>
                              </form>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">Sin tomas todavía.</p>
              )}

              {puedeEditar && <TomaForm proyectoId={proyectoId} escenaId={esc.id} />}
            </div>
          </details>
        );
      })}
    </div>
  );
}
