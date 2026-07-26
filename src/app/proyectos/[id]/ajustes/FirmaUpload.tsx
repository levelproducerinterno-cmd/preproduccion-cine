"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { actualizarFirma } from "./actions";

export default function FirmaUpload({ proyectoId, firmaActual }: { proyectoId: string; firmaActual: string | null }) {
  const router = useRouter();
  const [subiendo, setSubiendo] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    const supabase = createClient();
    const path = `${proyectoId}/firma-${Date.now()}-${archivo.name}`;
    const { error } = await supabase.storage.from("marca").upload(path, archivo);
    if (!error) {
      const { data } = supabase.storage.from("marca").getPublicUrl(path);
      await actualizarFirma(proyectoId, data.publicUrl);
      router.refresh();
    }
    setSubiendo(false);
  }

  return (
    <div className="flex items-center gap-4">
      {firmaActual && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={firmaActual} alt="Firma del responsable" className="h-12 w-28 rounded border border-neutral-200 object-contain" />
      )}
      <div>
        <input type="file" accept="image/*" onChange={onFileChange} className="text-xs text-neutral-500" />
        {subiendo && <p className="text-xs text-neutral-400">Subiendo...</p>}
      </div>
    </div>
  );
}
