"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarBloque, eliminarBloque, moverBloque } from "./actions";
import type { GuionBloque, TipoBloque } from "@/lib/types";

const TIPOS: { value: TipoBloque; label: string }[] = [
  { value: "encabezado_escena", label: "Encabezado de escena" },
  { value: "accion", label: "Acción" },
  { value: "personaje", label: "Personaje" },
  { value: "dialogo", label: "Diálogo" },
  { value: "parentesis", label: "Paréntesis" },
  { value: "transicion", label: "Transición" },
];

const ESTILO: Record<TipoBloque, string> = {
  encabezado_escena: "font-bold uppercase",
  accion: "",
  personaje: "text-center uppercase font-semibold ml-32",
  dialogo: "ml-16 mr-16",
  parentesis: "ml-24 italic text-neutral-500",
  transicion: "text-right uppercase font-semibold",
};

type Bloque = GuionBloque & { _nuevo?: boolean };

export default function GuionEditor({
  proyectoId,
  guionId,
  bloquesIniciales,
  puedeEditar,
}: {
  proyectoId: string;
  guionId: string;
  bloquesIniciales: Bloque[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const [bloques, setBloques] = useState<Bloque[]>(bloquesIniciales);
  const [, startTransition] = useTransition();

  function proximoOrden() {
    return bloques.length === 0 ? 0 : Math.max(...bloques.map((b) => b.orden)) + 1;
  }

  function agregarBloque(tipo: TipoBloque) {
    const nuevo: Bloque = {
      id: `temp-${Date.now()}`,
      guion_id: guionId,
      escena_id: null,
      orden: proximoOrden(),
      tipo,
      contenido: "",
      _nuevo: true,
    };
    setBloques((prev) => [...prev, nuevo]);
  }

  function actualizarLocal(id: string, cambios: Partial<Bloque>) {
    setBloques((prev) => prev.map((b) => (b.id === id ? { ...b, ...cambios } : b)));
  }

  function guardar(id: string) {
    const b = bloques.find((x) => x.id === id);
    if (!b) return;
    startTransition(async () => {
      const res = await guardarBloque(proyectoId, guionId, {
        blockId: b._nuevo ? null : b.id,
        tipo: b.tipo,
        contenido: b.contenido,
        orden: b.orden,
        escenaId: b.escena_id,
      });
      setBloques((prev) =>
        prev.map((x) => (x.id === id ? { ...x, id: res.blockId, escena_id: res.escenaId, _nuevo: false } : x))
      );
      router.refresh();
    });
  }

  function eliminar(id: string) {
    const b = bloques.find((x) => x.id === id);
    if (!b) return;
    if (b.tipo === "encabezado_escena" && !confirm("Esto también borra la escena y su desglose. ¿Continuar?")) {
      return;
    }
    setBloques((prev) => prev.filter((x) => x.id !== id));
    if (!b._nuevo) {
      startTransition(async () => {
        await eliminarBloque(proyectoId, guionId, b.id);
        router.refresh();
      });
    }
  }

  function mover(id: string, dir: -1 | 1) {
    const idx = bloques.findIndex((b) => b.id === id);
    const vecinoIdx = idx + dir;
    if (idx < 0 || vecinoIdx < 0 || vecinoIdx >= bloques.length) return;
    const copia = [...bloques];
    [copia[idx], copia[vecinoIdx]] = [copia[vecinoIdx], copia[idx]];
    setBloques(copia);
    const a = bloques[idx];
    const b = bloques[vecinoIdx];
    if (!a._nuevo && !b._nuevo) {
      startTransition(async () => {
        await moverBloque(proyectoId, guionId, a.id, b.id);
        router.refresh();
      });
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="font-screenplay mx-auto max-w-2xl">
        {bloques.map((b) => (
          <div key={b.id} className="group mb-2 flex items-start gap-2">
            {puedeEditar && (
              <div className="mt-1 flex shrink-0 flex-col gap-0.5 opacity-0 group-hover:opacity-100">
                <button onClick={() => mover(b.id, -1)} className="text-xs text-neutral-400 hover:text-negro">
                  ▲
                </button>
                <button onClick={() => mover(b.id, 1)} className="text-xs text-neutral-400 hover:text-negro">
                  ▼
                </button>
              </div>
            )}
            <div className="flex-1">
              {puedeEditar && (
                <select
                  value={b.tipo}
                  onChange={(e) => actualizarLocal(b.id, { tipo: e.target.value as TipoBloque })}
                  onBlur={() => guardar(b.id)}
                  className="mb-1 rounded border border-neutral-200 bg-neutral-50 px-1 py-0.5 text-[0.65rem] text-neutral-400"
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
              {puedeEditar ? (
                <textarea
                  value={b.contenido}
                  onChange={(e) => actualizarLocal(b.id, { contenido: e.target.value })}
                  onBlur={() => guardar(b.id)}
                  rows={b.tipo === "accion" || b.tipo === "dialogo" ? 2 : 1}
                  className={`w-full resize-none rounded border border-transparent bg-transparent p-1 focus:border-rojo focus:outline-none ${ESTILO[b.tipo]}`}
                />
              ) : (
                <p className={`whitespace-pre-wrap p-1 ${ESTILO[b.tipo]}`}>{b.contenido}</p>
              )}
            </div>
            {puedeEditar && (
              <button
                onClick={() => eliminar(b.id)}
                className="mt-1 text-xs text-neutral-300 opacity-0 hover:text-rojo group-hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {puedeEditar && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              onClick={() => agregarBloque(t.value)}
              className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:border-rojo hover:text-rojo"
            >
              + {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
