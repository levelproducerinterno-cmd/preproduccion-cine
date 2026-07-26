"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function agregarToma(proyectoId: string, escenaId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  const { count } = await supabase
    .from("tomas")
    .select("id", { count: "exact", head: true })
    .eq("escena_id", escenaId);

  await supabase.from("tomas").insert({
    escena_id: escenaId,
    setup_num: String(formData.get("setup_num") || "") || null,
    shot_num: String(formData.get("shot_num") || "") || null,
    subject: String(formData.get("subject") || "") || null,
    shot_size: String(formData.get("shot_size") || "") || null,
    camara: String(formData.get("camara") || "") || null,
    angulo: String(formData.get("angulo") || "") || null,
    movimiento: String(formData.get("movimiento") || "") || null,
    equipo: String(formData.get("equipo") || "") || null,
    lente: String(formData.get("lente") || "") || null,
    sonido: String(formData.get("sonido") || "") || null,
    descripcion: String(formData.get("descripcion") || "") || null,
    notas: String(formData.get("notas") || "") || null,
    imagen_url: String(formData.get("imagen_url") || "") || null,
    orden: count ?? 0,
    created_by: persona?.id ?? null,
  });

  revalidatePath(`/proyectos/${proyectoId}/shotlist`);
}

export async function eliminarToma(proyectoId: string, tomaId: string) {
  const supabase = await createClient();
  await supabase.from("tomas").delete().eq("id", tomaId);
  revalidatePath(`/proyectos/${proyectoId}/shotlist`);
}

export async function obtenerShotlistCompleto(proyectoId: string) {
  const supabase = await createClient();

  const { data: escenas } = await supabase
    .from("escenas")
    .select("id, numero, int_ext, locacion, momento, orden")
    .eq("proyecto_id", proyectoId)
    .order("orden");

  const { data: tomas } = await supabase
    .from("tomas")
    .select(
      "id, escena_id, setup_num, shot_num, subject, shot_size, camara, angulo, movimiento, equipo, lente, sonido, descripcion, notas, imagen_url, orden"
    )
    .in("escena_id", (escenas ?? []).map((e) => e.id))
    .order("orden");

  return { escenas: escenas ?? [], tomas: tomas ?? [] };
}
