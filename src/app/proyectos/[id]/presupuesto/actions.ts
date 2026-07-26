"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function agregarItemPresupuesto(proyectoId: string, formData: FormData) {
  const departamentoId = String(formData.get("departamento_id") || "");
  const rubroId = String(formData.get("rubro_id") || "");
  const objetoEspecifico = String(formData.get("objeto_especifico") || "").trim();
  const cantidad = Number(formData.get("cantidad") || 1);
  const tipoUnidad = String(formData.get("tipo_unidad") || "Unidad");
  const costoUnitario = Number(formData.get("costo_unitario") || 0);
  if (!departamentoId || !rubroId || !objetoEspecifico) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  await supabase.from("presupuesto_items").insert({
    proyecto_id: proyectoId,
    departamento_id: departamentoId,
    rubro_id: rubroId,
    objeto_especifico: objetoEspecifico,
    cantidad,
    tipo_unidad: tipoUnidad,
    costo_unitario: costoUnitario,
    created_by: persona?.id ?? null,
  });

  revalidatePath(`/proyectos/${proyectoId}/presupuesto`);
}

export async function eliminarItemPresupuesto(proyectoId: string, itemId: string) {
  const supabase = await createClient();
  await supabase.from("presupuesto_items").delete().eq("id", itemId);
  revalidatePath(`/proyectos/${proyectoId}/presupuesto`);
}

export async function agregarRubroCustom(proyectoId: string, formData: FormData) {
  const nombre = String(formData.get("nombre_rubro") || "").trim();
  if (!nombre) return;
  const supabase = await createClient();
  await supabase.from("presupuesto_rubros").insert({ proyecto_id: proyectoId, nombre, es_estandar: false });
  revalidatePath(`/proyectos/${proyectoId}/presupuesto`);
}
