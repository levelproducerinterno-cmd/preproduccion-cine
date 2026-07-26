import { getProyectoContext } from "@/lib/proyecto-context";
import { crearGuion } from "./actions";
import GuionEditor from "./GuionEditor";

export default async function GuionPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, miDepartamentos } = await getProyectoContext(proyectoId);
  const puedeEditar = miDepartamentos.includes("Dirección/AD");

  const { data: guion } = await supabase
    .from("guiones")
    .select("id, titulo, version, contenido")
    .eq("proyecto_id", proyectoId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!guion) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center shadow-sm">
        <p className="mb-4 text-neutral-500">Este proyecto todavía no tiene guion.</p>
        {puedeEditar ? (
          <form action={crearGuion.bind(null, proyectoId)}>
            <button className="rounded bg-rojo px-6 py-3 font-semibold text-hueso hover:brightness-110">
              Crear guion
            </button>
          </form>
        ) : (
          <p className="text-sm text-neutral-400">Dirección/AD todavía no lo ha creado.</p>
        )}
      </div>
    );
  }

  const { count } = await supabase
    .from("escenas")
    .select("id", { count: "exact", head: true })
    .eq("guion_id", guion.id);

  return (
    <GuionEditor
      proyectoId={proyectoId}
      guionId={guion.id}
      contenidoInicial={guion.contenido ?? ""}
      puedeEditar={puedeEditar}
      numEscenas={count ?? 0}
    />
  );
}
