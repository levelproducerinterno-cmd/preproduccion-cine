"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { agregarFotoTalento, eliminarFotoTalento } from "./actions";
import type { TalentoFoto } from "@/lib/types";

export default function FotosTalento({
  proyectoId,
  talentoId,
  fotos,
  puedeEditar,
}: {
  proyectoId: string;
  talentoId: string;
  fotos: TalentoFoto[];
  puedeEditar: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [, startTransition] = useTransition();

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    const supabase = createClient();
    const path = `${proyectoId}/${talentoId}/${Date.now()}-${archivo.name}`;
    const { error } = await supabase.storage.from("casting").upload(path, archivo);
    if (!error) {
      const { data } = supabase.storage.from("casting").getPublicUrl(path);
      startTransition(() => agregarFotoTalento(proyectoId, talentoId, data.publicUrl));
    }
    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid w-full max-w-[16rem] gap-1.5 sm:w-40">
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-2">
        {fotos.map((f) => (
          <div key={f.id} className="group relative aspect-square overflow-hidden rounded bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt="" className="h-full w-full object-cover" />
            {puedeEditar && (
              <button
                onClick={() => startTransition(() => eliminarFotoTalento(proyectoId, f.id))}
                className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-[0.6rem] text-hueso opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {puedeEditar && (
        <>
          <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            className="rounded border border-dashed border-neutral-300 px-2 py-1 text-[0.65rem] font-semibold text-neutral-500 hover:border-rojo hover:text-rojo"
          >
            {subiendo ? "Subiendo..." : "+ Foto"}
          </button>
        </>
      )}
    </div>
  );
}
