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

export async function guardarPresentacionPdf(
  proyectoId: string,
  departamentoId: string,
  archivoUrl: string,
  nombreArchivo: string
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

  await supabase.from("presentaciones_pdf").upsert(
    {
      proyecto_id: proyectoId,
      departamento_id: departamentoId,
      archivo_url: archivoUrl,
      nombre_archivo: nombreArchivo,
      updated_at: new Date().toISOString(),
      updated_by: persona?.id ?? null,
    },
    { onConflict: "proyecto_id,departamento_id" }
  );

  revalidatePath(`/proyectos/${proyectoId}/presentaciones`);
}

export async function quitarPresentacionPdf(proyectoId: string, departamentoId: string) {
  const supabase = await createClient();
  await supabase
    .from("presentaciones_pdf")
    .delete()
    .eq("proyecto_id", proyectoId)
    .eq("departamento_id", departamentoId);
  revalidatePath(`/proyectos/${proyectoId}/presentaciones`);
}
