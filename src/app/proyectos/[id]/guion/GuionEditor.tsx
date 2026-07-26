"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarGuionCompleto } from "./actions";

export default function GuionEditor({
  proyectoId,
  guionId,
  contenidoInicial,
  puedeEditar,
  numEscenas,
}: {
  proyectoId: string;
  guionId: string;
  contenidoInicial: string;
  puedeEditar: boolean;
  numEscenas: number;
}) {
  const router = useRouter();
  const [contenido, setContenido] = useState(contenidoInicial);
  const [guardando, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(true);

  function guardar() {
    startTransition(async () => {
      await guardarGuionCompleto(proyectoId, guionId, contenido);
      setGuardado(true);
      router.refresh();
    });
  }

  if (!puedeEditar) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <pre className="font-screenplay whitespace-pre-wrap text-sm">{contenidoInicial || "Aún no hay guion."}</pre>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="mb-3 text-sm text-neutral-500">
        Pega o escribe tu guion completo aquí. Al guardar, cualquier línea con formato{" "}
        <code className="rounded bg-neutral-100 px-1">INT. LOCACIÓN - DÍA</code> (o EXT. / INT/EXT., y
        NOCHE/AMANECER/ATARDECER) se detecta automáticamente como una escena nueva para el desglose.
      </p>
      <textarea
        value={contenido}
        onChange={(e) => {
          setContenido(e.target.value);
          setGuardado(false);
        }}
        rows={28}
        placeholder={"INT. COCINA - DÍA\n\nJuan entra a la cocina...\n\nEXT. CALLE - NOCHE\n\n..."}
        className="font-screenplay w-full resize-y rounded border border-neutral-300 p-4 text-sm leading-relaxed focus:border-rojo focus:outline-none"
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-neutral-400">
          {numEscenas} escena{numEscenas === 1 ? "" : "s"} detectada{numEscenas === 1 ? "" : "s"} actualmente
        </span>
        <button
          onClick={guardar}
          disabled={guardando || guardado}
          className="rounded bg-rojo px-6 py-2.5 font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar guion"}
        </button>
      </div>
    </div>
  );
}
