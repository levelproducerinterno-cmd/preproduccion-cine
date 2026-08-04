"use client";

import { useState } from "react";

export default function CopiarLinkCalendario({ icalToken }: { icalToken: string }) {
  const [copiado, setCopiado] = useState(false);
  const [abierto, setAbierto] = useState(false);

  function urlFeed() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/ical/${icalToken}`;
  }

  async function copiar() {
    await navigator.clipboard.writeText(urlFeed());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <button
        onClick={() => setAbierto((a) => !a)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-negro"
      >
        <span>📅 Sincroniza este calendario con tu Google Calendar (o Outlook / Apple)</span>
        <span className="text-xs text-neutral-400">{abierto ? "Ocultar" : "Ver cómo"}</span>
      </button>
      {abierto && (
        <div className="mt-3 grid gap-2 text-xs text-neutral-500">
          <p>
            Copia este link y agrégalo una sola vez en Google Calendar como &quot;Otros calendarios&quot; →
            &quot;Desde URL&quot;. Desde ese momento, todo lo que se agregue aquí con tu nombre o tu departamento
            aparecerá automáticamente en tu calendario personal — Google lo actualiza solo cada pocas horas, no
            necesitas volver a hacer nada.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded bg-neutral-100 px-2 py-1.5">{urlFeed()}</code>
            <button
              onClick={copiar}
              className="rounded bg-rojo px-3 py-1.5 font-semibold text-hueso hover:brightness-110"
            >
              {copiado ? "¡Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
