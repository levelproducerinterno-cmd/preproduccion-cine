"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function guardarRespuestas(proyectoId: string, crewId: string, formData: FormData) {
  const supabase = await createClient();
  const entradas = [...formData.entries()].filter(([k]) => k.startsWith("pregunta_"));

  for (const [key, value] of entradas) {
    const preguntaId = key.replace("pregunta_", "");
    const respuesta = String(value).trim();
    await supabase
      .from("respuestas_registro")
      .upsert(
        { proyecto_crew_id: crewId, pregunta_id: preguntaId, respuesta, updated_at: new Date().toISOString() },
        { onConflict: "proyecto_crew_id,pregunta_id" }
      );
  }

  revalidatePath(`/proyectos/${proyectoId}/datos`);
}

export async function agregarPreguntaCustom(proyectoId: string, formData: FormData) {
  const texto = String(formData.get("texto") || "").trim();
  if (!texto) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  const { data: maxOrden } = await supabase
    .from("preguntas_registro")
    .select("orden")
    .or(`proyecto_id.eq.${proyectoId},proyecto_id.is.null`)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("preguntas_registro").insert({
    proyecto_id: proyectoId,
    texto,
    orden: (maxOrden?.orden ?? 0) + 1,
    created_by: persona?.id ?? null,
  });

  revalidatePath(`/proyectos/${proyectoId}/datos`);
}

export async function desactivarPregunta(proyectoId: string, preguntaId: string) {
  const supabase = await createClient();
  await supabase.from("preguntas_registro").update({ activa: false }).eq("id", preguntaId);
  revalidatePath(`/proyectos/${proyectoId}/datos`);
}

export async function obtenerRespuestasPersona(crewId: string) {
  const supabase = await createClient();

  const { data: crew } = await supabase
    .from("proyecto_crew")
    .select("proyecto_id, puesto_especifico, personas(nombre, email)")
    .eq("id", crewId)
    .single();
  if (!crew) return null;

  const { data: preguntas } = await supabase
    .from("preguntas_registro")
    .select("id, texto, orden")
    .or(`proyecto_id.eq.${crew.proyecto_id},proyecto_id.is.null`)
    .eq("activa", true)
    .order("orden");

  const { data: respuestas } = await supabase
    .from("respuestas_registro")
    .select("pregunta_id, respuesta")
    .eq("proyecto_crew_id", crewId);

  const respuestasPorPregunta = new Map((respuestas ?? []).map((r) => [r.pregunta_id, r.respuesta]));

  return {
    nombre: (crew.personas as unknown as { nombre: string }).nombre,
    email: (crew.personas as unknown as { email: string | null }).email ?? "Sin correo registrado",
    puesto: crew.puesto_especifico,
    items: (preguntas ?? []).map((p) => ({
      texto: p.texto,
      respuesta: respuestasPorPregunta.get(p.id) ?? "",
    })),
  };
}
