"use client";

import { useState, useTransition } from "react";
import { reordenarDiasPorFecha } from "./actions";

export default function ReordenarDiasBoton({ proyectoId }: { proyectoId: string }) {
  const [pendiente, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);

  function onClick() {
    setMensaje(null);
    startTransition(async () => {
      const { error } = await reordenarDiasPorFecha(proyectoId);
      setMensaje(error ? `No se pudo reordenar: ${error}` : "Listo, los días se renumeraron según su fecha.");
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={onClick}
        disabled={pendiente}
        className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:border-rojo hover:text-rojo disabled:opacity-50"
      >
        {pendiente ? "Reordenando..." : "Renumerar días según su fecha"}
      </button>
      {mensaje && <p className="text-[0.65rem] text-neutral-500">{mensaje}</p>}
    </div>
  );
}
