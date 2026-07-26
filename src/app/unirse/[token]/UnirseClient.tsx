"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensurePersonaLinked } from "@/lib/actions/auth";

export default function UnirseClient({
  token,
  autenticado,
  departamentos,
}: {
  token: string;
  autenticado: boolean;
  departamentos: { id: string; nombre: string }[];
}) {
  const [modo, setModo] = useState<"login" | "signup">("signup");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [puesto, setPuesto] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setCargando(true);
    const supabase = createClient();

    if (modo === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setStatus(error.message);
        setCargando(false);
        return;
      }
      if (!data.session) {
        setStatus("Cuenta creada. Revisa tu correo para confirmar tu cuenta y regresa a este link.");
        setCargando(false);
        return;
      }
      await ensurePersonaLinked(nombre);
      window.location.reload();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
      setCargando(false);
      return;
    }
    await ensurePersonaLinked(nombre);
    window.location.reload();
  }

  function toggleDepartamento(id: string) {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function onUnirseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    setCargando(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("redimir_invitacion", {
      p_token: token,
      p_puesto: puesto || null,
      p_departamento_ids: seleccionados,
    });
    if (error) {
      setStatus(error.message);
      setCargando(false);
      return;
    }
    window.location.href = `/proyectos/${data}/crew`;
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-negro px-4 py-10">
      <div className="w-full max-w-sm rounded-lg bg-hueso p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-wide text-negro">
            Pre<span className="text-rojo">producción</span>
          </h1>
          <p className="mt-1 text-[0.7rem] uppercase tracking-[0.18em] text-neutral-500">
            Te invitaron a un proyecto
          </p>
        </div>

        {!autenticado ? (
          <>
            <div className="mb-6 flex gap-1 rounded-md bg-neutral-200 p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setModo("signup")}
                className={`flex-1 rounded py-2 ${modo === "signup" ? "bg-negro text-hueso" : "text-neutral-600"}`}
              >
                Crear cuenta
              </button>
              <button
                type="button"
                onClick={() => setModo("login")}
                className={`flex-1 rounded py-2 ${modo === "login" ? "bg-negro text-hueso" : "text-neutral-600"}`}
              >
                Ya tengo cuenta
              </button>
            </div>
            <form onSubmit={onAuthSubmit} className="flex flex-col gap-4">
              {modo === "signup" && (
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                    Nombre
                  </label>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-rojo focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Correo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-rojo focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-rojo focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="mt-2 rounded bg-rojo py-3 font-semibold text-hueso hover:brightness-110 disabled:opacity-60"
              >
                {modo === "signup" ? "Crear cuenta y continuar" : "Entrar y continuar"}
              </button>
              {status && <p className="text-center text-sm text-rojo">{status}</p>}
            </form>
          </>
        ) : (
          <form onSubmit={onUnirseSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Tu puesto específico (ej. &quot;Asistente de Arte&quot;)
              </label>
              <input
                value={puesto}
                onChange={(e) => setPuesto(e.target.value)}
                className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-rojo focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Departamento(s) — puede marcar más de uno
              </label>
              <div className="flex flex-wrap gap-3">
                {departamentos.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(d.id)}
                      onChange={() => toggleDepartamento(d.id)}
                    />
                    {d.nombre}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={cargando || seleccionados.length === 0}
              className="mt-2 rounded bg-rojo py-3 font-semibold text-hueso hover:brightness-110 disabled:opacity-60"
            >
              Unirme al proyecto
            </button>
            {status && <p className="text-center text-sm text-rojo">{status}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
