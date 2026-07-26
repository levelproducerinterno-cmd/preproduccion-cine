"use server";

import { createClient } from "@/lib/supabase/server";

// Se llama justo después de un login o signup exitoso (con sesión ya activa).
// Vincula la cuenta de auth con su fila en "personas": si el AD ya la había
// pre-registrado por correo (auth_user_id null), la reclama; si no existe, la crea.
export async function ensurePersonaLinked(nombreSiNueva: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return;

  const { data: propia } = await supabase
    .from("personas")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (propia) return;

  const { data: placeholder } = await supabase
    .from("personas")
    .select("id")
    .ilike("email", user.email)
    .is("auth_user_id", null)
    .maybeSingle();

  if (placeholder) {
    await supabase.from("personas").update({ auth_user_id: user.id }).eq("id", placeholder.id);
  } else {
    await supabase.from("personas").insert({
      auth_user_id: user.id,
      email: user.email,
      nombre: nombreSiNueva || user.email,
    });
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
