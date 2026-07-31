"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { guardarPresentacionPdf, quitarPresentacionPdf } from "@/app/proyectos/[id]/presentaciones/actions";

export default function SubirPresentacionPdf({
  proyectoId,
  departamentoId,
  archivoUrl,
  nombreArchivo,
  puedeEditar,
}: {
  proyectoId: string;
  departamentoId: string;
  archivoUrl: string | null;
  nombreArchivo: string | null;
  puedeEditar: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [pendiente, startTransition] = useTransition();

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    const supabase = createClient();
    const path = `${proyectoId}/pdf-${departamentoId}/${Date.now()}-${archivo.name}`;
    const { error } = await supabase.storage.from("presentaciones").upload(path, archivo);
    if (!error) {
      const { data } = supabase.storage.from("presentaciones").getPublicUrl(path);
      startTransition(() => {
        guardarPresentacionPdf(proyectoId, departamentoId, data.publicUrl, archivo.name);
      });
    }
    setSubiendo(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <input ref={inputRef} type="file" accept="application/pdf" onChange={onFileChange} className="hidden" />
      {archivoUrl ? (
        <>
          <a
            href={archivoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-neutral-100 px-3 py-1.5 font-semibold text-negro hover:bg-neutral-200"
          >
            📄 {nombreArchivo || "Ver PDF"}
          </a>
          {puedeEditar && (
            <>
              <button
                onClick={() => inputRef.current?.click()}
                disabled={subiendo}
                className="text-neutral-400 hover:text-negro"
              >
                Reemplazar
              </button>
              <button
                onClick={() => startTransition(() => quitarPresentacionPdf(proyectoId, departamentoId))}
                disabled={pendiente}
                className="text-neutral-400 hover:text-rojo"
              >
                Quitar
              </button>
            </>
          )}
        </>
      ) : puedeEditar ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="rounded border border-dashed border-neutral-300 px-3 py-1.5 font-semibold text-neutral-500 hover:border-rojo hover:text-rojo"
        >
          {subiendo ? "Subiendo..." : "+ Subir presentación en PDF"}
        </button>
      ) : (
        <span className="text-neutral-400">Sin presentación subida</span>
      )}
    </div>
  );
}
