"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function actualizarProyecto(proyectoId: string, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const tipo = String(formData.get("tipo") || "Cortometraje");
  const fechaDia1 = String(formData.get("fecha_dia1_rodaje") || "") || null;
  const colorPrimario = String(formData.get("color_primario") || "#c72a09");
  const colorSecundario = String(formData.get("color_secundario") || "#0a0908");

  if (!nombre) return;

  const supabase = await createClient();
  await supabase
    .from("proyectos")
    .update({
      nombre,
      tipo,
      fecha_dia1_rodaje: fechaDia1,
      color_primario: colorPrimario,
      color_secundario: colorSecundario,
    })
    .eq("id", proyectoId);

  revalidatePath(`/proyectos/${proyectoId}`, "layout");
}

export async function actualizarLogo(proyectoId: string, logoUrl: string) {
  const supabase = await createClient();
  await supabase.from("proyectos").update({ logo_url: logoUrl }).eq("id", proyectoId);
  revalidatePath(`/proyectos/${proyectoId}`, "layout");
}
