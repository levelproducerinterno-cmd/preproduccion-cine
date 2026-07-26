"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { agregarToma } from "./actions";

const CAMPOS: { name: string; label: string; placeholder?: string }[] = [
  { name: "setup_num", label: "Setup #" },
  { name: "shot_num", label: "Shot #" },
  { name: "subject", label: "Subject" },
  { name: "shot_size", label: "Shot size", placeholder: "CU, MS, WS..." },
  { name: "camara", label: "Cámara", placeholder: "A CAM" },
  { name: "angulo", label: "Ángulo", placeholder: "Eyelevel" },
  { name: "movimiento", label: "Movimiento", placeholder: "Static, Pan..." },
  { name: "equipo", label: "Equipo", placeholder: "Tripod, Handheld..." },
  { name: "lente", label: "Lente", placeholder: "24-70mm" },
  { name: "sonido", label: "Sonido", placeholder: "Boom" },
];

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
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {CAMPOS.map((c) => (
          <input
            key={c.name}
            name={c.name}
            placeholder={c.placeholder ?? c.label}
            className="rounded border border-neutral-300 px-2 py-2 text-sm"
          />
        ))}
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
