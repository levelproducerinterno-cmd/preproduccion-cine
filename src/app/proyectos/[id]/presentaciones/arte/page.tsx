import { redirect } from "next/navigation";
import { getProyectoContext } from "@/lib/proyecto-context";
import { datosArtePorDefecto, fusionarConDefault } from "@/lib/presentaciones-default";
import type { PresentacionArteDatos } from "@/lib/types";
import ArteEditor from "./ArteEditor";

export default async function PresentacionArtePage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, proyecto, esAdOProduccion, miDepartamentos } = await getProyectoContext(proyectoId);

  const puedeEditar = esAdOProduccion || miDepartamentos.includes("Arte");
  if (!puedeEditar) redirect(`/proyectos/${proyectoId}/presentaciones`);

  const { data: fila } = await supabase
    .from("presentaciones")
    .select("datos")
    .eq("proyecto_id", proyectoId)
    .eq("tipo", "arte")
    .maybeSingle();

  const datosIniciales = fusionarConDefault<PresentacionArteDatos>(datosArtePorDefecto(), fila?.datos);

  return (
    <ArteEditor
      proyectoId={proyectoId}
      proyectoNombre={proyecto.nombre}
      colorPrimario={proyecto.color_primario}
      datosIniciales={datosIniciales}
    />
  );
}
