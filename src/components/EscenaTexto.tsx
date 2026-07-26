"use client";

import { useState } from "react";

export default function EscenaTexto({ texto }: { texto: string }) {
  const [mostrar, setMostrar] = useState(false);
  if (!texto) return null;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setMostrar((v) => !v)}
        className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-rojo"
      >
        <span>{mostrar ? "🙈" : "👁"}</span>
        {mostrar ? "Ocultar texto del guion" : "Ver texto del guion de esta escena"}
      </button>
      {mostrar && (
        <pre className="font-screenplay mt-2 whitespace-pre-wrap rounded border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-700">
          {texto}
        </pre>
      )}
    </div>
  );
}
