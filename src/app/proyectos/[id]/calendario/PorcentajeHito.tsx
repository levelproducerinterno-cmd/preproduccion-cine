"use client";

import { useState, useTransition } from "react";
import { actualizarPorcentajeHito } from "./actions";

function colorBarra(p: number) {
  if (p >= 100) return "bg-verde";
  if (p <= 0) return "bg-rojo";
  return "bg-amarillo";
}

function colorPastilla(p: number) {
  if (p >= 100) return "bg-verde/15 text-verde";
  if (p <= 0) return "bg-rojo/15 text-rojo";
  return "bg-amarillo/20 text-amarillo";
}

function etiqueta(p: number) {
  return p >= 100 ? "Hecho" : `${p}%`;
}

export default function PorcentajeHito({
  proyectoId,
  hitoId,
  porcentajeInicial,
  editable,
}: {
  proyectoId: string;
  hitoId: string;
  porcentajeInicial: number;
  editable: boolean;
}) {
  const [porcentaje, setPorcentaje] = useState(porcentajeInicial);
  const [, startTransition] = useTransition();

  function guardar(valor: number) {
    setPorcentaje(valor);
    startTransition(() => actualizarPorcentajeHito(proyectoId, hitoId, valor));
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200">
        <div className={`h-full ${colorBarra(porcentaje)}`} style={{ width: `${porcentaje}%` }} />
      </div>
      {editable && (
        <input
          type="number"
          min={0}
          max={100}
          step={5}
          value={porcentaje}
          onChange={(e) => setPorcentaje(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          onBlur={(e) => guardar(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
          className="w-14 rounded border border-neutral-300 px-1.5 py-1 text-xs"
        />
      )}
      <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${colorPastilla(porcentaje)}`}>
        {etiqueta(porcentaje)}
      </span>
    </div>
  );
}
