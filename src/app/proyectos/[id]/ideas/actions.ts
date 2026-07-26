"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function agregarIdea(proyectoId: string, formData: FormData) {
  const descripcion = String(formData.get("descripcion") || "").trim();
  const prioridad = String(formData.get("prioridad") || "No importante");
  const departamentoId = String(formData.get("departamento_id") || "") || null;
  if (!descripcion) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  await supabase.from("ideas").insert({
    proyecto_id: proyectoId,
    descripcion,
    prioridad,
    departamento_id: departamentoId,
    created_by: persona?.id ?? null,
  });

  revalidatePath(`/proyectos/${proyectoId}/ideas`);
}

export async function aprobarYPasarAlCalendario(proyectoId: string, ideaId: string) {
  const supabase = await createClient();
  const { data: idea } = await supabase
    .from("ideas")
    .select("descripcion, departamento_id")
    .eq("id", ideaId)
    .single();
  if (!idea) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  const { data: hito } = await supabase
    .from("hitos_preproduccion")
    .insert({
      proyecto_id: proyectoId,
      nombre: idea.descripcion,
      departamento_id: idea.departamento_id,
      created_by: persona?.id ?? null,
    })
    .select("id")
    .single();

  await supabase
    .from("ideas")
    .update({ status: "aprobada", hito_id: hito?.id ?? null })
    .eq("id", ideaId);

  revalidatePath(`/proyectos/${proyectoId}/ideas`);
  revalidatePath(`/proyectos/${proyectoId}/calendario`);
}

export async function eliminarIdea(proyectoId: string, ideaId: string) {
  const supabase = await createClient();
  await supabase.from("ideas").delete().eq("id", ideaId);
  revalidatePath(`/proyectos/${proyectoId}/ideas`);
}
