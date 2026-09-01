import { getProyectoContext } from "@/lib/proyecto-context";
import type {
  Escena,
  Toma,
  DiaRodaje,
  PlanRodajeBloque,
  DiaRodajeLocacion,
  DiaRodajeCrewLlamado,
  Talento,
  DiaRodajeTalentoLlamado,
  ArteDeEscena,
} from "@/lib/types";
import PlanRodajeView, { type RenglonPlan, type CrewParaLlamado } from "./PlanRodajeView";

export default async function PlanRodajePage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, proyecto, esAdOProduccion, miDepartamentos } = await getProyectoContext(proyectoId);

  const puedeEditarTomas =
    esAdOProduccion || miDepartamentos.includes("Fotografía") || miDepartamentos.includes("Gaffer");
  const puedeEditarArte = esAdOProduccion || miDepartamentos.includes("Arte");

  const { data: diasRaw } = await supabase
    .from("dias_rodaje")
    .select("id, proyecto_id, numero, fecha, llamado_general, jornada_horas, ready_to_shoot, orden")
    .eq("proyecto_id", proyectoId)
    .order("orden");
  const dias = (diasRaw ?? []) as DiaRodaje[];

  const { data: escenasRaw } = await supabase
    .from("escenas")
    .select("id, proyecto_id, guion_id, numero, int_ext, locacion, momento, orden, dia_rodaje_numero, orden_del_dia")
    .eq("proyecto_id", proyectoId)
    .order("orden");
  const escenas = (escenasRaw ?? []) as Escena[];

  const { data: tomasRaw } = await supabase
    .from("tomas")
    .select(
      "id, escena_id, setup_num, shot_num, subject, shot_size, camara, angulo, movimiento, equipo, lente, sonido, descripcion, notas, imagen_url, importancia, orden, hora_inicio, tiempo_estimado, talento_en_toma, set_especifico, notas_arte, orden_plan_rodaje"
    )
    .in("escena_id", escenas.map((e) => e.id))
    .order("orden");
  const tomas = (tomasRaw ?? []) as Toma[];

  const { data: arteRaw } = await supabase
    .from("desglose_elementos")
    .select("id, escena_id, descripcion, departamentos!inner(nombre)")
    .in("escena_id", escenas.map((e) => e.id))
    .eq("departamentos.nombre", "Arte");
  const arteItemsPorEscena: Record<string, ArteDeEscena[]> = {};
  for (const item of (arteRaw ?? []) as unknown as { id: string; escena_id: string; descripcion: string }[]) {
    (arteItemsPorEscena[item.escena_id] ??= []).push({ id: item.id, descripcion: item.descripcion });
  }

  const { data: excluidosRaw } = await supabase
    .from("toma_arte_excluidos")
    .select("toma_id, desglose_elemento_id")
    .in("toma_id", tomas.map((t) => t.id));
  const excluidosPorToma: Record<string, string[]> = {};
  for (const ex of (excluidosRaw ?? []) as { toma_id: string; desglose_elemento_id: string }[]) {
    (excluidosPorToma[ex.toma_id] ??= []).push(ex.desglose_elemento_id);
  }

  const diaIds = dias.map((d) => d.id);

  const { data: bloquesRaw } = await supabase
    .from("plan_rodaje_bloques")
    .select("id, dia_rodaje_id, hora, descripcion, orden")
    .in("dia_rodaje_id", diaIds)
    .order("orden");
  const bloques = (bloquesRaw ?? []) as PlanRodajeBloque[];

  const { data: locacionesRaw } = await supabase
    .from("dia_rodaje_locaciones")
    .select("id, dia_rodaje_id, nombre, url_maps, orden")
    .in("dia_rodaje_id", diaIds)
    .order("orden");
  const locaciones = (locacionesRaw ?? []) as DiaRodajeLocacion[];

  const { data: crewLlamadosRaw } = await supabase
    .from("dia_rodaje_crew_llamados")
    .select("id, dia_rodaje_id, proyecto_crew_id, llamado, locacion_url, no_disponible")
    .in("dia_rodaje_id", diaIds);
  const crewLlamados = (crewLlamadosRaw ?? []) as DiaRodajeCrewLlamado[];

  const { data: talentoRaw } = await supabase
    .from("talento")
    .select("id, proyecto_id, personaje, nombre, telefono, orden")
    .eq("proyecto_id", proyectoId)
    .order("orden");
  const talento = (talentoRaw ?? []) as Talento[];

  const { data: talentoLlamadosRaw } = await supabase
    .from("dia_rodaje_talento_llamados")
    .select("id, dia_rodaje_id, talento_id, llamado_desde, llamado_hasta, locacion_url, no_se_ocupa")
    .in("dia_rodaje_id", diaIds);
  const talentoLlamados = (talentoLlamadosRaw ?? []) as DiaRodajeTalentoLlamado[];

  const { data: crewRaw } = await supabase
    .from("proyecto_crew")
    .select("id, puesto_especifico, personas(nombre, telefono)")
    .eq("proyecto_id", proyectoId);
  const crew = (crewRaw ?? []) as unknown as CrewParaLlamado[];

  const escenasPorNumeroDia = new Map<number, Escena[]>();
  for (const e of escenas) {
    if (e.dia_rodaje_numero == null) continue;
    const lista = escenasPorNumeroDia.get(e.dia_rodaje_numero) ?? [];
    lista.push(e);
    escenasPorNumeroDia.set(e.dia_rodaje_numero, lista);
  }

  const tomasPorEscena = new Map<string, Toma[]>();
  for (const t of tomas) {
    tomasPorEscena.set(t.escena_id, [...(tomasPorEscena.get(t.escena_id) ?? []), t]);
  }

  const renglonesPorDia = new Map<string, RenglonPlan[]>();
  for (const dia of dias) {
    const renglones: RenglonPlan[] = [];
    for (const b of bloques.filter((x) => x.dia_rodaje_id === dia.id)) {
      renglones.push({ tipo: "bloque", id: b.id, clave: b.orden, hora: b.hora, descripcion: b.descripcion });
    }
    const escenasDelDia = (escenasPorNumeroDia.get(dia.numero) ?? []).sort(
      (a, b) => (a.orden_del_dia ?? 0) - (b.orden_del_dia ?? 0)
    );
    for (const esc of escenasDelDia) {
      const tomasDeEscena = tomasPorEscena.get(esc.id) ?? [];
      for (const t of tomasDeEscena) {
        const claveDerivada = (esc.orden_del_dia ?? 0) * 1000 + t.orden;
        renglones.push({
          tipo: "toma",
          id: t.id,
          clave: t.orden_plan_rodaje ?? claveDerivada,
          toma: t,
          escena: esc,
        });
      }
    }
    renglones.sort((a, b) => a.clave - b.clave);
    renglonesPorDia.set(dia.id, renglones);
  }

  const escenasSinAsignar = escenas.filter((e) => e.dia_rodaje_numero == null);

  return (
    <PlanRodajeView
      proyectoId={proyectoId}
      proyectoNombre={proyecto.nombre}
      logoUrl={proyecto.logo_url}
      colorPrimario={proyecto.color_primario}
      esAdOProduccion={esAdOProduccion}
      puedeEditarTomas={puedeEditarTomas}
      puedeEditarArte={puedeEditarArte}
      dias={dias}
      escenas={escenas}
      escenasSinAsignar={escenasSinAsignar}
      renglonesPorDia={Object.fromEntries(renglonesPorDia)}
      arteItemsPorEscena={arteItemsPorEscena}
      excluidosPorToma={excluidosPorToma}
      locaciones={locaciones}
      crew={crew}
      crewLlamados={crewLlamados}
      talento={talento}
      talentoLlamados={talentoLlamados}
    />
  );
}
