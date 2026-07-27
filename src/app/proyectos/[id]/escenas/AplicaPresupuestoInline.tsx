"use client";

import { useState, useTransition } from "react";
import { guardarAplicaPresupuesto, quitarAplicaPresupuesto } from "./actions";
import type { PresupuestoItemDeElemento } from "@/lib/types";

export default function AplicaPresupuestoInline({
  proyectoId,
  elementoId,
  departamentoId,
  rubros,
  itemExistente,
}: {
  proyectoId: string;
  elementoId: string;
  departamentoId: string;
  rubros: { id: string; nombre: string }[];
  itemExistente: PresupuestoItemDeElemento | null;
}) {
  const [aplica, setAplica] = useState(!!itemExistente);
  const [pendiente, startTransition] = useTransition();

  function onToggle(checked: boolean) {
    setAplica(checked);
    if (!checked && itemExistente) {
      startTransition(() => {
        quitarAplicaPresupuesto(proyectoId, elementoId);
      });
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      guardarAplicaPresupuesto(proyectoId, elementoId, departamentoId, formData);
    });
  }

  return (
    <div className="mt-1 w-full">
      <label className="flex items-center gap-2 text-[0.7rem] font-semibold text-neutral-500">
        <input type="checkbox" checked={aplica} onChange={(e) => onToggle(e.target.checked)} />
        ¿Aplica para presupuesto?
      </label>
      {aplica && (
        <form
          onSubmit={onSubmit}
          className="mt-2 grid grid-cols-2 gap-2 rounded border border-neutral-100 bg-neutral-50 p-3 md:grid-cols-5"
        >
          <select
            name="rubro_id"
            required
            defaultValue={itemExistente?.rubro_id ?? ""}
            className="rounded border border-neutral-300 px-2 py-1.5 text-xs"
          >
            <option value="" disabled>
              Rubro
            </option>
            {rubros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="cantidad"
            step="0.01"
            defaultValue={itemExistente?.cantidad ?? 1}
            placeholder="Cantidad"
            className="rounded border border-neutral-300 px-2 py-1.5 text-xs"
          />
          <select
            name="tipo_unidad"
            defaultValue={itemExistente?.tipo_unidad ?? "Único"}
            className="rounded border border-neutral-300 px-2 py-1.5 text-xs"
          >
            <option>Único</option>
            <option>Día</option>
            <option>Unidad</option>
            <option>Viajes</option>
            <option>Personas</option>
            <option>Otro</option>
          </select>
          <input
            type="number"
            name="costo_unitario"
            step="0.01"
            defaultValue={itemExistente?.costo_unitario ?? 0}
            placeholder="Costo unitario"
            className="rounded border border-neutral-300 px-2 py-1.5 text-xs"
          />
          <select
            name="importancia"
            defaultValue={itemExistente?.importancia ?? "Obligatorio"}
            className="rounded border border-neutral-300 px-2 py-1.5 text-xs"
          >
            <option value="Obligatorio">Obligatorio</option>
            <option value="Bien si se toma">Bien si se toma</option>
          </select>
          <button
            disabled={pendiente}
            className="col-span-2 rounded bg-rojo px-3 py-1.5 text-xs font-semibold text-hueso hover:brightness-110 disabled:opacity-50 md:col-span-5"
          >
            {pendiente ? "Guardando..." : itemExistente ? "Actualizar presupuesto" : "Guardar en presupuesto"}
          </button>
        </form>
      )}
    </div>
  );
}
