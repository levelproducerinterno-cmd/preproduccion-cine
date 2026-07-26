"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearPlantilla(proyectoId: string, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const cuerpo = String(formData.get("cuerpo") || "");
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

  await supabase.from("documento_plantillas").insert({
    proyecto_id: proyectoId,
    nombre,
    cuerpo,
    created_by: persona?.id ?? null,
  });

  revalidatePath(`/proyectos/${proyectoId}/documentos`);
}

export async function actualizarPlantilla(proyectoId: string, plantillaId: string, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const cuerpo = String(formData.get("cuerpo") || "");
  if (!nombre) return;

  const supabase = await createClient();
  await supabase
    .from("documento_plantillas")
    .update({ nombre, cuerpo, updated_at: new Date().toISOString() })
    .eq("id", plantillaId);

  revalidatePath(`/proyectos/${proyectoId}/documentos`);
}

export async function eliminarPlantilla(proyectoId: string, plantillaId: string) {
  const supabase = await createClient();
  await supabase.from("documento_plantillas").delete().eq("id", plantillaId);
  revalidatePath(`/proyectos/${proyectoId}/documentos`);
}
