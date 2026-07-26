import { createClient } from "@/lib/supabase/server";
import UnirseClient from "./UnirseClient";

export default async function UnirsePage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let departamentos: { id: string; nombre: string }[] = [];
  if (user) {
    const { data } = await supabase.from("departamentos").select("id, nombre").order("orden");
    departamentos = data ?? [];
  }

  return <UnirseClient token={token} autenticado={!!user} departamentos={departamentos} />;
}
