import { createClient } from "@/lib/supabase/server";

type HitoIcal = {
  hito_id: string;
  proyecto_nombre: string;
  nombre: string;
  fecha_limite: string;
  notas: string | null;
  status: string;
};

function escaparTexto(texto: string) {
  return texto.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function fechaSinGuiones(fecha: string) {
  return fecha.replace(/-/g, "");
}

function sumarUnDia(fecha: string) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(_req: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("obtener_hitos_para_ical", { p_token: token });

  if (error) {
    return new Response("Calendario no encontrado.", { status: 404 });
  }

  const hitos = (data ?? []) as HitoIcal[];
  const ahora = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const eventos = hitos
    .map((h) => {
      const inicio = fechaSinGuiones(h.fecha_limite);
      const fin = fechaSinGuiones(sumarUnDia(h.fecha_limite));
      const resumen = escaparTexto(`${h.proyecto_nombre}: ${h.nombre}`);
      const descripcion = escaparTexto(h.notas ?? "");
      return [
        "BEGIN:VEVENT",
        `UID:${h.hito_id}@preproduccion.level`,
        `DTSTAMP:${ahora}`,
        `DTSTART;VALUE=DATE:${inicio}`,
        `DTEND;VALUE=DATE:${fin}`,
        `SUMMARY:${resumen}`,
        ...(descripcion ? [`DESCRIPTION:${descripcion}`] : []),
        `STATUS:${h.status === "completado" ? "CONFIRMED" : "TENTATIVE"}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Level Producer System//Preproduccion//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Calendario de preproducción",
    eventos,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="calendario.ics"',
      "Cache-Control": "public, max-age=1800",
    },
  });
}
