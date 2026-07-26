"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function crearProyecto(formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const tipo = String(formData.get("tipo") || "Cortometraje");
  const fechaDia1 = String(formData.get("fecha_dia1_rodaje") || "") || null;

  if (!nombre) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();
  if (!persona) return;

  const { data: proyecto, error } = await supabase
    .from("proyectos")
    .insert({ nombre, tipo, fecha_dia1_rodaje: fechaDia1, created_by: persona.id })
    .select("id")
    .single();
  if (error || !proyecto) {
    console.error(error);
    return;
  }

  const { data: crew, error: crewError } = await supabase
    .from("proyecto_crew")
    .insert({
      proyecto_id: proyecto.id,
      persona_id: persona.id,
      puesto_especifico: "Director(a) / AD",
      status_confirmacion: "confirmado",
      fecha_confirmado: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (crewError || !crew) {
    console.error(crewError);
    redirect(`/proyectos/${proyecto.id}/crew`);
  }

  const { data: depto } = await supabase
    .from("departamentos")
    .select("id")
    .eq("nombre", "Dirección/AD")
    .single();
  if (depto) {
    await supabase
      .from("proyecto_crew_departamentos")
      .insert({ proyecto_crew_id: crew!.id, departamento_id: depto.id });
  }

  redirect(`/proyectos/${proyecto.id}/crew`);
}
