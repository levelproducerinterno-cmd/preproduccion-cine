"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensurePersonaLinked } from "@/lib/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "signup">("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
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
        setStatus("Cuenta creada. Revisa tu correo para confirmar tu cuenta y luego inicia sesión.");
        setCargando(false);
        return;
      }
      await ensurePersonaLinked(nombre);
      router.push("/proyectos");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
      setCargando(false);
      return;
    }
    await ensurePersonaLinked(nombre);
    router.push("/proyectos");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-negro px-4">
      <div className="w-full max-w-sm rounded-lg bg-hueso p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-wide text-negro">
            Pre<span className="text-rojo">producción</span>
          </h1>
          <p className="mt-1 text-[0.7rem] uppercase tracking-[0.18em] text-neutral-500">
            Sistema de operación
          </p>
        </div>

        <div className="mb-6 flex gap-1 rounded-md bg-neutral-200 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setModo("login")}
            className={`flex-1 rounded py-2 ${modo === "login" ? "bg-negro text-hueso" : "text-neutral-600"}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setModo("signup")}
            className={`flex-1 rounded py-2 ${modo === "signup" ? "bg-negro text-hueso" : "text-neutral-600"}`}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {modo === "signup" && (
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Nombre
              </label>
              <input
                name="nombre"
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
              name="email"
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
              name="password"
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
            {modo === "login" ? "Entrar" : "Crear cuenta"}
          </button>
          {status && <p className="text-center text-sm text-rojo">{status}</p>}
        </form>
      </div>
    </div>
  );
}
