"use client";

import { useState } from "react";

// Dominio fijo de producción: no cambia con cada despliegue (a diferencia de
// window.location.origin, que sí cambia si se está viendo una URL de vista previa).
// Este link se pega en Google Calendar/Outlook/Apple, así que tiene que ser estable.
const DOMINIO_PRODUCCION = "https://preproduccion-cine.vercel.app";

export default function CopiarLinkCalendario({ icalToken }: { icalToken: string }) {
  const [copiado, setCopiado] = useState(false);
  const [abierto, setAbierto] = useState(false);

  function urlFeed() {
    return `${DOMINIO_PRODUCCION}/api/ical/${icalToken}`;
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
        <div className="mt-3 grid gap-3 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded bg-neutral-100 px-2 py-1.5">{urlFeed()}</code>
            <button
              onClick={copiar}
              className="rounded bg-rojo px-3 py-1.5 font-semibold text-hueso hover:brightness-110"
            >
              {copiado ? "¡Copiado!" : "Copiar link"}
            </button>
          </div>

          <div>
            <p className="mb-1 font-bold text-neutral-600">En Google Calendar (tiene que ser desde computadora):</p>
            <p>
              La opción &quot;Agregar por URL&quot; no existe en la app de celular — solo en calendar.google.com
              desde un navegador. Ahí: ⚙️ Configuración → &quot;Añadir calendario&quot; (menú izquierdo) →
              &quot;Desde URL&quot; → pega el link → &quot;Añadir calendario&quot;. Una vez agregado ahí, ya se ve
              solo también en tu celular.
            </p>
          </div>
          <div>
            <p className="mb-1 font-bold text-neutral-600">En Outlook:</p>
            <p>Agregar calendario → Suscribirse desde la web → pega el link.</p>
          </div>
          <div>
            <p className="mb-1 font-bold text-neutral-600">En Apple Calendar (Mac/iPhone):</p>
            <p>Archivo → Nueva suscripción de calendario (o Ajustes → Calendario → Cuentas → Añadir cuenta → Otra → Calendario suscrito) → pega el link.</p>
          </div>
          <p>
            Después de agregarlo, todo lo que se cree aquí con tu nombre o tu departamento aparece solo — Google lo
            actualiza cada pocas horas, no necesitas volver a tocar nada.
          </p>
        </div>
      )}
    </div>
  );
}
