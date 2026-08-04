import { getProyectoContext } from "@/lib/proyecto-context";
import { agregarItemPresupuesto, eliminarItemPresupuesto, agregarRubroCustom } from "./actions";
import type { Departamento } from "@/lib/types";

type Rubro = { id: string; nombre: string; orden: number };
type Item = {
  id: string;
  departamento_id: string;
  rubro_id: string;
  objeto_especifico: string;
  cantidad: number;
  tipo_unidad: string;
  costo_unitario: number;
  subtotal: number;
  importancia: "Obligatorio" | "Bien si se toma";
  es_prestado: boolean;
  prestado_de: string | null;
  departamentos: { nombre: string };
  presupuesto_rubros: { nombre: string };
};

const moneda = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });

export default async function PresupuestoPage(props: { params: Promise<{ id: string }> }) {
  const { id: proyectoId } = await props.params;
  const { supabase, esAdOProduccion, miDepartamentos } = await getProyectoContext(proyectoId);

  const { data: departamentosTodos } = await supabase
    .from("departamentos")
    .select("id, nombre, orden")
    .order("orden");

  const departamentosDisponibles = esAdOProduccion
    ? ((departamentosTodos ?? []) as Departamento[])
    : ((departamentosTodos ?? []) as Departamento[]).filter((d) => miDepartamentos.includes(d.nombre));

  const { data: rubros } = await supabase
    .from("presupuesto_rubros")
    .select("id, nombre, orden")
    .or(`proyecto_id.eq.${proyectoId},proyecto_id.is.null`)
    .order("orden");

  const { data: itemsRaw } = await supabase
    .from("presupuesto_items")
    .select(
      "id, departamento_id, rubro_id, objeto_especifico, cantidad, tipo_unidad, costo_unitario, subtotal, importancia, es_prestado, prestado_de, departamentos(nombre), presupuesto_rubros(nombre)"
    )
    .eq("proyecto_id", proyectoId)
    .order("created_at", { ascending: false });

  const items = (itemsRaw ?? []) as unknown as Item[];

  const porDepartamento = new Map<string, Item[]>();
  for (const it of items) {
    const key = it.departamentos.nombre;
    porDepartamento.set(key, [...(porDepartamento.get(key) ?? []), it]);
  }
  const totalGeneral = items.reduce((sum, it) => sum + Number(it.subtotal), 0);

  return (
    <div className="grid gap-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500">
            Presupuesto {esAdOProduccion ? "(todos los departamentos)" : "(tu departamento)"}
          </h2>
          <span className="text-lg font-bold text-negro">{moneda(totalGeneral)}</span>
        </div>

        {[...porDepartamento.entries()].map(([depNombre, depItems]) => {
          const totalDep = depItems.reduce((s, it) => s + Number(it.subtotal), 0);
          return (
            <div key={depNombre} className="mb-6 rounded-lg border border-neutral-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-5 py-3">
                <h3 className="font-semibold text-negro">{depNombre}</h3>
                <span className="font-semibold text-negro">{moneda(totalDep)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse text-xs">
                  <thead>
                    <tr className="bg-negro text-hueso">
                      <th className="p-2 text-left font-semibold">Rubro</th>
                      <th className="p-2 text-left font-semibold">Objeto específico</th>
                      <th className="p-2 text-right font-semibold">Cantidad</th>
                      <th className="p-2 text-left font-semibold">Tipo unidad</th>
                      <th className="p-2 text-right font-semibold">Costo unitario</th>
                      <th className="p-2 text-right font-semibold">Subtotal</th>
                      <th className="p-2 text-left font-semibold">Importancia</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {depItems.map((it, i) => (
                      <tr key={it.id} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}>
                        <td className="border border-neutral-100 p-2">{it.presupuesto_rubros.nombre}</td>
                        <td className="border border-neutral-100 p-2">
                          {it.objeto_especifico}
                          {it.es_prestado && (
                            <span className="ml-2 rounded bg-neutral-200 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-neutral-600">
                              Prestado{it.prestado_de ? ` de: ${it.prestado_de}` : ""}
                            </span>
                          )}
                        </td>
                        <td className="border border-neutral-100 p-2 text-right">{it.cantidad}</td>
                        <td className="border border-neutral-100 p-2">{it.tipo_unidad}</td>
                        <td className="border border-neutral-100 p-2 text-right">{moneda(it.costo_unitario)}</td>
                        <td className="border border-neutral-100 p-2 text-right font-semibold text-negro">
                          {moneda(it.subtotal)}
                        </td>
                        <td className="border border-neutral-100 p-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase ${
                              it.importancia === "Obligatorio" ? "bg-rojo/15 text-rojo" : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {it.importancia}
                          </span>
                        </td>
                        <td className="border border-neutral-100 p-2">
                          <form action={eliminarItemPresupuesto.bind(null, proyectoId, it.id)}>
                            <button className="text-neutral-300 hover:text-rojo">✕</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="rounded-lg border border-neutral-200 bg-white p-10 text-center text-neutral-500 shadow-sm">
            Aún no hay gastos capturados.
          </p>
        )}
      </section>

      {departamentosDisponibles.length > 0 && (
        <section>
          <details className="mb-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-neutral-500">
              + Agregar rubro personalizado
            </summary>
            <form action={agregarRubroCustom.bind(null, proyectoId)} className="mt-3 flex gap-2">
              <input
                name="nombre_rubro"
                placeholder="Ej. Drones, Permisos..."
                className="flex-1 rounded border border-neutral-300 px-3 py-2"
              />
              <button className="rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-hueso">Agregar</button>
            </form>
          </details>

          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-neutral-500">
            Agregar gasto
          </h2>
          <form
            action={agregarItemPresupuesto.bind(null, proyectoId)}
            className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Departamento
                </label>
                <select name="departamento_id" required className="w-full rounded border border-neutral-300 px-3 py-2">
                  {departamentosDisponibles.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Rubro
                </label>
                <select name="rubro_id" required className="w-full rounded border border-neutral-300 px-3 py-2">
                  {(rubros as Rubro[] | null)?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                Objeto específico
              </label>
              <input
                name="objeto_especifico"
                required
                placeholder="Ej. Renta de cámara RED"
                className="w-full rounded border border-neutral-300 px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Cantidad
                </label>
                <input
                  type="number"
                  name="cantidad"
                  step="0.01"
                  defaultValue={1}
                  required
                  className="w-full rounded border border-neutral-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Tipo de unidad
                </label>
                <select name="tipo_unidad" className="w-full rounded border border-neutral-300 px-3 py-2">
                  <option>Único</option>
                  <option>Día</option>
                  <option>Unidad</option>
                  <option>Viajes</option>
                  <option>Personas</option>
                  <option>Otro</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Costo unitario
                </label>
                <input
                  type="number"
                  name="costo_unitario"
                  step="0.01"
                  defaultValue={0}
                  required
                  className="w-full rounded border border-neutral-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-600">
                  Importancia
                </label>
                <select
                  name="importancia"
                  defaultValue="Obligatorio"
                  className="w-full rounded border border-neutral-300 px-3 py-2"
                >
                  <option value="Obligatorio">Obligatorio</option>
                  <option value="Bien si se toma">Bien si se toma</option>
                </select>
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-neutral-600">
                  <input type="checkbox" name="es_prestado" className="normal-case" />
                  Prestado (no se compra)
                </label>
                <input
                  name="prestado_de"
                  placeholder="¿Quién lo presta? (si aplica)"
                  className="w-full rounded border border-neutral-300 px-3 py-2"
                />
              </div>
            </div>
            <button className="mt-2 rounded bg-rojo py-3 font-semibold text-hueso hover:brightness-110">
              + Agregar gasto
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
