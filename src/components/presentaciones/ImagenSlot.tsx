"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImagenSlot({
  proyectoId,
  carpeta,
  value,
  onChange,
  className = "",
  placeholder = "+ Subir imagen",
}: {
  proyectoId: string;
  carpeta: string;
  value: string | null;
  onChange: (url: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    const supabase = createClient();
    const path = `${proyectoId}/${carpeta}/${Date.now()}-${archivo.name}`;
    const { error } = await supabase.storage.from("presentaciones").upload(path, archivo);
    if (!error) {
      const { data } = supabase.storage.from("presentaciones").getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={`group relative w-full overflow-hidden bg-neutral-800 ${className}`}
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-neutral-400">
          {placeholder}
        </span>
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-[0.65rem] font-bold uppercase tracking-wide text-transparent transition group-hover:bg-black/50 group-hover:text-hueso">
        {subiendo ? "Subiendo..." : "Cambiar imagen"}
      </span>
    </button>
  );
}
