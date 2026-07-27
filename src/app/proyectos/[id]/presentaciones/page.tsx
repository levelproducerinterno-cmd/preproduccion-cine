import Link from "next/link";
import { getProyectoContext } from "@/lib/proyecto-context";

export default async function PresentacionesPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { esAdOProduccion, miDepartamentos } = await getProyectoContext(proyectoId);

  const puedeArte = esAdOProduccion || miDepartamentos.includes("Arte");
  const puedeDireccion = esAdOProduccion;

  const decks = [
    {
      href: `/proyectos/${proyectoId}/presentaciones/arte`,
      nombre: "Presentación de Arte",
      descripcion: "Propuesta de arte: emociones, moodboard, texturas, ambiente, objeto clave.",
      puede: puedeArte,
    },
    {
      href: `/proyectos/${proyectoId}/presentaciones/direccion`,
      nombre: "Presentación de Dirección",
      descripcion: "Moodboard de cine: logline, referencias, ubicaciones, personajes, fotografía.",
      puede: puedeDireccion,
    },
  ];

  return (
    <div className="grid gap-4">
      <p className="text-sm text-neutral-500">
        Cada presentación es una plantilla fija: reemplaza los textos y sube tus propias imágenes.
        Al final puedes descargarla en PDF con el mismo membrete de todo el sistema.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {decks.map((d) => (
          <div key={d.href} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 font-semibold text-negro">{d.nombre}</h3>
            <p className="mb-4 text-sm text-neutral-500">{d.descripcion}</p>
            {d.puede ? (
              <Link
                href={d.href}
                className="inline-block rounded bg-rojo px-4 py-2 text-sm font-semibold text-hueso hover:brightness-110"
              >
                Abrir / editar
              </Link>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Solo el departamento correspondiente puede editarla
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
