import { redirect } from "next/navigation";
import { getProyectoContext } from "@/lib/proyecto-context";
import { datosDireccionPorDefecto, fusionarConDefault } from "@/lib/presentaciones-default";
import type { PresentacionDireccionDatos } from "@/lib/types";
import DireccionEditor from "./DireccionEditor";

export default async function PresentacionDireccionPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, proyecto, esAdOProduccion } = await getProyectoContext(proyectoId);

  if (!esAdOProduccion) redirect(`/proyectos/${proyectoId}/presentaciones`);

  const { data: fila } = await supabase
    .from("presentaciones")
    .select("datos")
    .eq("proyecto_id", proyectoId)
    .eq("tipo", "direccion")
    .maybeSingle();

  const datosIniciales = fusionarConDefault<PresentacionDireccionDatos>(
    datosDireccionPorDefecto(),
    fila?.datos
  );

  return (
    <DireccionEditor
      proyectoId={proyectoId}
      proyectoNombre={proyecto.nombre}
      colorPrimario={proyecto.color_primario}
      datosIniciales={datosIniciales}
    />
  );
}
