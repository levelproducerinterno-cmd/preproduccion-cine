"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function ruta(proyectoId: string) {
  return `/proyectos/${proyectoId}/plan-rodaje`;
}

export async function crearDiaRodaje(proyectoId: string, formData: FormData) {
  const numero = Number(formData.get("numero") || 0);
  if (!numero) return;
  const fecha = String(formData.get("fecha") || "") || null;
  const llamadoGeneral = String(formData.get("llamado_general") || "").trim() || null;
  const jornadaHoras = String(formData.get("jornada_horas") || "").trim() || null;
  const readyToShoot = String(formData.get("ready_to_shoot") || "").trim() || null;

  const supabase = await createClient();
  await supabase.from("dias_rodaje").insert({
    proyecto_id: proyectoId,
    numero,
    fecha,
    llamado_general: llamadoGeneral,
    jornada_horas: jornadaHoras,
    ready_to_shoot: readyToShoot,
    orden: numero,
  });

  revalidatePath(ruta(proyectoId));
}

export async function actualizarDiaRodaje(proyectoId: string, diaId: string, campo: string, valor: string) {
  const supabase = await createClient();
  await supabase
    .from("dias_rodaje")
    .update({ [campo]: valor || null })
    .eq("id", diaId);
  revalidatePath(ruta(proyectoId));
}

export async function eliminarDiaRodaje(proyectoId: string, diaId: string) {
  const supabase = await createClient();
  await supabase.from("dias_rodaje").delete().eq("id", diaId);
  revalidatePath(ruta(proyectoId));
}

export async function asignarEscenaADia(
  proyectoId: string,
  escenaId: string,
  diaRodajeNumero: string,
  ordenDelDia: string
) {
  const supabase = await createClient();
  await supabase
    .from("escenas")
    .update({
      dia_rodaje_numero: diaRodajeNumero ? Number(diaRodajeNumero) : null,
      orden_del_dia: ordenDelDia ? Number(ordenDelDia) : null,
    })
    .eq("id", escenaId);
  revalidatePath(ruta(proyectoId));
}

export async function actualizarCampoToma(proyectoId: string, tomaId: string, campo: string, valor: string) {
  const camposValidos = ["hora_inicio", "tiempo_estimado", "talento_en_toma", "set_especifico", "notas_arte", "orden"];
  if (!camposValidos.includes(campo)) return;
  const supabase = await createClient();
  await supabase
    .from("tomas")
    .update({ [campo]: campo === "orden" ? Number(valor) || 0 : valor || null })
    .eq("id", tomaId);
  revalidatePath(ruta(proyectoId));
  revalidatePath(`/proyectos/${proyectoId}/shotlist`);
}

export async function agregarBloque(proyectoId: string, diaRodajeId: string, formData: FormData) {
  const descripcion = String(formData.get("descripcion") || "").trim();
  if (!descripcion) return;
  const hora = String(formData.get("hora") || "").trim() || null;
  const orden = Number(formData.get("orden") || 0);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase.from("personas").select("id").eq("auth_user_id", user!.id).single();

  await supabase.from("plan_rodaje_bloques").insert({
    dia_rodaje_id: diaRodajeId,
    hora,
    descripcion,
    orden,
    created_by: persona?.id ?? null,
  });

  revalidatePath(ruta(proyectoId));
}

export async function actualizarBloque(proyectoId: string, bloqueId: string, campo: "hora" | "descripcion", valor: string) {
  const supabase = await createClient();
  await supabase
    .from("plan_rodaje_bloques")
    .update({ [campo]: valor || null })
    .eq("id", bloqueId);
  revalidatePath(ruta(proyectoId));
}

export async function eliminarBloque(proyectoId: string, bloqueId: string) {
  const supabase = await createClient();
  await supabase.from("plan_rodaje_bloques").delete().eq("id", bloqueId);
  revalidatePath(ruta(proyectoId));
}

