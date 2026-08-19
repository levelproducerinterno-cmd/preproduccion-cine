"use client";

import { actualizarCrew } from "./actions";
import type { Departamento } from "@/lib/types";

export default function EditarCrewForm({
  proyectoId,
  crewId,
  puestoActual,
  departamentos,
  departamentoIdsActuales,
}: {
  proyectoId: string;
  crewId: string;
  puestoActual: string | null;
  departamentos: Departamento[];
  departamentoIdsActuales: string[];
}) {
  return (
    <details className="mt-2 w-full">
      <summary className="cursor-pointer text-xs font-semibold text-neutral-400 hover:text-negro">
        Editar puesto / departamento
      </summary>
      <form
        action={actualizarCrew.bind(null, proyectoId, crewId)}
        className="mt-2 grid gap-2 rounded border border-neutral-100 bg-neutral-50 p-3"
      >
        <input
          name="puesto_especifico"
          defaultValue={puestoActual ?? ""}
          placeholder="Puesto específico"
          className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
        />
        <div className="flex flex-wrap gap-3">
          {departamentos.map((d) => (
            <label key={d.id} className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                name="departamentos"
                value={d.id}
                defaultChecked={departamentoIdsActuales.includes(d.id)}
              />
              {d.nombre}
            </label>
          ))}
        </div>
        <button className="justify-self-start rounded bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-hueso hover:brightness-110">
          Guardar
        </button>
      </form>
    </details>
  );
}
