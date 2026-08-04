"use client";

import { useTransition } from "react";
import type { ArteDeEscena } from "@/lib/types";
import { excluirArteDeToma, incluirArteEnToma, actualizarCampoToma } from "./actions";
import CeldaEditable from "./CeldaEditable";

export default function ArteDeToma({
  proyectoId,
  tomaId,
  itemsDeEscena,
  excluidos,
  notasArte,
  puedeEditar,
}: {
  proyectoId: string;
  tomaId: string;
  itemsDeEscena: ArteDeEscena[];
  excluidos: string[];
  notasArte: string | null;
  puedeEditar: boolean;
}) {
  const [, startTransition] = useTransition();
  const excluidosSet = new Set(excluidos);
  const incluidos = itemsDeEscena.filter((it) => !excluidosSet.has(it.id));
  const excluidosItems = itemsDeEscena.filter((it) => excluidosSet.has(it.id));

  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap gap-1">
        {incluidos.map((it) => (
          <span
            key={it.id}
            className="inline-flex items-center gap-1 rounded bg-neutral-200 px-1.5 py-0.5 text-[0.65rem] text-neutral-700"
          >
            {it.descripcion}
            {puedeEditar && (
              <button
                onClick={() => startTransition(() => excluirArteDeToma(proyectoId, tomaId, it.id))}
                className="text-neutral-400 hover:text-rojo"
                title="No aparece en esta toma"
              >
                ×
              </button>
            )}
          </span>
        ))}
        {incluidos.length === 0 && itemsDeEscena.length === 0 && (
          <span className="text-[0.65rem] text-neutral-300">Sin desglose de arte en esta escena</span>
        )}
      </div>
      {puedeEditar && excluidosItems.length > 0 && (
        <details className="text-[0.6rem] text-neutral-400">
          <summary className="cursor-pointer">+ {excluidosItems.length} quitados de esta toma</summary>
          <div className="mt-1 flex flex-wrap gap-1">
            {excluidosItems.map((it) => (
              <button
                key={it.id}
                onClick={() => startTransition(() => incluirArteEnToma(proyectoId, tomaId, it.id))}
                className="rounded border border-dashed border-neutral-300 px-1.5 py-0.5 text-neutral-500 hover:border-rojo hover:text-rojo"
              >
                + {it.descripcion}
              </button>
            ))}
          </div>
        </details>
      )}
      {puedeEditar ? (
        <CeldaEditable
          valorInicial={notasArte ?? ""}
          placeholder="+ nota"
          onGuardar={(v) => startTransition(() => actualizarCampoToma(proyectoId, tomaId, "notas_arte", v))}
        />
      ) : (
        notasArte && <span className="text-[0.65rem] text-neutral-400">{notasArte}</span>
      )}
    </div>
  );
}
