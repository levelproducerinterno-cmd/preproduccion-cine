import Link from "next/link";
import { getProyectoContext } from "@/lib/proyecto-context";
import type { Departamento, PresentacionPdf } from "@/lib/types";
import SubirPresentacionPdf from "@/components/presentaciones/SubirPresentacionPdf";

export default async function PresentacionesPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, esAdOProduccion, miDepartamentos } = await getProyectoContext(proyectoId);

  const { data: departamentos } = await supabase
    .from("departamentos")
    .select("id, nombre, orden")
    .order("orden");

  const { data: pdfsRaw } = await supabase
    .from("presentaciones_pdf")
    .select("id, departamento_id, archivo_url, nombre_archivo")
    .eq("proyecto_id", proyectoId);

  const pdfPorDepartamento = new Map<string, PresentacionPdf>();
  for (const p of (pdfsRaw ?? []) as PresentacionPdf[]) {
    pdfPorDepartamento.set(p.departamento_id, p);
  }

  const builders: Record<string, { href: string; descripcion: string }> = {
    Arte: {
      href: `/proyectos/${proyectoId}/presentaciones/arte`,
      descripcion: "También puedes usar nuestra plantilla para armarla dentro del sistema.",
    },
    "Dirección/AD": {
      href: `/proyectos/${proyectoId}/presentaciones/direccion`,
      descripcion: "También puedes usar nuestra plantilla para armarla dentro del sistema.",
    },
  };

  return (
    <div className="grid gap-4">
      <p className="text-sm text-neutral-500">
        Cada departamento puede subir aquí su presentación ya lista en PDF (hecha en Canva, PowerPoint, Keynote,
        lo que usen). Arte y Dirección además tienen una plantilla armable dentro del sistema si prefieren esa opción.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {((departamentos as Departamento[] | null) ?? []).map((d) => {
          const puedeEditar = esAdOProduccion || miDepartamentos.includes(d.nombre);
          const pdf = pdfPorDepartamento.get(d.id) ?? null;
          const builder = builders[d.nombre];
          return (
            <div key={d.id} className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="mb-1 font-semibold text-negro">{d.nombre}</h3>
              {builder && <p className="mb-3 text-xs text-neutral-400">{builder.descripcion}</p>}
              <div className="grid gap-3">
                <SubirPresentacionPdf
                  proyectoId={proyectoId}
                  departamentoId={d.id}
                  archivoUrl={pdf?.archivo_url ?? null}
                  nombreArchivo={pdf?.nombre_archivo ?? null}
                  puedeEditar={puedeEditar}
                />
                {builder && puedeEditar && (
                  <Link href={builder.href} className="text-xs font-semibold text-rojo hover:underline">
                    Abrir plantilla armable →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
