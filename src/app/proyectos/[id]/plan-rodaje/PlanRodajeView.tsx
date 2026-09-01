"use client";

import { useEffect, useState, useTransition } from "react";
import type {
  DiaRodaje,
  Escena,
  Toma,
  DiaRodajeLocacion,
  DiaRodajeCrewLlamado,
  Talento,
  DiaRodajeTalentoLlamado,
  ArteDeEscena,
} from "@/lib/types";
import {
  crearDiaRodaje,
  eliminarDiaRodaje,
  actualizarDiaRodaje,
  asignarEscenaADia,
  actualizarCampoToma,
  agregarBloque,
  actualizarBloque,
  eliminarBloque,
  reordenarRenglones,
  agregarLocacion,
  eliminarLocacion,
  actualizarLlamadoCrew,
  actualizarNoDisponibleCrew,
  agregarTalento,
  eliminarTalento,
  actualizarLlamadoTalento,
  actualizarNoSeOcupaTalento,
} from "./actions";
import CeldaEditable from "./CeldaEditable";
import ArteDeToma from "./ArteDeToma";
import PlanRodajePdfBoton from "./PlanRodajePdfBoton";
import HojaLlamadoPdfBoton from "./HojaLlamadoPdfBoton";
import { colorEscena, LEYENDA_COLORES } from "./colorEscena";

export type RenglonPlan =
  | { tipo: "bloque"; id: string; clave: number; hora: string | null; descripcion: string }
  | { tipo: "toma"; id: string; clave: number; toma: Toma; escena: Escena };

export type CrewParaLlamado = {
  id: string;
  puesto_especifico: string | null;
  personas: { nombre: string; telefono: string | null };
};

const th = "border border-neutral-700 bg-negro p-2 text-left text-[0.65rem] font-semibold uppercase text-hueso";
const td = "border border-neutral-200 p-1.5 align-top";