export async function reordenarRenglones(
  proyectoId: string,
  cambios: { tipo: "bloque" | "toma"; id: string; orden: number }[]
) {
  const supabase = await createClient();
  await Promise.all(
    cambios.map((c) =>
      c.tipo === "bloque"
        ? supabase.from("plan_rodaje_bloques").update({ orden: c.orden }).eq("id", c.id)
        : supabase.from("tomas").update({ orden_plan_rodaje: c.orden }).eq("id", c.id)
    )
  );
  revalidatePath(ruta(proyectoId));
}

export async function excluirArteDeToma(proyectoId: string, tomaId: string, elementoId: string) {
  const supabase = await createClient();
  await supabase.from("toma_arte_excluidos").insert({ toma_id: tomaId, desglose_elemento_id: elementoId });
  revalidatePath(ruta(proyectoId));
}

export async function incluirArteEnToma(proyectoId: string, tomaId: string, elementoId: string) {
  const supabase = await createClient();
  await supabase
    .from("toma_arte_excluidos")
    .delete()
    .eq("toma_id", tomaId)
    .eq("desglose_elemento_id", elementoId);
  revalidatePath(ruta(proyectoId));
}

export async function agregarLocacion(proyectoId: string, diaRodajeId: string, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;
  const urlMaps = String(formData.get("url_maps") || "").trim() || null;

  const supabase = await createClient();
  await supabase.from("dia_rodaje_locaciones").insert({ dia_rodaje_id: diaRodajeId, nombre, url_maps: urlMaps });
  revalidatePath(ruta(proyectoId));
}

export async function eliminarLocacion(proyectoId: string, locacionId: string) {
  const supabase = await createClient();
  await supabase.from("dia_rodaje_locaciones").delete().eq("id", locacionId);
  revalidatePath(ruta(proyectoId));
}

export async function actualizarLlamadoCrew(
  proyectoId: string,
  diaRodajeId: string,
  proyectoCrewId: string,
  campo: "llamado" | "locacion_url",
  valor: string
) {
  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("dia_rodaje_crew_llamados")
    .select("id")
    .eq("dia_rodaje_id", diaRodajeId)
    .eq("proyecto_crew_id", proyectoCrewId)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("dia_rodaje_crew_llamados")
      .update({ [campo]: valor || null })
      .eq("id", existente.id);
  } else {
    await supabase.from("dia_rodaje_crew_llamados").insert({
      dia_rodaje_id: diaRodajeId,
      proyecto_crew_id: proyectoCrewId,
      [campo]: valor || null,
    });
  }
  revalidatePath(ruta(proyectoId));
}

export async function agregarTalento(proyectoId: string, formData: FormData) {
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return;
  const personaje = String(formData.get("personaje") || "").trim() || null;
  const telefono = String(formData.get("telefono") || "").trim() || null;

  const supabase = await createClient();
  await supabase.from("talento").insert({ proyecto_id: proyectoId, nombre, personaje, telefono });
  revalidatePath(ruta(proyectoId));
}

export async function eliminarTalento(proyectoId: string, talentoId: string) {
  const supabase = await createClient();
  await supabase.from("talento").delete().eq("id", talentoId);
  revalidatePath(ruta(proyectoId));
}

export async function actualizarLlamadoTalento(
  proyectoId: string,
  diaRodajeId: string,
  talentoId: string,
  campo: "llamado_desde" | "llamado_hasta" | "locacion_url",
  valor: string
) {
  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("dia_rodaje_talento_llamados")
    .select("id")
    .eq("dia_rodaje_id", diaRodajeId)
    .eq("talento_id", talentoId)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("dia_rodaje_talento_llamados")
      .update({ [campo]: valor || null })
      .eq("id", existente.id);
  } else {
    await supabase.from("dia_rodaje_talento_llamados").insert({
      dia_rodaje_id: diaRodajeId,
      talento_id: talentoId,
      [campo]: valor || null,
    });
  }
  revalidatePath(ruta(proyectoId));
}
