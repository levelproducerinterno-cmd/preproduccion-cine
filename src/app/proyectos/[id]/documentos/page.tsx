import { redirect } from "next/navigation";
import { getProyectoContext } from "@/lib/proyecto-context";
import { crearPlantilla, eliminarPlantilla } from "./actions";
import DocumentoPdfBoton from "./DocumentoPdfBoton";

type Plantilla = { id: string; nombre: string; cuerpo: string };

export default async function DocumentosPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, proyecto, esAdOProduccion } = await getProyectoContext(proyectoId);

  if (!esAdOProduccion) redirect(`/proyectos/${proyectoId}/crew`);

  const { data: plantillasRaw } = await supabase
    .from("documento_plantillas")
    .select("id, nombre, cuerpo")
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: false });
  const plantillas = (plantillasRaw ?? []) as Plantilla[];

  return (
    <div className="grid gap-8">
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
          Tus documentos ({plantillas.length})
        </h2>
        <p className="mb-4 text-xs text-neutral-400">
          Escribe el texto de tu responsiva/contrato tal como quieres que salga. Puedes usar{" "}
          <code className="rounded bg-neutral-100 px-1">{"{{nombre}}"}</code> en el texto para que se
          reemplace automáticamente por la persona a la que se lo generes. Todos los documentos llevan
          el mismo membrete (logo, colores, fecha) y la firma que subiste en Ajustes.
        </p>
        <div className="grid gap-3">
          {plantillas.map((p) => (
            <div key={p.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-negro">{p.nombre}</span>
                <form action={eliminarPlantilla.bind(null, proyectoId, p.id)}>
                  <button className="text-xs text-neutral-300 hover:text-rojo">Eliminar</button>
                </form>
              </div>
              <DocumentoPdfBoton
                nombrePlantilla={p.nombre}
                cuerpo={p.cuerpo}
                proyectoNombre={proyecto.nombre}
                logoUrl={proyecto.logo_url}
                colorPrimario={proyecto.color_primario}
                firmaUrl={proyecto.firma_url}
                nombreResponsable={proyecto.nombre_responsable}
              />
            </div>
          ))}
          {plantillas.length === 0 && (
            <p className="rounded-lg border border-neutral-200 bg-white p-10 text-center text-neutral-500 shadow-sm">
              Aún no has creado ningún documento.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
          Nuevo documento
        </h2>
        <form
          action={crearPlantilla.bind(null, proyectoId)}
          className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
              Nombre del documento
            </label>
            <input
              name="nombre"
              required
              placeholder="Ej. Responsiva para actores"
              className="w-full rounded border border-neutral-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
              Texto del documento
            </label>
            <textarea
              name="cuerpo"
              rows={14}
              placeholder={"Yo, {{nombre}}, participante del proyecto...\n\nAcepto las siguientes condiciones..."}
              className="w-full resize-y rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <button className="mt-2 rounded bg-rojo py-3 font-semibold text-hueso hover:brightness-110">
            + Crear documento
          </button>
        </form>
      </section>
    </div>
  );
}
