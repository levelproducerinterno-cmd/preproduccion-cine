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
      "id, escena_id, setup_num, shot_num, subject, shot_size, camara, angulo, movimiento, equipo, lente, sonido, descripcion, notas, imagen_url, orden"
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
              <div className="grid gap-2">
                {tomas.map((t) => (
                  <div key={t.id} className="flex gap-3 rounded border border-neutral-100 bg-neutral-50 p-3">
                    {t.imagen_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.imagen_url} alt="Referencia" className="h-16 w-16 rounded object-cover" />
                    )}
                    <div className="flex-1 text-sm">
                      <div className="font-semibold text-negro">
                        Setup {t.setup_num ?? "-"} / Shot {t.shot_num ?? "-"} — {t.subject ?? ""}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {[t.shot_size, t.camara, t.angulo, t.movimiento, t.equipo, t.lente, t.sonido]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      {t.descripcion && <div className="mt-1 text-xs text-neutral-600">{t.descripcion}</div>}
                      {t.notas && <div className="text-xs text-neutral-400">Notas: {t.notas}</div>}
                    </div>
                    {puedeEditar && (
                      <form action={eliminarToma.bind(null, proyectoId, t.id)}>
                        <button className="text-xs text-neutral-300 hover:text-rojo">✕</button>
                      </form>
                    )}
                  </div>
                ))}
                {tomas.length === 0 && <p className="text-sm text-neutral-400">Sin tomas todavía.</p>}
              </div>

              {puedeEditar && <TomaForm proyectoId={proyectoId} escenaId={esc.id} />}
            </div>
          </details>
        );
      })}
    </div>
  );
}
