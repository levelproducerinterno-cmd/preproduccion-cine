"use client";

import { useState } from "react";
import { agregarElementoGeneral } from "./actions";
import type { DesgloseCategoria, Departamento } from "@/lib/types";

type Rubro = { id: string; nombre: string };

export default function DesgloseGeneralForm({
  proyectoId,
  categorias,
  departamentos,
  misDepartamentos,
  rubros,
  esAdOProduccion,
}: {
  proyectoId: string;
  categorias: DesgloseCategoria[];
  departamentos: Departamento[];
  misDepartamentos: Departamento[];
  rubros: Rubro[];
  esAdOProduccion: boolean;
}) {
  const [aplicaPresupuesto, setAplicaPresupuesto] = useState(false);
  const [esPrestado, setEsPrestado] = useState(false);

  if (!esAdOProduccion) {
    // Un departamento solo puede pedir lo que necesita, sin números: Producción
    // llena el presupuesto después desde la misma fila.
    return (
      <form action={agregarElementoGeneral.bind(null, proyectoId)} className="mt-4 grid gap-2 border-t border-neutral-100 pt-4">
        <p className="text-xs text-neutral-400">
          Pide aquí lo que tu departamento necesita para todo el rodaje (no ligado a una escena en particular,
          ej. equipo de cámara/luces). Producción le pone los números después.
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <select name="categoria_id" required className="rounded border border-neutral-300 px-2 py-2 text-sm">
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <input
            name="descripcion"
            placeholder="Qué necesitas (ej. Tripié, C-stand, difusor 4x4)"
            required
            className="col-span-2 rounded border border-neutral-300 px-2 py-2 text-sm md:col-span-2"
          />
          {misDepartamentos.length > 1 ? (
            <select name="departamento_id" required className="rounded border border-neutral-300 px-2 py-2 text-sm">
              {misDepartamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          ) : (
            <input type="hidden" name="departamento_id" value={misDepartamentos[0]?.id ?? ""} />
          )}
          <button className="rounded bg-rojo px-3 py-2 text-sm font-semibold text-hueso hover:brightness-110">
            + Pedir
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={agregarElementoGeneral.bind(null, proyectoId)} className="mt-4 grid gap-2 border-t border-neutral-100 pt-4">
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
        <select name="departamento_id" required className="rounded border border-neutral-300 px-2 py-2 text-sm">
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
            disabled={esPrestado}
            className="rounded border border-neutral-300 px-2 py-2 text-sm disabled:bg-neutral-100 disabled:text-neutral-400"
          />
          <select
            name="presupuesto_importancia"
            defaultValue="Obligatorio"
            className="col-span-2 rounded border border-neutral-300 px-2 py-2 text-sm md:col-span-1"
          >
            <option value="Obligatorio">Obligatorio</option>
            <option value="Bien si se toma">Bien si se toma</option>
          </select>

          <label className="col-span-2 flex items-center gap-2 text-[0.7rem] font-semibold text-neutral-500 md:col-span-4">
            <input
              type="checkbox"
              name="presupuesto_es_prestado"
              checked={esPrestado}
              onChange={(e) => setEsPrestado(e.target.checked)}
            />
            Prestado (no se compra, alguien lo presta)
          </label>
          {esPrestado && (
            <input
              name="presupuesto_prestado_de"
              placeholder="¿Quién lo presta?"
              className="col-span-2 rounded border border-neutral-300 px-2 py-2 text-sm md:col-span-4"
            />
          )}
        </div>
      )}
    </form>
  );
}
