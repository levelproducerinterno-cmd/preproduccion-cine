"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { IntExt, Momento } from "@/lib/types";

// Acepta tanto "INT. LOCACIÓN - DÍA" (guion) como "EXT. LOCACIÓN. DÍA" (puntos)
const ENCABEZADO_RE = /^(INT\/EXT|INT|EXT)\.?\s*(.+?)\s*[-.]\s*(D[IÍ]A|NOCHE|AMANECER|ATARDECER)\.?\s*$/i;

function parseEncabezado(linea: string): { int_ext: IntExt | null; locacion: string | null; momento: Momento | null } {
  const m = linea.trim().match(ENCABEZADO_RE);
  if (!m) return { int_ext: null, locacion: linea.trim() || null, momento: null };
  const int_ext = m[1].toUpperCase() as IntExt;
  const locacion = m[2].trim();
  let momento = m[3].toUpperCase();
  if (momento === "DIA") momento = "DÍA";
  return { int_ext, locacion, momento: momento as Momento };
}

function extraerEncabezados(texto: string) {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => ENCABEZADO_RE.test(l));
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

// Guarda el texto completo del guion y (re)genera las Escenas a partir de los
// encabezados de escena detectados (INT/EXT. LOCACIÓN - DÍA/NOCHE), en orden.
// Si un encabezado deja de existir, su escena (y su desglose) se elimina.
export async function guardarGuionCompleto(proyectoId: string, guionId: string, contenido: string) {
  const supabase = await createClient();

  await supabase.from("guiones").update({ contenido }).eq("id", guionId);

  const encabezados = extraerEncabezados(contenido);

  const { data: existentes } = await supabase
    .from("escenas")
    .select("id, orden")
    .eq("guion_id", guionId)
    .order("orden");

  const existentesArr = existentes ?? [];
  const total = Math.max(encabezados.length, existentesArr.length);

  for (let i = 0; i < total; i++) {
    if (i < encabezados.length) {
      const { int_ext, locacion, momento } = parseEncabezado(encabezados[i]);
      if (i < existentesArr.length) {
        await supabase
          .from("escenas")
          .update({ numero: String(i + 1), int_ext, locacion, momento, orden: i })
          .eq("id", existentesArr[i].id);
      } else {
        await supabase.from("escenas").insert({
          proyecto_id: proyectoId,
          guion_id: guionId,
          numero: String(i + 1),
          int_ext,
          locacion,
          momento,
          orden: i,
        });
      }
    } else {
      await supabase.from("escenas").delete().eq("id", existentesArr[i].id);
    }
  }

  revalidatePath(`/proyectos/${proyectoId}/guion`);
  revalidatePath(`/proyectos/${proyectoId}/escenas`);
}
