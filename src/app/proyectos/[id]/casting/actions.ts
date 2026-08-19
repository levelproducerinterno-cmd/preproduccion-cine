"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function actualizarTalento(proyectoId: string, talentoId: string, formData: FormData) {
  const campos = [
    "personaje",
    "nombre",
    "telefono",
    "sexo",
    "estatura",
    "tallas",
    "medidas",
    "descripcion",
    "caracterizacion",
  ] as const;

  const valores: Record<string, string | null> = {};
  for (const campo of campos) {
    const valor = String(formData.get(campo) || "").trim();
    valores[campo] = valor || null;
  }
  if (!valores.nombre) return;

  const supabase = await createClient();
  await supabase.from("talento").update(valores).eq("id", talentoId);
  revalidatePath(`/proyectos/${proyectoId}/casting`);
  revalidatePath(`/proyectos/${proyectoId}/plan-rodaje`);
}

export async function agregarFotoTalento(proyectoId: string, talentoId: string, url: string) {
  const supabase = await createClient();
  await supabase.from("talento_fotos").insert({ talento_id: talentoId, url });
  revalidatePath(`/proyectos/${proyectoId}/casting`);
}

export async function eliminarFotoTalento(proyectoId: string, fotoId: string) {
  const supabase = await createClient();
  await supabase.from("talento_fotos").delete().eq("id", fotoId);
  revalidatePath(`/proyectos/${proyectoId}/casting`);
}
