"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function agregarElemento(proyectoId: string, escenaId: string, formData: FormData) {
  const categoriaId = String(formData.get("categoria_id") || "");
  const descripcion = String(formData.get("descripcion") || "").trim();
  const notas = String(formData.get("notas") || "").trim() || null;
  const departamentoId = String(formData.get("departamento_id") || "") || null;
  if (!categoriaId || !descripcion) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  await supabase.from("desglose_elementos").insert({
    escena_id: escenaId,
    categoria_id: categoriaId,
    descripcion,
    notas,
    departamento_id: departamentoId,
    created_by: persona?.id ?? null,
  });

  revalidatePath(`/proyectos/${proyectoId}/escenas`);
}

export async function actualizarStatusElemento(
  proyectoId: string,
  elementoId: string,
  status: "pendiente" | "confirmado"
) {
  const supabase = await createClient();
  await supabase.from("desglose_elementos").update({ status }).eq("id", elementoId);
  revalidatePath(`/proyectos/${proyectoId}/escenas`);
}

export async function eliminarElemento(proyectoId: string, elementoId: string) {
  const supabase = await createClient();
  await supabase.from("desglose_elementos").delete().eq("id", elementoId);
  revalidatePath(`/proyectos/${proyectoId}/escenas`);
}

export async function agregarCategoriaCustom(proyectoId: string, formData: FormData) {
  const nombre = String(formData.get("nombre_categoria") || "").trim();
  if (!nombre) return;
  const supabase = await createClient();
  await supabase.from("desglose_categorias").insert({ proyecto_id: proyectoId, nombre, es_estandar: false });
  revalidatePath(`/proyectos/${proyectoId}/escenas`);
}
