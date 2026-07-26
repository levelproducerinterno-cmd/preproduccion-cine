"use client";

import { useState } from "react";
import { agregarElemento } from "./actions";
import type { DesgloseCategoria, Departamento } from "@/lib/types";

type Rubro = { id: string; nombre: string };

export default function DesgloseForm({
  proyectoId,
  escenaId,
  categorias,
  departamentos,
  rubros,
}: {
  proyectoId: string;
  escenaId: string;
  categorias: DesgloseCategoria[];
  departamentos: Departamento[];
  rubros: Rubro[];
}) {
  const [aplicaPresupuesto, setAplicaPresupuesto] = useState(false);

  return (
    <form
      action={agregarElemento.bind(null, proyectoId, escenaId)}
      className="mt-4 grid gap-2 border-t border-neutral-100 pt-4"
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <select name="categoria_id" required className="rounded border border-neutral-300 px-2 py-2 text-sm">
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <input
          name="descripcion"
          placeholder="Descripción"
          required
          className="col-span-2 rounded border border-neutral-300 px-2 py-2 text-sm md:col-span-1"
        />
        <input name="notas" placeholder="Notas" className="rounded border border-neutral-300 px-2 py-2 text-sm" />
        <select name="departamento_id" className="rounded border border-neutral-300 px-2 py-2 text-sm">
          <option value="">Depto. responsable</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
        <button className="rounded bg-rojo px-3 py-2 text-sm font-semibold text-hueso hover:brightness-110">
          + Agregar
        </button>
      </div>

      <label className="mt-1 flex items-center gap-2 text-xs font-semibold text-neutral-500">
        <input
          type="checkbox"
          name="aplica_presupuesto"
          checked={aplicaPresupuesto}
          onChange={(e) => setAplicaPresupuesto(e.target.checked)}
        />
        ¿Aplica para presupuesto?
      </label>

      {aplicaPresupuesto && (
        <div className="grid grid-cols-2 gap-2 rounded border border-neutral-100 bg-neutral-50 p-3 md:grid-cols-4">
          <select name="presupuesto_rubro_id" required className="rounded border border-neutral-300 px-2 py-2 text-sm">
            {rubros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
          <input
            type="number"
            name="presupuesto_cantidad"
            step="0.01"
            defaultValue={1}
            placeholder="Cantidad"
            className="rounded border border-neutral-300 px-2 py-2 text-sm"
          />
          <select name="presupuesto_tipo_unidad" className="rounded border border-neutral-300 px-2 py-2 text-sm">
            <option>Único</option>
            <option>Día</option>
            <option>Unidad</option>
            <option>Viajes</option>
            <option>Personas</option>
            <option>Otro</option>
          </select>
          <input
            type="number"
            name="presupuesto_costo_unitario"
            step="0.01"
            defaultValue={0}
            placeholder="Costo unitario"
            className="rounded border border-neutral-300 px-2 py-2 text-sm"
          />
          <select
            name="presupuesto_importancia"
            defaultValue="Obligatorio"
            className="col-span-2 rounded border border-neutral-300 px-2 py-2 text-sm md:col-span-1"
          >
            <option value="Obligatorio">Obligatorio</option>
            <option value="Bien si se toma">Bien si se toma</option>
          </select>
          <p className="col-span-2 text-[0.7rem] text-neutral-400 md:col-span-3">
            El departamento del gasto es el mismo que elegiste arriba como "Depto. responsable".
          </p>
        </div>
      )}
    </form>
  );
}
