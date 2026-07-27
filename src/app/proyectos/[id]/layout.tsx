import Link from "next/link";
import { getProyectoContext } from "@/lib/proyecto-context";
import { signOutAction } from "@/lib/actions/auth";

export default async function ProyectoLayout(
  props: { children: React.ReactNode } & { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const { proyecto, persona, esAdOProduccion, miDepartamentos } = await getProyectoContext(id);

  const tabs = [
    { href: `/proyectos/${id}/crew`, label: "Crew" },
    { href: `/proyectos/${id}/datos`, label: "Datos" },
    { href: `/proyectos/${id}/guion`, label: "Guion" },
    { href: `/proyectos/${id}/escenas`, label: "Escenas / Desglose" },
    { href: `/proyectos/${id}/shotlist`, label: "Shotlist" },
    { href: `/proyectos/${id}/calendario`, label: "Calendario" },
    { href: `/proyectos/${id}/presupuesto`, label: "Presupuesto" },
    { href: `/proyectos/${id}/presentaciones`, label: "Presentaciones" },
    ...(miDepartamentos.includes("Dirección/AD") ? [{ href: `/proyectos/${id}/ideas`, label: "Ideas" }] : []),
    ...(esAdOProduccion ? [{ href: `/proyectos/${id}/documentos`, label: "Documentos" }] : []),
    ...(esAdOProduccion ? [{ href: `/proyectos/${id}/ajustes`, label: "Ajustes" }] : []),
  ];

  return (
    <div className="min-h-full bg-neutral-100">
      <header className="flex items-center justify-between bg-negro px-8 py-4 text-hueso">
        <div className="flex items-center gap-4">
          <Link href="/proyectos" className="text-sm text-neutral-400 hover:text-hueso">
            ← Proyectos
          </Link>
          <h1 className="text-lg font-semibold">{proyecto.nombre}</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>{persona.nombre}</span>
          <form action={signOutAction}>
            <button className="rounded border border-neutral-500 px-3 py-1 hover:border-hueso">
              Salir
            </button>
          </form>
        </div>
      </header>
      <nav className="flex gap-1 bg-negro px-8">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-t-md bg-neutral-800 px-5 py-3 text-sm font-semibold text-neutral-300 hover:bg-neutral-700 hover:text-hueso"
          >
            {t.label}
          </Link>
        ))}
        {esAdOProduccion && (
          <span className="ml-auto self-center rounded bg-rojo/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-rojo">
            AD / Producción
          </span>
        )}
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-8">{props.children}</main>
    </div>
  );
}
