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

  const { data: elemento, error } = await supabase
    .from("desglose_elementos")
    .insert({
      proyecto_id: proyectoId,
      escena_id: escenaId,
      categoria_id: categoriaId,
      descripcion,
      notas,
      departamento_id: departamentoId,
      created_by: persona?.id ?? null,
    })
    .select("id")
    .single();

  const aplicaPresupuesto = formData.get("aplica_presupuesto") === "on";
  if (!error && elemento && aplicaPresupuesto && departamentoId) {
    const rubroId = String(formData.get("presupuesto_rubro_id") || "");
    const cantidad = Number(formData.get("presupuesto_cantidad") || 1);
    const tipoUnidad = String(formData.get("presupuesto_tipo_unidad") || "Unidad");
    const esPrestado = formData.get("presupuesto_es_prestado") === "on";
    const costoUnitario = esPrestado ? 0 : Number(formData.get("presupuesto_costo_unitario") || 0);
    const importancia = String(formData.get("presupuesto_importancia") || "Obligatorio");
    const prestadoDe = esPrestado ? String(formData.get("presupuesto_prestado_de") || "").trim() || null : null;

    if (rubroId) {
      await supabase.from("presupuesto_items").insert({
        proyecto_id: proyectoId,
        departamento_id: departamentoId,
        rubro_id: rubroId,
        objeto_especifico: descripcion,
        cantidad,
        tipo_unidad: tipoUnidad,
        costo_unitario: costoUnitario,
        importancia,
        es_prestado: esPrestado,
        prestado_de: prestadoDe,
        desglose_elemento_id: elemento.id,
        created_by: persona?.id ?? null,
      });
    }
  }

  revalidatePath(`/proyectos/${proyectoId}/escenas`);
  revalidatePath(`/proyectos/${proyectoId}/presupuesto`);
}

export async function agregarElementoGeneral(proyectoId: string, formData: FormData) {
  const categoriaId = String(formData.get("categoria_id") || "");
  const descripcion = String(formData.get("descripcion") || "").trim();
  const notas = String(formData.get("notas") || "").trim() || null;
  const departamentoId = String(formData.get("departamento_id") || "") || null;
  if (!categoriaId || !descripcion || !departamentoId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  const { data: elemento, error } = await supabase
    .from("desglose_elementos")
    .insert({
      proyecto_id: proyectoId,
      escena_id: null,
      categoria_id: categoriaId,
      descripcion,
      notas,
      departamento_id: departamentoId,
      created_by: persona?.id ?? null,
    })
    .select("id")
    .single();

  const aplicaPresupuesto = formData.get("aplica_presupuesto") === "on";
  if (!error && elemento && aplicaPresupuesto) {
    const rubroId = String(formData.get("presupuesto_rubro_id") || "");
    const cantidad = Number(formData.get("presupuesto_cantidad") || 1);
    const tipoUnidad = String(formData.get("presupuesto_tipo_unidad") || "Unidad");
    const esPrestado = formData.get("presupuesto_es_prestado") === "on";
    const costoUnitario = esPrestado ? 0 : Number(formData.get("presupuesto_costo_unitario") || 0);
    const importancia = String(formData.get("presupuesto_importancia") || "Obligatorio");
    const prestadoDe = esPrestado ? String(formData.get("presupuesto_prestado_de") || "").trim() || null : null;

    if (rubroId) {
      await supabase.from("presupuesto_items").insert({
        proyecto_id: proyectoId,
        departamento_id: departamentoId,
        rubro_id: rubroId,
        objeto_especifico: descripcion,
        cantidad,
        tipo_unidad: tipoUnidad,
        costo_unitario: costoUnitario,
        importancia,
        es_prestado: esPrestado,
        prestado_de: prestadoDe,
        desglose_elemento_id: elemento.id,
        created_by: persona?.id ?? null,
      });
    }
  }

  revalidatePath(`/proyectos/${proyectoId}/escenas`);
  revalidatePath(`/proyectos/${proyectoId}/presupuesto`);
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

export async function guardarAplicaPresupuesto(
  proyectoId: string,
  elementoId: string,
  departamentoId: string,
  formData: FormData
) {
  const rubroId = String(formData.get("rubro_id") || "");
  const cantidad = Number(formData.get("cantidad") || 1);
  const tipoUnidad = String(formData.get("tipo_unidad") || "Unidad");
  const esPrestado = formData.get("es_prestado") === "on";
  const costoUnitario = esPrestado ? 0 : Number(formData.get("costo_unitario") || 0);
  const importancia = String(formData.get("importancia") || "Obligatorio");
  const prestadoDe = esPrestado ? String(formData.get("prestado_de") || "").trim() || null : null;
  if (!rubroId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: persona } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  const { data: elemento } = await supabase
    .from("desglose_elementos")
    .select("descripcion")
    .eq("id", elementoId)
    .single();

  const { data: existente } = await supabase
    .from("presupuesto_items")
    .select("id")
    .eq("desglose_elemento_id", elementoId)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("presupuesto_items")
      .update({
        rubro_id: rubroId,
        cantidad,
        tipo_unidad: tipoUnidad,
        costo_unitario: costoUnitario,
        importancia,
        es_prestado: esPrestado,
        prestado_de: prestadoDe,
      })
      .eq("id", existente.id);
  } else {
    await supabase.from("presupuesto_items").insert({
      proyecto_id: proyectoId,
      departamento_id: departamentoId,
      rubro_id: rubroId,
      objeto_especifico: elemento?.descripcion ?? "Sin descripción",
      cantidad,
      tipo_unidad: tipoUnidad,
      costo_unitario: costoUnitario,
      importancia,
      es_prestado: esPrestado,
      prestado_de: prestadoDe,
      desglose_elemento_id: elementoId,
      created_by: persona?.id ?? null,
    });
  }

  revalidatePath(`/proyectos/${proyectoId}/escenas`);
  revalidatePath(`/proyectos/${proyectoId}/presupuesto`);
}

export async function quitarAplicaPresupuesto(proyectoId: string, elementoId: string) {
  const supabase = await createClient();
  await supabase.from("presupuesto_items").delete().eq("desglose_elemento_id", elementoId);
  revalidatePath(`/proyectos/${proyectoId}/escenas`);
  revalidatePath(`/proyectos/${proyectoId}/presupuesto`);
}

export async function agregarCategoriaCustom(proyectoId: string, formData: FormData) {
  const nombre = String(formData.get("nombre_categoria") || "").trim();
  if (!nombre) return;
  const supabase = await createClient();
  await supabase.from("desglose_categorias").insert({ proyecto_id: proyectoId, nombre, es_estandar: false });
  revalidatePath(`/proyectos/${proyectoId}/escenas`);
}
