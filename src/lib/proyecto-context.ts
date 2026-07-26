import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getProyectoContext(proyectoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: persona } = await supabase
    .from("personas")
    .select("id, nombre, email, color")
    .eq("auth_user_id", user!.id)
    .single();
  if (!persona) redirect("/login");

  const { data: proyecto } = await supabase
    .from("proyectos")
    .select("id, nombre, tipo, fecha_dia1_rodaje, logo_url, color_primario, color_secundario, firma_url, nombre_responsable")
    .eq("id", proyectoId)
    .single();
  if (!proyecto) redirect("/proyectos");

  const { data: miCrew } = await supabase
    .from("proyecto_crew")
    .select("id, puesto_especifico, proyecto_crew_departamentos(departamentos(nombre))")
    .eq("proyecto_id", proyectoId)
    .eq("persona_id", persona.id)
    .maybeSingle();

  if (!miCrew) redirect("/proyectos");

  const miDepartamentos = (miCrew.proyecto_crew_departamentos ?? []).map(
    (d) => (d.departamentos as unknown as { nombre: string })?.nombre
  );
  const esAdOProduccion =
    miDepartamentos.includes("Dirección/AD") || miDepartamentos.includes("Producción");

  return {
    supabase,
    proyecto,
    persona,
    miDepartamentos,
    esAdOProduccion,
    puestoEspecifico: miCrew.puesto_especifico as string | null,
    miCrewId: miCrew.id as string,
  };
}
