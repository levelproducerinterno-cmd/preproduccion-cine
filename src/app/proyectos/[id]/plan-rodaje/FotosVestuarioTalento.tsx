"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { agregarFotoVestuarioTalento, eliminarFotoVestuarioTalento } from "./actions";
import type { DiaRodajeTalentoFoto } from "@/lib/types";

export default function FotosVestuarioTalento({
  proyectoId,
  diaRodajeId,
  talentoId,
  fotos,
  puedeEditar,
}: {
  proyectoId: string;
  diaRodajeId: string;
  talentoId: string;
  fotos: DiaRodajeTalentoFoto[];
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
    const path = `vestuario/${diaRodajeId}/${talentoId}/${Date.now()}-${archivo.name}`;
    const { error } = await supabase.storage.from("casting").upload(path, archivo);
    if (!error) {
      const { data } = supabase.storage.from("casting").getPublicUrl(path);
      startTransition(() => agregarFotoVestuarioTalento(proyectoId, diaRodajeId, talentoId, data.publicUrl));
    }
    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {fotos.map((f) => (
          <div key={f.id} className="group relative h-16 w-16 overflow-hidden rounded bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt="" className="h-full w-full object-cover" />
            {puedeEditar && (
              <button
                onClick={() => startTransition(() => eliminarFotoVestuarioTalento(proyectoId, f.id))}
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
            className="w-fit rounded border border-dashed border-neutral-300 px-2 py-1 text-[0.65rem] font-semibold text-neutral-500 hover:border-rojo hover:text-rojo"
          >
            {subiendo ? "Subiendo..." : "+ Foto de vestuario"}
          </button>
        </>
      )}
    </div>
  );
}
