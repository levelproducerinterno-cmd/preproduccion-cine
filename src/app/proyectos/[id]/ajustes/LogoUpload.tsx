"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { actualizarLogo } from "./actions";

export default function LogoUpload({ proyectoId, logoActual }: { proyectoId: string; logoActual: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    const supabase = createClient();
    const path = `${proyectoId}/${Date.now()}-${archivo.name}`;
    const { error } = await supabase.storage.from("marca").upload(path, archivo);
    if (!error) {
      const { data } = supabase.storage.from("marca").getPublicUrl(path);
      await actualizarLogo(proyectoId, data.publicUrl);
      router.refresh();
    }
    setSubiendo(false);
  }

  return (
    <div className="flex items-center gap-4">
      {logoActual && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoActual} alt="Logo de la productora" className="h-14 w-14 rounded border border-neutral-200 object-contain" />
      )}
      <div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="text-xs text-neutral-500" />
        {subiendo && <p className="text-xs text-neutral-400">Subiendo...</p>}
      </div>
    </div>
  );
}
