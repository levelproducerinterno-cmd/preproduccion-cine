"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { agregarToma } from "./actions";

const OTRO = "__otro__";

const OPCIONES: Record<string, string[]> = {
  shot_size: ["CU", "MCU", "ECU", "MS", "FS", "LS", "MLS", "ELS", "W", "CU (OTS)", "MCU (OTS)", "ECU (OTS)", "MS (OTS)"],
  camara: ["A CAM", "B CAM", "C CAM", "D CAM"],
  angulo: ["Eyelevel", "Low Angle", "High Angle", "Extreme Low", "Extreme High", "Dutch Tilt", "POV", "50/50", "Cenital"],
  movimiento: [
    "Static",
    "Pan",
    "Tilt",
    "Pedestal",
    "Dolly in",
    "Dolly out",
    "Drone",
    "Steadicam",
    "Handheld",
    "Crane / Boom",
    "Tracking Shot",
    "Zoom",
    "Rack Focus",
  ],
  equipo: [
    "Handheld",
    "Sticks / Tripod",
    "Ronin",
    "Dolly",
    "Steadicam",
    "Movi",
    "Technocrane",
    "Condor",
    "Cherry Picker",
    "Camera Car",
    "Drone",
    "Helicam",
  ],
  lente: ["12 mm", "16 mm", "24 - 70 mm", "50 mm", "85 mm", "TBD"],
  sonido: ["Boom", "Lav", "Lav & Boom", "Lavs & Boom", "MOS", "Música EXD", "Música IND"],
};

const ETIQUETAS: Record<string, string> = {
  shot_size: "Shot size",
  camara: "Cámara",
  angulo: "Ángulo",
  movimiento: "Movimiento",
  equipo: "Equipo",
  lente: "Lente",
  sonido: "Sonido",
};

function CampoConOtro({ campo }: { campo: string }) {
  const [valor, setValor] = useState("");
  const [otro, setOtro] = useState("");
  return (
    <div>
      <select
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-full rounded border border-neutral-300 px-2 py-2 text-sm"
      >
        <option value="">{ETIQUETAS[campo]}</option>
        {OPCIONES[campo].map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
        <option value={OTRO}>Otro (especificar)</option>
      </select>
      {valor === OTRO ? (
        <input
          name={campo}
          value={otro}
          onChange={(e) => setOtro(e.target.value)}
          placeholder={`${ETIQUETAS[campo]} (especifica)`}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-2 text-sm"
        />
      ) : (
        <input type="hidden" name={campo} value={valor} />
      )}
    </div>
  );
}

export default function TomaForm({ proyectoId, escenaId }: { proyectoId: string; escenaId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [subiendo, startTransition] = useTransition();
  const [archivo, setArchivo] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);

    startTransition(async () => {
      if (archivo) {
        const supabase = createClient();
        const path = `${escenaId}/${Date.now()}-${archivo.name}`;
        const { error } = await supabase.storage.from("shotlist").upload(path, archivo);
        if (!error) {
          const { data } = supabase.storage.from("shotlist").getPublicUrl(path);
          formData.set("imagen_url", data.publicUrl);
        }
      }
      await agregarToma(proyectoId, escenaId, formData);
      form.reset();
      setArchivo(null);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="mt-4 grid gap-3 border-t border-neutral-100 pt-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <input name="setup_num" placeholder="Setup #" className="rounded border border-neutral-300 px-2 py-2 text-sm" />
        <input name="shot_num" placeholder="Shot #" className="rounded border border-neutral-300 px-2 py-2 text-sm" />
        <input name="subject" placeholder="Subject" className="col-span-2 rounded border border-neutral-300 px-2 py-2 text-sm md:col-span-2" />
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <CampoConOtro campo="shot_size" />
        <CampoConOtro campo="camara" />
        <CampoConOtro campo="angulo" />
        <CampoConOtro campo="movimiento" />
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <CampoConOtro campo="equipo" />
        <CampoConOtro campo="lente" />
        <CampoConOtro campo="sonido" />
      </div>
      <input name="descripcion" placeholder="Descripción de la toma" className="rounded border border-neutral-300 px-2 py-2 text-sm" />
      <input name="notas" placeholder="Notas" className="rounded border border-neutral-300 px-2 py-2 text-sm" />
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          className="text-xs text-neutral-500"
        />
        <input type="hidden" name="imagen_url" />
        <button
          type="submit"
          disabled={subiendo}
          className="ml-auto rounded bg-rojo px-3 py-2 text-sm font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
        >
          {subiendo ? "Guardando..." : "+ Agregar toma"}
        </button>
      </div>
    </form>
  );
}