export default function PlanRodajeView({
  proyectoId,
  proyectoNombre,
  logoUrl,
  colorPrimario,
  esAdOProduccion,
  puedeEditarTomas,
  puedeEditarArte,
  dias,
  escenas,
  escenasSinAsignar,
  renglonesPorDia,
  arteItemsPorEscena,
  excluidosPorToma,
  locaciones,
  crew,
  crewLlamados,
  talento,
  talentoLlamados,
}: {
  proyectoId: string;
  proyectoNombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  esAdOProduccion: boolean;
  puedeEditarTomas: boolean;
  puedeEditarArte: boolean;
  dias: DiaRodaje[];
  escenas: Escena[];
  escenasSinAsignar: Escena[];
  renglonesPorDia: Record<string, RenglonPlan[]>;
  arteItemsPorEscena: Record<string, ArteDeEscena[]>;
  excluidosPorToma: Record<string, string[]>;
  locaciones: DiaRodajeLocacion[];
  crew: CrewParaLlamado[];
  crewLlamados: DiaRodajeCrewLlamado[];
  talento: Talento[];
  talentoLlamados: DiaRodajeTalentoLlamado[];
}) {
  const [vista, setVista] = useState<"plan" | "llamado">("plan");
  const [, startTransition] = useTransition();

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-neutral-200 p-1">
          <button
            onClick={() => setVista("plan")}
            className={`rounded px-4 py-1.5 text-sm font-semibold ${
              vista === "plan" ? "bg-white text-negro shadow-sm" : "text-neutral-500"
            }`}
          >
            Plan de Rodaje
          </button>
          <button
            onClick={() => setVista("llamado")}
            className={`rounded px-4 py-1.5 text-sm font-semibold ${
              vista === "llamado" ? "bg-white text-negro shadow-sm" : "text-neutral-500"
            }`}
          >
            Hojas de Llamado
          </button>
        </div>
        {vista === "plan" ? (
          <PlanRodajePdfBoton
            proyectoNombre={proyectoNombre}
            logoUrl={logoUrl}
            colorPrimario={colorPrimario}
            dias={dias}
            renglonesPorDia={renglonesPorDia}
          />
        ) : (
          <HojaLlamadoPdfBoton
            proyectoNombre={proyectoNombre}
            logoUrl={logoUrl}
            colorPrimario={colorPrimario}
            dias={dias}
            renglonesPorDia={renglonesPorDia}
            locaciones={locaciones}
            crew={crew}
            crewLlamados={crewLlamados}
            talento={talento}
            talentoLlamados={talentoLlamados}
          />
        )}
      </div>

      {esAdOProduccion && (
        <div className="grid gap-3 sm:grid-cols-2">
          <details className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-neutral-500">+ Nuevo día de rodaje</summary>
            <form action={crearDiaRodaje.bind(null, proyectoId)} className="mt-3 grid grid-cols-2 gap-2">
              <input
                type="number"
                name="numero"
                placeholder="Día #"
                required
                className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
              />
              <input type="date" name="fecha" className="rounded border border-neutral-300 px-2 py-1.5 text-sm" />
              <input
                name="jornada_horas"
                placeholder="Jornada (ej. 9 Horas y 30 min.)"
                className="col-span-2 rounded border border-neutral-300 px-2 py-1.5 text-sm"
              />
              <input
                name="llamado_general"
                placeholder="Llamado en locación (ej. 7:00 AM)"
                className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
              />
              <input
                name="ready_to_shoot"
                placeholder="Ready to shoot (ej. 9:00 AM)"
                className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
              />
              <button className="col-span-2 rounded bg-rojo py-2 text-sm font-semibold text-hueso hover:brightness-110">
                Crear día
              </button>
            </form>
          </details>

          <details className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-neutral-500">
              Asignar escenas a días ({escenasSinAsignar.length} sin asignar)
            </summary>
            <div className="mt-3 grid gap-1.5">
              {escenas.map((esc) => (
                <div key={esc.id} className="flex items-center gap-2 rounded bg-neutral-50 px-2 py-1.5 text-xs">
                  <span className="flex-1 truncate">
                    Escena {esc.numero} — {esc.locacion ?? "Sin locación"}
                  </span>
                  <input
                    type="number"
                    defaultValue={esc.dia_rodaje_numero ?? ""}
                    placeholder="Día"
                    className="w-16 rounded border border-neutral-300 px-1.5 py-1"
                    onBlur={(e) => {
                      const orden = (e.currentTarget.parentElement?.querySelector(
                        "[data-campo=orden]"
                      ) as HTMLInputElement)?.value;
                      startTransition(() => asignarEscenaADia(proyectoId, esc.id, e.currentTarget.value, orden ?? ""));
                    }}
                  />
                  <input
                    data-campo="orden"
                    type="number"
                    defaultValue={esc.orden_del_dia ?? ""}
                    placeholder="Orden"
                    className="w-16 rounded border border-neutral-300 px-1.5 py-1"
                    onBlur={(e) => {
                      const dia = (e.currentTarget.parentElement?.querySelector(
                        'input[placeholder="Día"]'
                      ) as HTMLInputElement)?.value;
                      startTransition(() => asignarEscenaADia(proyectoId, esc.id, dia ?? "", e.currentTarget.value));
                    }}
                  />
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {dias.length === 0 && (
        <p className="rounded-lg border border-neutral-200 bg-white p-10 text-center text-neutral-500 shadow-sm">
          Aún no hay días de rodaje creados.
        </p>
      )}

      {dias.map((dia) =>
        vista === "plan" ? (
          <DiaPlanRodaje
            key={dia.id}
            proyectoId={proyectoId}
            dia={dia}
            renglones={renglonesPorDia[dia.id] ?? []}
            esAdOProduccion={esAdOProduccion}
            puedeEditarTomas={puedeEditarTomas}
            puedeEditarArte={puedeEditarArte}
            arteItemsPorEscena={arteItemsPorEscena}
            excluidosPorToma={excluidosPorToma}
            crew={crew}
            crewLlamados={crewLlamados.filter((c) => c.dia_rodaje_id === dia.id)}
          />
        ) : (
          <DiaHojaLlamado
            key={dia.id}
            proyectoId={proyectoId}
            dia={dia}
            renglones={renglonesPorDia[dia.id] ?? []}
            locaciones={locaciones.filter((l) => l.dia_rodaje_id === dia.id)}
            crew={crew}
            crewLlamados={crewLlamados.filter((c) => c.dia_rodaje_id === dia.id)}
            talento={talento}
            talentoLlamados={talentoLlamados.filter((t) => t.dia_rodaje_id === dia.id)}
            esAdOProduccion={esAdOProduccion}
          />
        )
      )}

      {esAdOProduccion && (
        <details className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-500">
            Elenco / Talento del proyecto ({talento.length})
          </summary>
          <div className="mt-3 grid gap-1.5">
            {talento.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded bg-neutral-50 px-2 py-1.5 text-xs">
                <span>
                  <b>{t.personaje || "Sin personaje"}</b> — {t.nombre} {t.telefono ? `(${t.telefono})` : ""}
                </span>
                <form action={eliminarTalento.bind(null, proyectoId, t.id)}>
                  <button className="text-neutral-300 hover:text-rojo">✕</button>
                </form>
              </div>
            ))}
          </div>
          <form action={agregarTalento.bind(null, proyectoId)} className="mt-3 grid grid-cols-4 gap-2">
            <input name="personaje" placeholder="Personaje" className="rounded border border-neutral-300 px-2 py-1.5 text-sm" />
            <input name="nombre" placeholder="Nombre del actor/actriz" required className="rounded border border-neutral-300 px-2 py-1.5 text-sm" />
            <input name="telefono" placeholder="Teléfono" className="rounded border border-neutral-300 px-2 py-1.5 text-sm" />
            <button className="rounded bg-rojo py-1.5 text-sm font-semibold text-hueso hover:brightness-110">+ Agregar</button>
          </form>
        </details>
      )}
    </div>
  );
}

function DiaPlanRodaje({
  proyectoId,
  dia,
  renglones,
  esAdOProduccion,
  puedeEditarTomas,
  puedeEditarArte,
  arteItemsPorEscena,
  excluidosPorToma,
  crew,
  crewLlamados,
}: {
  proyectoId: string;
  dia: DiaRodaje;
  renglones: RenglonPlan[];
  esAdOProduccion: boolean;
  puedeEditarTomas: boolean;
  puedeEditarArte: boolean;
  arteItemsPorEscena: Record<string, ArteDeEscena[]>;
  excluidosPorToma: Record<string, string[]>;
  crew: CrewParaLlamado[];
  crewLlamados: DiaRodajeCrewLlamado[];
}) {
  const [, startTransition] = useTransition();
  const [filas, setFilas] = useState(renglones);
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const puedeReordenar = puedeEditarTomas;

  useEffect(() => setFilas(renglones), [renglones]);

  const editarDia = (campo: string) => (valor: string) =>
    startTransition(() => actualizarDiaRodaje(proyectoId, dia.id, campo, valor));
  const editarToma = (tomaId: string, campo: string) => (valor: string) =>
    startTransition(() => actualizarCampoToma(proyectoId, tomaId, campo, valor));
  const llamadoPorCrew = new Map(crewLlamados.map((c) => [c.proyecto_crew_id, c]));

  function onDrop(indiceDestino: number) {
    if (arrastrando === null || arrastrando === indiceDestino) return;
    const nuevas = [...filas];
    const [movida] = nuevas.splice(arrastrando, 1);
    nuevas.splice(indiceDestino, 0, movida);
    setFilas(nuevas);
    setArrastrando(null);
    startTransition(() => {
      reordenarRenglones(
        proyectoId,
        nuevas.map((r, i) => ({ tipo: r.tipo, id: r.id, orden: i }))
      );
    });
  }

  return (
    <details open className="rounded-lg border border-neutral-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer items-center justify-between gap-2 px-5 py-4 font-semibold text-negro">
        <span>Día {dia.numero}</span>
        {esAdOProduccion && (
          <form
            action={eliminarDiaRodaje.bind(null, proyectoId, dia.id)}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="text-xs font-normal text-neutral-300 hover:text-rojo">Eliminar día</button>
          </form>
        )}
      </summary>
      <div className="border-t border-neutral-100 p-5">
        {esAdOProduccion ? (
          <div className="mb-4 grid grid-cols-2 gap-3 rounded border border-neutral-100 bg-neutral-50 p-3 text-xs sm:grid-cols-4">
            <label className="grid gap-0.5">
              <span className="font-bold uppercase text-neutral-400">Fecha</span>
              <CeldaEditable valorInicial={dia.fecha ?? ""} onGuardar={editarDia("fecha")} className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs" />
            </label>
            <label className="grid gap-0.5">
              <span className="font-bold uppercase text-neutral-400">Jornada</span>
              <CeldaEditable valorInicial={dia.jornada_horas ?? ""} onGuardar={editarDia("jornada_horas")} className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs" />
            </label>
            <label className="grid gap-0.5">
              <span className="font-bold uppercase text-neutral-400">Llamado en locación</span>
              <CeldaEditable valorInicial={dia.llamado_general ?? ""} onGuardar={editarDia("llamado_general")} className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs" />
            </label>
            <label className="grid gap-0.5">
              <span className="font-bold uppercase text-neutral-400">Ready to shoot</span>
              <CeldaEditable valorInicial={dia.ready_to_shoot ?? ""} onGuardar={editarDia("ready_to_shoot")} className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs" />
            </label>
          </div>
        ) : (
          <p className="mb-4 text-xs text-neutral-400">
            {dia.fecha} — Llamado {dia.llamado_general} — Jornada {dia.jornada_horas}
          </p>
        )}

        {crew.length > 0 && (
          <details className="mb-4">
            <summary className="cursor-pointer text-xs font-semibold text-neutral-400">
              Crew de este día ({crew.length})
            </summary>
            <div className="mt-2 overflow-x-auto rounded border border-neutral-100">
              <table className="w-full min-w-[500px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className={th}>Puesto</th>
                    <th className={th}>Nombre</th>
                    <th className={th}>Llamado</th>
                  </tr>
                </thead>
                <tbody>
                  {crew.map((c) => {
                    const noDisponible = llamadoPorCrew.get(c.id)?.no_disponible;
                    return (
                      <tr key={c.id} className={noDisponible ? "bg-neutral-100 text-neutral-400 line-through" : ""}>
                        <td className={td}>{c.puesto_especifico || "-"}</td>
                        <td className={td}>{c.personas.nombre}</td>
                        <td className={td}>
                          {noDisponible ? "No disponible" : llamadoPorCrew.get(c.id)?.llamado || dia.llamado_general || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        {puedeReordenar && filas.length > 1 && (
          <p className="mb-1 text-[0.65rem] text-neutral-400">Arrastra ⠿ para cambiar el orden de rodaje.</p>
        )}
        <div className="mb-2 flex flex-wrap gap-3 text-[0.65rem] text-neutral-500">
          {LEYENDA_COLORES.map((l) => (
            <span key={l.etiqueta} className="flex items-center gap-1">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm border border-neutral-300 ${l.clase}`} />
              {l.etiqueta}
            </span>
          ))}
        </div>
        <div className="overflow-x-auto rounded border border-neutral-100">
          <table className="w-full min-w-[1150px] border-collapse text-xs">
            <thead>
              <tr>
                {puedeReordenar && <th className={th}></th>}
                <th className={th}>Escena</th>
                <th className={th}>Hora</th>
                <th className={th}>Tiempo</th>
                <th className={th}>Plano</th>
                <th className={th}>Día/Noche</th>
                <th className={th}>Set</th>
                <th className={th}>Descripción</th>
                <th className={th}>Talento</th>
                <th className={th}>Locación</th>
                <th className={th}>Arte</th>
                {esAdOProduccion && <th className={th}></th>}
              </tr>
            </thead>
            <tbody>
              {filas.map((r, indice) =>
                r.tipo === "bloque" ? (
                  <tr
                    key={r.id}
                    className={`bg-neutral-200 ${arrastrando === indice ? "opacity-40" : ""}`}
                    draggable={puedeReordenar}
                    onDragStart={() => setArrastrando(indice)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(indice)}
                  >
                    {puedeReordenar && <td className={`${td} cursor-grab text-center text-neutral-400`}>⠿</td>}
                    <td className={td}></td>
                    <td className={`${td} font-bold`}>
                      {esAdOProduccion ? (
                        <CeldaEditable
                          valorInicial={r.hora ?? ""}
                          onGuardar={(v) => startTransition(() => actualizarBloque(proyectoId, r.id, "hora", v))}
                        />
                      ) : (
                        r.hora
                      )}
                    </td>
                    <td className={`${td} text-center font-bold`} colSpan={8}>
                      {r.descripcion}
                    </td>
                    {esAdOProduccion && (
                      <td className={td}>
                        <form action={eliminarBloque.bind(null, proyectoId, r.id)}>
                          <button className="text-neutral-400 hover:text-rojo">✕</button>
                        </form>
                      </td>
                    )}
                  </tr>
                ) : (
                  <tr
                    key={r.id}
                    className={`${colorEscena(r.escena)} ${arrastrando === indice ? "opacity-40" : ""}`}
                    draggable={puedeReordenar}
                    onDragStart={() => setArrastrando(indice)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(indice)}
                  >
                    {puedeReordenar && <td className={`${td} cursor-grab text-center text-neutral-400`}>⠿</td>}
                    <td className={`${td} font-bold`}>{r.escena.numero}</td>
                    <td className={td}>
                      {puedeEditarTomas ? (
                        <CeldaEditable valorInicial={r.toma.hora_inicio ?? ""} onGuardar={editarToma(r.toma.id, "hora_inicio")} />
                      ) : (
                        r.toma.hora_inicio
                      )}
                    </td>
                    <td className={td}>
                      {puedeEditarTomas ? (
                        <CeldaEditable valorInicial={r.toma.tiempo_estimado ?? ""} onGuardar={editarToma(r.toma.id, "tiempo_estimado")} />
                      ) : (
                        r.toma.tiempo_estimado
                      )}
                    </td>
                    <td className={td}>{r.toma.shot_num || r.toma.setup_num || "-"}</td>
                    <td className={td}>{r.escena.momento ?? "-"}</td>
                    <td className={td}>
                      {puedeEditarTomas ? (
                        <CeldaEditable valorInicial={r.toma.set_especifico ?? ""} onGuardar={editarToma(r.toma.id, "set_especifico")} placeholder={r.escena.locacion ?? ""} />
                      ) : (
                        r.toma.set_especifico || r.escena.locacion
                      )}
                    </td>
                    <td className={`${td} max-w-[16rem]`}>{r.toma.descripcion ?? "-"}</td>
                    <td className={td}>
                      {puedeEditarTomas ? (
                        <CeldaEditable
                          valorInicial={r.toma.talento_en_toma ?? r.toma.subject ?? ""}
                          onGuardar={editarToma(r.toma.id, "talento_en_toma")}
                        />
                      ) : (
                        r.toma.talento_en_toma || r.toma.subject || "-"
                      )}
                    </td>
                    <td className={td}>{r.escena.locacion ?? "-"}</td>
                    <td className={`${td} min-w-[10rem]`}>
                      <ArteDeToma
                        proyectoId={proyectoId}
                        tomaId={r.toma.id}
                        itemsDeEscena={arteItemsPorEscena[r.escena.id] ?? []}
                        excluidos={excluidosPorToma[r.toma.id] ?? []}
                        notasArte={r.toma.notas_arte}
                        puedeEditar={puedeEditarArte}
                      />
                    </td>
                    {esAdOProduccion && <td className={td}></td>}
                  </tr>
                )
              )}
              {filas.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-4 text-center text-neutral-400">
                    Sin escenas ni bloques asignados a este día todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {esAdOProduccion && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-neutral-400">
              + Agregar bloque (llegada, desayuno, traslado, comida, desmontaje...)
            </summary>
            <form action={agregarBloque.bind(null, proyectoId, dia.id)} className="mt-2 flex flex-wrap gap-2">
              <input name="hora" placeholder="Hora" className="w-28 rounded border border-neutral-300 px-2 py-1.5 text-xs" />
              <input name="descripcion" placeholder="Descripción (ej. DESAYUNO)" required className="flex-1 rounded border border-neutral-300 px-2 py-1.5 text-xs" />
              <input type="hidden" name="orden" value={(filas[filas.length - 1]?.clave ?? 0) + 1} />
              <button className="rounded bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-hueso">+ Agregar</button>
            </form>
            <p className="mt-1 text-[0.65rem] text-neutral-400">
              El bloque se agrega al final del día — luego arrastra el ⠿ de su renglón en la tabla de arriba para moverlo a su lugar.
            </p>
          </details>
        )}
      </div>
    </details>
  );
}

function DiaHojaLlamado({
  proyectoId,
  dia,
  renglones,
  locaciones,
  crew,
  crewLlamados,
  talento,
  talentoLlamados,
  esAdOProduccion,
}: {
  proyectoId: string;
  dia: DiaRodaje;
  renglones: RenglonPlan[];
  locaciones: DiaRodajeLocacion[];
  crew: CrewParaLlamado[];
  crewLlamados: DiaRodajeCrewLlamado[];
  talento: Talento[];
  talentoLlamados: DiaRodajeTalentoLlamado[];
  esAdOProduccion: boolean;
}) {
  const [, startTransition] = useTransition();
  const llamadoPorCrew = new Map(crewLlamados.map((c) => [c.proyecto_crew_id, c]));
  const llamadoPorTalento = new Map(talentoLlamados.map((t) => [t.talento_id, t]));

  return (
    <details open className="rounded-lg border border-neutral-200 bg-white shadow-sm">
      <summary className="cursor-pointer px-5 py-4 font-semibold text-negro">
        Hoja de llamado — Día {dia.numero} {dia.fecha ? `(${dia.fecha})` : ""}
      </summary>
      <div className="grid gap-4 border-t border-neutral-100 p-5">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded bg-neutral-100 p-2">
            <span className="block font-bold uppercase text-neutral-400">Hora general</span>
            {dia.llamado_general || "-"}
          </div>
          <div className="rounded bg-neutral-100 p-2">
            <span className="block font-bold uppercase text-neutral-400">Jornada</span>
            {dia.jornada_horas || "-"}
          </div>
          <div className="rounded bg-neutral-100 p-2">
            <span className="block font-bold uppercase text-neutral-400">Ready to shoot</span>
            {dia.ready_to_shoot || "-"}
          </div>
        </div>

        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">Locaciones</h4>
          <div className="overflow-x-auto rounded border border-neutral-100">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {locaciones.map((l) => (
                  <tr key={l.id}>
                    <td className={`${td} w-48 font-semibold`}>{l.nombre}</td>
                    <td className={td}>
                      {l.url_maps ? (
                        <a href={l.url_maps} target="_blank" rel="noopener noreferrer" className="text-rojo hover:underline">
                          {l.url_maps}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    {esAdOProduccion && (
                      <td className={`${td} w-8`}>
                        <form action={eliminarLocacion.bind(null, proyectoId, l.id)}>
                          <button className="text-neutral-300 hover:text-rojo">✕</button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
                {locaciones.length === 0 && (
                  <tr>
                    <td className={td} colSpan={3}>
                      Sin locaciones agregadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {esAdOProduccion && (
            <form action={agregarLocacion.bind(null, proyectoId, dia.id)} className="mt-2 flex gap-2">
              <input name="nombre" placeholder="Nombre de la locación" required className="flex-1 rounded border border-neutral-300 px-2 py-1.5 text-xs" />
              <input name="url_maps" placeholder="Link de Google Maps" className="flex-1 rounded border border-neutral-300 px-2 py-1.5 text-xs" />
              <button className="rounded bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-hueso">+ Agregar</button>
            </form>
          )}
        </div>

        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">Crew</h4>
          <div className="overflow-x-auto rounded border border-neutral-100">
            <table className="w-full min-w-[600px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className={th}>Puesto</th>
                  <th className={th}>Nombre</th>
                  <th className={th}>Llamado</th>
                  <th className={th}>Locación</th>
                  <th className={th}>Disponible</th>
                </tr>
              </thead>
              <tbody>
                {crew.map((c) => {
                  const ll = llamadoPorCrew.get(c.id);
                  const noDisponible = ll?.no_disponible ?? false;
                  return (
                    <tr key={c.id} className={noDisponible ? "bg-neutral-100 text-neutral-400" : ""}>
                      <td className={td}>{c.puesto_especifico || "-"}</td>
                      <td className={td}>{c.personas.nombre}</td>
                      <td className={td}>
                        {noDisponible ? (
                          "—"
                        ) : esAdOProduccion ? (
                          <CeldaEditable
                            valorInicial={ll?.llamado ?? ""}
                            placeholder={dia.llamado_general ?? ""}
                            onGuardar={(v) => startTransition(() => actualizarLlamadoCrew(proyectoId, dia.id, c.id, "llamado", v))}
                          />
                        ) : (
                          ll?.llamado || dia.llamado_general || "-"
                        )}
                      </td>
                      <td className={td}>
                        {noDisponible ? (
                          "—"
                        ) : esAdOProduccion ? (
                          <CeldaEditable
                            valorInicial={ll?.locacion_url ?? ""}
                            onGuardar={(v) => startTransition(() => actualizarLlamadoCrew(proyectoId, dia.id, c.id, "locacion_url", v))}
                          />
                        ) : (
                          ll?.locacion_url || "-"
                        )}
                      </td>
                      <td className={td}>
                        {esAdOProduccion ? (
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={noDisponible}
                              onChange={(e) =>
                                startTransition(() =>
                                  actualizarNoDisponibleCrew(proyectoId, dia.id, c.id, e.target.checked)
                                )
                              }
                            />
                            No disponible
                          </label>
                        ) : noDisponible ? (
                          <span className="font-bold text-rojo">No disponible</span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">Talento</h4>
          <div className="overflow-x-auto rounded border border-neutral-100">
            <table className="w-full min-w-[700px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className={th}>Personaje</th>
                  <th className={th}>Nombre</th>
                  <th className={th}>Llamado</th>
                  <th className={th}>Locación</th>
                  <th className={th}>Se ocupa</th>
                </tr>
              </thead>
              <tbody>
                {talento.map((t) => {
                  const ll = llamadoPorTalento.get(t.id);
                  const noSeOcupa = ll?.no_se_ocupa ?? false;
                  return (
                    <tr key={t.id} className={noSeOcupa ? "bg-neutral-100 text-neutral-400" : ""}>
                      <td className={td}>{t.personaje || "-"}</td>
                      <td className={td}>{t.nombre}</td>
                      <td className={td}>
                        {noSeOcupa ? (
                          "—"
                        ) : esAdOProduccion ? (
                          <div className="flex items-center gap-1">
                            <CeldaEditable
                              valorInicial={ll?.llamado_desde ?? ""}
                              placeholder="Desde"
                              onGuardar={(v) => startTransition(() => actualizarLlamadoTalento(proyectoId, dia.id, t.id, "llamado_desde", v))}
                            />
                            <span>-</span>
                            <CeldaEditable
                              valorInicial={ll?.llamado_hasta ?? ""}
                              placeholder="Hasta"
                              onGuardar={(v) => startTransition(() => actualizarLlamadoTalento(proyectoId, dia.id, t.id, "llamado_hasta", v))}
                            />
                          </div>
                        ) : (
                          `${ll?.llamado_desde ?? "-"} - ${ll?.llamado_hasta ?? "-"}`
                        )}
                      </td>
                      <td className={td}>
                        {noSeOcupa ? (
                          "—"
                        ) : esAdOProduccion ? (
                          <CeldaEditable
                            valorInicial={ll?.locacion_url ?? ""}
                            onGuardar={(v) => startTransition(() => actualizarLlamadoTalento(proyectoId, dia.id, t.id, "locacion_url", v))}
                          />
                        ) : (
                          ll?.locacion_url || "-"
                        )}
                      </td>
                      <td className={td}>
                        {esAdOProduccion ? (
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={noSeOcupa}
                              onChange={(e) =>
                                startTransition(() =>
                                  actualizarNoSeOcupaTalento(proyectoId, dia.id, t.id, e.target.checked)
                                )
                              }
                            />
                            No se ocupa
                          </label>
                        ) : noSeOcupa ? (
                          <span className="font-bold text-rojo">No se ocupa</span>
                        ) : (
                          "Sí"
                        )}
                      </td>
                    </tr>
                  );
                })}
                {talento.length === 0 && (
                  <tr>
                    <td className={td} colSpan={5}>
                      Sin talento agregado (agrégalo abajo, en "Elenco / Talento del proyecto").
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">Plan de rodaje</h4>
          <div className="overflow-x-auto rounded border border-neutral-100">
            <table className="w-full min-w-[500px] border-collapse text-xs">
              <tbody>
                {renglones.map((r) => (
                  <tr key={r.id} className={r.tipo === "bloque" ? "bg-neutral-200 font-bold" : ""}>
                    <td className={`${td} w-28`}>{r.tipo === "bloque" ? r.hora : r.toma.hora_inicio}</td>
                    <td className={td}>
                      {r.tipo === "bloque"
                        ? r.descripcion
                        : `Esc. ${r.escena.numero} — ${r.toma.descripcion ?? r.escena.locacion ?? ""}`.trim() || "-"}
                    </td>
                  </tr>
                ))}
                {renglones.length === 0 && (
                  <tr>
                    <td className={td} colSpan={2}>
                      Sin plan capturado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </details>
  );
}
