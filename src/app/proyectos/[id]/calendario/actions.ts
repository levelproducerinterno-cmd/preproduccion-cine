"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function agregarHito(proyectoId: string, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const departamentoId = String(formData.get("departamento_id") || "") || null;
  const fechaLimite = String(formData.get("fecha_limite") || "") || null;
  const notas = String(formData.get("notas") || "").trim() || null;
  if (!nombre) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  await supabase.from("hitos_preproduccion").insert({
    proyecto_id: proyectoId,
    nombre,
    departamento_id: departamentoId,
    fecha_limite: fechaLimite,
    notas,
    created_by: persona?.id ?? null,
  });

  revalidatePath(`/proyectos/${proyectoId}/calendario`);
}

export async function actualizarStatusHito(
  proyectoId: string,
  hitoId: string,
  status: "pendiente" | "en_progreso" | "completado"
) {
  const supabase = await createClient();
  await supabase.from("hitos_preproduccion").update({ status }).eq("id", hitoId);
  revalidatePath(`/proyectos/${proyectoId}/calendario`);
}

export async function eliminarHito(proyectoId: string, hitoId: string) {
  const supabase = await createClient();
  await supabase.from("hitos_preproduccion").delete().eq("id", hitoId);
  revalidatePath(`/proyectos/${proyectoId}/calendario`);
}
