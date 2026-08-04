"use client";

import { useState, useTransition } from "react";
import { actualizarPorcentajeHito } from "./actions";
import { PASOS_PORCENTAJE, colorBarra, colorPastilla, etiquetaPorcentaje } from "./colores";

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
  const indiceInicial = Math.max(0, PASOS_PORCENTAJE.indexOf(porcentajeInicial as (typeof PASOS_PORCENTAJE)[number]));
  const [indice, setIndice] = useState(indiceInicial === -1 ? 0 : indiceInicial);
  const [, startTransition] = useTransition();
  const porcentaje = PASOS_PORCENTAJE[indice];

  function guardar(nuevoIndice: number) {
    setIndice(nuevoIndice);
    startTransition(() => actualizarPorcentajeHito(proyectoId, hitoId, PASOS_PORCENTAJE[nuevoIndice]));
  }

  return (
    <div className="flex items-center gap-2">
      {editable ? (
        <input
          type="range"
          min={0}
          max={PASOS_PORCENTAJE.length - 1}
          step={1}
          value={indice}
          onChange={(e) => guardar(Number(e.target.value))}
          className="w-24 accent-rojo"
        />
      ) : (
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-200">
          <div className={`h-full ${colorBarra(porcentaje)}`} style={{ width: `${porcentaje}%` }} />
        </div>
      )}
      <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${colorPastilla(porcentaje)}`}>
        {etiquetaPorcentaje(porcentaje)}
      </span>
    </div>
  );
}
