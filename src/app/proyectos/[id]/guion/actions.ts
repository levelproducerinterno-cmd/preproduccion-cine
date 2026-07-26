"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { IntExt, Momento, TipoBloque } from "@/lib/types";

function parseEncabezado(contenido: string): { int_ext: IntExt | null; locacion: string | null; momento: Momento | null } {
  const m = contenido
    .trim()
    .match(/^(INT\/EXT|INT|EXT)\.?\s*(.+?)\s*-\s*(D[IÍ]A|NOCHE|AMANECER|ATARDECER)\s*$/i);
  if (!m) return { int_ext: null, locacion: contenido.trim() || null, momento: null };
  const int_ext = m[1].toUpperCase().replace("INT/EXT", "INT/EXT") as IntExt;
  const locacion = m[2].trim();
  let momento = m[3].toUpperCase();
  if (momento === "DIA") momento = "DÍA";
  return { int_ext, locacion, momento: momento as Momento };
}

async function renumerarEscenas(supabase: Awaited<ReturnType<typeof createClient>>, guionId: string) {
  const { data: bloques } = await supabase
    .from("guion_bloques")
    .select("id, escena_id, orden")
    .eq("guion_id", guionId)
    .eq("tipo", "encabezado_escena")
    .order("orden");

  for (let i = 0; i < (bloques?.length ?? 0); i++) {
    const b = bloques![i];
    if (b.escena_id) {
      await supabase.from("escenas").update({ numero: String(i + 1), orden: i }).eq("id", b.escena_id);
    }
  }
}

export async function crearGuion(proyectoId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guiones")
    .insert({ proyecto_id: proyectoId, titulo: "Guion", version: 1 })
    .select("id")
    .single();
  revalidatePath(`/proyectos/${proyectoId}/guion`);
  return data?.id ?? null;
}

export async function guardarBloque(
  proyectoId: string,
  guionId: string,
  payload: { blockId: string | null; tipo: TipoBloque; contenido: string; orden: number; escenaId: string | null }
): Promise<{ blockId: string; escenaId: string | null }> {
  const supabase = await createClient();
  let escenaId = payload.escenaId;

  if (payload.tipo === "encabezado_escena") {
    const { int_ext, locacion, momento } = parseEncabezado(payload.contenido);
    if (escenaId) {
      await supabase.from("escenas").update({ int_ext, locacion, momento }).eq("id", escenaId);
    } else {
      const { data: nueva } = await supabase
        .from("escenas")
        .insert({
          proyecto_id: proyectoId,
          guion_id: guionId,
          numero: "0",
          int_ext,
          locacion,
          momento,
          orden: payload.orden,
        })
        .select("id")
        .single();
      escenaId = nueva?.id ?? null;
    }
  }

  let blockId = payload.blockId;
  if (blockId) {
    await supabase
      .from("guion_bloques")
      .update({ tipo: payload.tipo, contenido: payload.contenido, orden: payload.orden, escena_id: escenaId })
      .eq("id", blockId);
  } else {
    const { data: nuevo } = await supabase
      .from("guion_bloques")
      .insert({
        guion_id: guionId,
        tipo: payload.tipo,
        contenido: payload.contenido,
        orden: payload.orden,
        escena_id: escenaId,
      })
      .select("id")
      .single();
    blockId = nuevo!.id;
  }

  if (payload.tipo === "encabezado_escena") {
    await renumerarEscenas(supabase, guionId);
  }

  revalidatePath(`/proyectos/${proyectoId}/guion`);
  return { blockId: blockId!, escenaId };
}

export async function eliminarBloque(proyectoId: string, guionId: string, blockId: string) {
  const supabase = await createClient();
  await supabase.from("guion_bloques").delete().eq("id", blockId);
  await renumerarEscenas(supabase, guionId);
  revalidatePath(`/proyectos/${proyectoId}/guion`);
}

export async function moverBloque(
  proyectoId: string,
  guionId: string,
  blockId: string,
  vecinoId: string
) {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("guion_bloques")
    .select("id, orden")
    .in("id", [blockId, vecinoId]);
  if (!rows || rows.length !== 2) return;
  const [a, b] = rows;
  await supabase.from("guion_bloques").update({ orden: b.orden }).eq("id", a.id);
  await supabase.from("guion_bloques").update({ orden: a.orden }).eq("id", b.id);
  await renumerarEscenas(supabase, guionId);
  revalidatePath(`/proyectos/${proyectoId}/guion`);
}
