"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function agregarCrew(proyectoId: string, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const puestoEspecifico = String(formData.get("puesto_especifico") || "").trim();
  const fechaLimite = String(formData.get("fecha_limite_confirmacion") || "") || null;
  const departamentoIds = formData.getAll("departamentos").map(String);

  if (!nombre || !email) return;

  const supabase = await createClient();

  let { data: persona } = await supabase
    .from("personas")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (!persona) {
    const { data: nueva, error } = await supabase
      .from("personas")
      .insert({ nombre, email })
      .select("id")
      .single();
    if (error || !nueva) {
      console.error(error);
      return;
    }
    persona = nueva;
  }

  const { data: crew, error: crewError } = await supabase
    .from("proyecto_crew")
    .insert({
      proyecto_id: proyectoId,
      persona_id: persona.id,
      puesto_especifico: puestoEspecifico || null,
      fecha_limite_confirmacion: fechaLimite,
    })
    .select("id")
    .single();

  if (crewError || !crew) {
    console.error(crewError);
    return;
  }

  if (departamentoIds.length > 0) {
    await supabase.from("proyecto_crew_departamentos").insert(
      departamentoIds.map((depId) => ({ proyecto_crew_id: crew.id, departamento_id: depId }))
    );
  }

  revalidatePath(`/proyectos/${proyectoId}/crew`);
}

export async function actualizarStatusConfirmacion(
  proyectoId: string,
  crewId: string,
  status: "confirmado" | "por_confirmar" | "declinado"
) {
  const supabase = await createClient();
  await supabase
    .from("proyecto_crew")
    .update({
      status_confirmacion: status,
      fecha_confirmado: status === "confirmado" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", crewId);
  revalidatePath(`/proyectos/${proyectoId}/crew`);
}

export async function actualizarCrew(proyectoId: string, crewId: string, formData: FormData) {
  const puestoEspecifico = String(formData.get("puesto_especifico") || "").trim();
  const departamentoIds = formData.getAll("departamentos").map(String);

  const supabase = await createClient();

  await supabase
    .from("proyecto_crew")
    .update({ puesto_especifico: puestoEspecifico || null })
    .eq("id", crewId);

  await supabase.from("proyecto_crew_departamentos").delete().eq("proyecto_crew_id", crewId);
  if (departamentoIds.length > 0) {
    await supabase.from("proyecto_crew_departamentos").insert(
      departamentoIds.map((depId) => ({ proyecto_crew_id: crewId, departamento_id: depId }))
    );
  }

  revalidatePath(`/proyectos/${proyectoId}/crew`);
}

export async function eliminarCrew(proyectoId: string, crewId: string) {
  const supabase = await createClient();
  await supabase.from("proyecto_crew").delete().eq("id", crewId);
  revalidatePath(`/proyectos/${proyectoId}/crew`);
}

export async function generarInvitacion(proyectoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  await supabase
    .from("invitaciones")
    .insert({ proyecto_id: proyectoId, creado_por: persona?.id ?? null });

  revalidatePath(`/proyectos/${proyectoId}/crew`);
}

export async function desactivarInvitacion(proyectoId: string, invitacionId: string) {
  const supabase = await createClient();
  await supabase.from("invitaciones").update({ activa: false }).eq("id", invitacionId);
  revalidatePath(`/proyectos/${proyectoId}/crew`);
}
