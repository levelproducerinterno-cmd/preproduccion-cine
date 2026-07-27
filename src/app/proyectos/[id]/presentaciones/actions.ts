"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function guardarPresentacion(
  proyectoId: string,
  tipo: "arte" | "direccion",
  datos: unknown
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  await supabase.from("presentaciones").upsert(
    {
      proyecto_id: proyectoId,
      tipo,
      datos,
      updated_at: new Date().toISOString(),
      updated_by: persona?.id ?? null,
    },
    { onConflict: "proyecto_id,tipo" }
  );

  revalidatePath(`/proyectos/${proyectoId}/presentaciones/${tipo === "arte" ? "arte" : "direccion"}`);
}
