"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function actualizarProyecto(proyectoId: string, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const tipo = String(formData.get("tipo") || "Cortometraje");
  const fechaDia1 = String(formData.get("fecha_dia1_rodaje") || "") || null;

  if (!nombre) return;

  const supabase = await createClient();
  await supabase
    .from("proyectos")
    .update({ nombre, tipo, fecha_dia1_rodaje: fechaDia1 })
    .eq("id", proyectoId);

  revalidatePath(`/proyectos/${proyectoId}`, "layout");
}
