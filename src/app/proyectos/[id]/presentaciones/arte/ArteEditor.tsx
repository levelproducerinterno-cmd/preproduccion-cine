"use client";

import { useState, useTransition } from "react";
import type { PresentacionArteDatos } from "@/lib/types";
import { guardarPresentacion } from "../actions";
import ImagenSlot from "@/components/presentaciones/ImagenSlot";
import { crearDocSlides, agregarImagenCover, hexARgbSlide, SLIDE_W, SLIDE_H } from "@/lib/pdf-slides";
import { finalizarConPiePagina } from "@/lib/pdf-machote";

const inputTexto =
  "w-full border-none bg-transparent p-0 text-sm outline-none placeholder:text-neutral-400 focus:ring-0";

export default function ArteEditor({
  proyectoId,
  proyectoNombre,
  colorPrimario,
  datosIniciales,
}: {
  proyectoId: string;
  proyectoNombre: string;
  colorPrimario: string;
  datosIniciales: PresentacionArteDatos;
}) {
  const [datos, setDatos] = useState(datosIniciales);
  const [pendiente, startTransition] = useTransition();
  const [generando, setGenerando] = useState(false);

  function guardar() {
    startTransition(() => {
      guardarPresentacion(proyectoId, "arte", datos);
    });
  }

  const rojo = colorPrimario || "#c72a09";

  async function descargarPdf() {
    setGenerando(true);
    const doc = await crearDocSlides();
    const [r, g, b] = hexARgbSlide(rojo);
    const grisClaro: [number, number, number] = [227, 227, 227];
    const negro: [number, number, number] = [10, 10, 10];

    const nuevaPagina = (i: number) => {
      if (i > 0) doc.addPage();
    };

    // 1. Portada
    nuevaPagina(0);
    await agregarImagenCover(doc, datos.portada.imagen, 0, 0, SLIDE_W, SLIDE_H, negro);
    doc.setFillColor(0, 0, 0);
    doc.setGState(doc.GState({ opacity: 0.55 }));
    doc.rect(0, 0, SLIDE_W * 0.42, SLIDE_H, "F");
    doc.setGState(doc.GState({ opacity: 1 }));
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(46);
    doc.text(proyectoNombre.toUpperCase(), 18, 60, { maxWidth: SLIDE_W * 0.35 });
    doc.setTextColor(230);
    doc.setFontSize(12);
    doc.text(datos.portada.nombreDirector || "Director/a de arte", 18, 120);
    doc.setFont("helvetica", "bold");
    doc.text("PROPUESTA DE ARTE", 18, 150);

    // 2. Emociones para el proyecto
    nuevaPagina(1);
    doc.setFillColor(...grisClaro);
    doc.rect(0, 0, SLIDE_W, SLIDE_H, "F");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.text("EMOCIONES PARA EL\nPROYECTO", 18, 35);
    const preguntasEmociones: [string, string][] = [
      ["¿CÓMO SE SIENTE?", datos.emociones.comoSeSiente],
      ["¿A QUIÉN VA DIRIGIDO?", datos.emociones.aQuienVaDirigido],
      ["¿QUÉ EMOCIÓN TRANSMITE?", datos.emociones.queEmocionTransmite],
      ["EMOCIONES PREDOMINANTES", datos.emociones.emocionesPredominantes],
    ];
    const posiciones: [number, number][] = [
      [40, 80],
      [190, 80],
      [40, 125],
      [190, 125],
    ];
    preguntasEmociones.forEach(([label, valor], i) => {
      const [px, py] = posiciones[i];
      doc.setTextColor(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(label, px, py, { maxWidth: 130 });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90);
      doc.setFontSize(10);
      doc.text(valor || "—", px, py + 8, { maxWidth: 130 });
    });

    // 3. Galería
    nuevaPagina(2);
    {
      const cols = 3;
      const rows = 3;
      const cw = SLIDE_W / cols;
      const ch = SLIDE_H / rows;
      for (let i = 0; i < cols * rows; i++) {
        const cx = (i % cols) * cw;
        const cy = Math.floor(i / cols) * ch;
        await agregarImagenCover(doc, datos.galeria[i], cx, cy, cw, ch, negro);
      }
    }

    // 4. Descripción del proyecto
    nuevaPagina(3);
    doc.setFillColor(...grisClaro);
    doc.rect(0, 0, SLIDE_W, SLIDE_H, "F");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.text("DESCRIPCIÓN DEL\nPROYECTO", 18, 35);
    const preguntasDescripcion: [string, string][] = [
      ["EMOCIONES A EVITAR", datos.descripcion.emocionesAEvitar],
      ["¿QUÉ RECUERDOS O SENSACIONES DEBERÍA DESPERTAR?", datos.descripcion.recuerdosOSensaciones],
      ["SI ESTE PROYECTO FUERA UNA PERSONA, ¿CÓMO SERÍA?", datos.descripcion.siFueraPersona],
      ["", ""],
    ];
    preguntasDescripcion.forEach(([label, valor], i) => {
      if (!label) return;
      const [px, py] = posiciones[i];
      doc.setTextColor(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(label, px, py, { maxWidth: 130 });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90);
      doc.setFontSize(10);
      doc.text(valor || "—", px, py + 8, { maxWidth: 130 });
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20);
    doc.text("¿QUÉ COLORES ME IMAGINO INMEDIATAMENTE?", 190, 125, { maxWidth: 130 });
    datos.descripcion.colores.forEach((hex, i) => {
      const [cr, cg, cb] = hexARgbSlide(hex || "#000000");
      doc.setFillColor(cr, cg, cb);
      doc.circle(196 + i * 20, 145, 6, "F");
      doc.setFontSize(7);
      doc.setTextColor(90);
      doc.text(hex || "#000000", 188 + i * 20, 156);
    });

    // 5. Persona
    nuevaPagina(4);
    doc.setFillColor(...grisClaro);
    doc.rect(0, 0, SLIDE_W, 42, "F");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text("PERSONA", 18, 27);
    doc.setFontSize(13);
    doc.text("ESTE PROYECTO REFLEJA A ESTA PERSONA", 150, 18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.setFontSize(10);
    doc.text(datos.persona.descripcion || "Descripción de la persona", 150, 28, { maxWidth: 175 });
    await agregarImagenCover(doc, datos.persona.imagenIzquierda, 0, 42, SLIDE_W * 0.35, SLIDE_H - 42, negro);
    await agregarImagenCover(
      doc,
      datos.persona.imagenDerecha,
      SLIDE_W * 0.35,
      42,
      SLIDE_W * 0.65,
      SLIDE_H - 42,
      [30, 40, 35]
    );

    // 6. Palabra/Emoción a escoger
    nuevaPagina(5);
    doc.setFillColor(...grisClaro);
    doc.rect(0, 0, SLIDE_W, SLIDE_H, "F");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.text("PALABRA/EMOCIÓN A\nESCOGER", 18, 35);
    const preguntasPalabra: [string, string][] = [
      ["¿QUÉ TEXTURAS REPRESENTAN MEJOR LA IDEA?", datos.palabraEmocion.texturas],
      ["¿QUÉ OBJETOS FÍSICOS PODRÍAN REPRESENTAR MI PROYECTO?", datos.palabraEmocion.objetosFisicos],
      ["¿QUÉ MATERIALES APARECEN EN MI MENTE?", datos.palabraEmocion.materiales],
    ];
    preguntasPalabra.forEach(([label, valor], i) => {
      const [px, py] = i === 1 ? posiciones[1] : posiciones[i === 0 ? 0 : 2];
      doc.setTextColor(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(label, px, py, { maxWidth: 130 });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90);
      doc.setFontSize(10);
      doc.text(valor || "—", px, py + 8, { maxWidth: 130 });
    });

    // 7. Texturas
    nuevaPagina(6);
    {
      const bannerH = 48;
      doc.setFillColor(30, 40, 38);
      doc.rect(0, 0, SLIDE_W, bannerH, "F");
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(30);
      doc.text("TEXTURAS", 18, 30);
      doc.setTextColor(200);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(datos.texturas.justificacion || "Justificación", 150, 30, { maxWidth: 170 });
      const cw = SLIDE_W / 3;
      for (let i = 0; i < 3; i++) {
        await agregarImagenCover(doc, datos.texturas.imagenes[i], i * cw, bannerH, cw, SLIDE_H - bannerH, negro);
      }
    }

    // 8. Ambiente
    nuevaPagina(7);
    {
      const bannerH = 48;
      const imgH = SLIDE_H - bannerH;
      const cw = SLIDE_W / 3;
      for (let i = 0; i < 3; i++) {
        await agregarImagenCover(doc, datos.ambiente.imagenes[i], i * cw, 0, cw, imgH, negro);
      }
      doc.setFillColor(25, 32, 45);
      doc.rect(0, imgH, SLIDE_W, bannerH, "F");
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(30);
      doc.text("AMBIENTE", 18, imgH + 32);
      doc.setTextColor(200);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(datos.ambiente.justificacion || "Justificación", 150, imgH + 32, { maxWidth: 170 });
    }

    // 9. Objeto clave
    nuevaPagina(8);
    {
      doc.setFillColor(22, 30, 28);
      doc.rect(0, 0, SLIDE_W, SLIDE_H, "F");
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(30);
      doc.text("OBJETO CLAVE", 18, 30);
      doc.setTextColor(200);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(datos.objetoClave.justificacion || "Justificación", 200, 30, { maxWidth: 120 });
      const cw = SLIDE_W / 3;
      const top = 48;
      for (let i = 0; i < 3; i++) {
        await agregarImagenCover(doc, datos.objetoClave.items[i]?.imagen, i * cw + 10, top, cw - 20, 90, negro);
        doc.setTextColor(220);
        doc.setFontSize(9);
        doc.text(datos.objetoClave.items[i]?.detalle || "Detalles aquí", i * cw + 10, top + 100);
      }
    }

    // 10. Moodboard
    nuevaPagina(9);
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, SLIDE_W, SLIDE_H, "F");
    if (datos.moodboard.imagen) {
      await agregarImagenCover(doc, datos.moodboard.imagen, 0, 40, SLIDE_W, SLIDE_H - 40, [0, 0, 0]);
    }
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("MOODBOARD", 18, 25);

    // 11. Gracias
    nuevaPagina(10);
    await agregarImagenCover(doc, datos.portada.imagen, 0, 0, SLIDE_W, SLIDE_H, negro);
    doc.setFillColor(0, 0, 0);
    doc.setGState(doc.GState({ opacity: 0.55 }));
    doc.rect(0, 0, SLIDE_W * 0.42, SLIDE_H, "F");
    doc.setGState(doc.GState({ opacity: 1 }));
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(46);
    doc.text("GRACIAS", 18, 60);
    doc.setTextColor(230);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(datos.portada.nombreDirector || "Director/a de arte", 18, 120);
    doc.setFont("helvetica", "bold");
    doc.text("PROPUESTA DE ARTE", 18, 150);

    await finalizarConPiePagina(doc);
    doc.save(`presentacion-arte-${proyectoNombre.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setGenerando(false);
  }

  return (
    <div className="grid gap-6 pb-16">
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-neutral-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Presentación de Arte</h2>
        <div className="flex gap-2">
          <button
            onClick={guardar}
            disabled={pendiente}
            className="rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-hueso disabled:opacity-50"
          >
            {pendiente ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            onClick={descargarPdf}
            disabled={generando}
            className="rounded bg-rojo px-4 py-2 text-sm font-semibold text-hueso hover:brightness-110 disabled:opacity-50"
          >
            {generando ? "Generando..." : "Descargar PDF"}
          </button>
        </div>
      </div>

      {/* 1. Portada */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <ImagenSlot
          proyectoId={proyectoId}
          carpeta="arte-portada"
          value={datos.portada.imagen}
          onChange={(url) => setDatos((d) => ({ ...d, portada: { ...d.portada, imagen: url } }))}
          className="absolute inset-0 h-full w-full"
          placeholder="+ Foto de portada"
        />
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-r from-black/85 via-black/40 to-transparent p-8">
          <div>
            <h1
              className="text-4xl font-extrabold uppercase leading-none tracking-tight"
              style={{ color: rojo }}
            >
              {proyectoNombre}
            </h1>
          </div>
          <div className="grid gap-1">
            <input
              value={datos.portada.nombreDirector}
              onChange={(e) =>
                setDatos((d) => ({ ...d, portada: { ...d.portada, nombreDirector: e.target.value } }))
              }
              placeholder="Nombre del o la director/a de arte"
              className={`${inputTexto} text-neutral-300`}
            />
            <p className="text-lg font-bold uppercase text-hueso">Propuesta de arte</p>
          </div>
        </div>
      </div>

      {/* 2. Emociones para el proyecto */}
      <div className="aspect-video w-full rounded-lg bg-neutral-200 p-8">
        <h2 className="mb-8 text-3xl font-extrabold uppercase leading-none" style={{ color: rojo }}>
          Emociones para el proyecto
        </h2>
        <div className="grid grid-cols-2 gap-x-16 gap-y-8">
          {(
            [
              ["¿Cómo se siente?", "comoSeSiente"],
              ["¿A quién va dirigido?", "aQuienVaDirigido"],
              ["¿Qué emoción transmite?", "queEmocionTransmite"],
              ["Emociones predominantes", "emocionesPredominantes"],
            ] as const
          ).map(([label, campo]) => (
            <div key={campo}>
              <p className="text-xs font-bold uppercase text-negro">{label}</p>
              <textarea
                rows={2}
                value={datos.emociones[campo]}
                onChange={(e) =>
                  setDatos((d) => ({ ...d, emociones: { ...d.emociones, [campo]: e.target.value } }))
                }
                placeholder="Descripción"
                className={`${inputTexto} resize-none text-neutral-600`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Galería */}
      <div className="grid aspect-video w-full grid-cols-3 grid-rows-3 gap-0.5 overflow-hidden rounded-lg bg-black">
        {datos.galeria.map((img, i) => (
          <ImagenSlot
            key={i}
            proyectoId={proyectoId}
            carpeta="arte-galeria"
            value={img}
            onChange={(url) =>
              setDatos((d) => ({ ...d, galeria: d.galeria.map((g, j) => (j === i ? url : g)) }))
            }
            className="h-full"
            placeholder="+"
          />
        ))}
      </div>

      {/* 4. Descripción del proyecto */}
      <div className="aspect-video w-full rounded-lg bg-neutral-200 p-8">
        <h2 className="mb-8 text-3xl font-extrabold uppercase leading-none" style={{ color: rojo }}>
          Descripción del proyecto
        </h2>
        <div className="grid grid-cols-2 gap-x-16 gap-y-8">
          <div>
            <p className="text-xs font-bold uppercase text-negro">Emociones a evitar</p>
            <textarea
              rows={2}
              value={datos.descripcion.emocionesAEvitar}
              onChange={(e) =>
                setDatos((d) => ({ ...d, descripcion: { ...d.descripcion, emocionesAEvitar: e.target.value } }))
              }
              placeholder="Descripción"
              className={`${inputTexto} resize-none text-neutral-600`}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-negro">¿Qué recuerdos o sensaciones debería despertar?</p>
            <textarea
              rows={2}
              value={datos.descripcion.recuerdosOSensaciones}
              onChange={(e) =>
                setDatos((d) => ({
                  ...d,
                  descripcion: { ...d.descripcion, recuerdosOSensaciones: e.target.value },
                }))
              }
              placeholder="Descripción"
              className={`${inputTexto} resize-none text-neutral-600`}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-negro">Si este proyecto fuera una persona, ¿cómo sería?</p>
            <textarea
              rows={2}
              value={datos.descripcion.siFueraPersona}
              onChange={(e) =>
                setDatos((d) => ({ ...d, descripcion: { ...d.descripcion, siFueraPersona: e.target.value } }))
              }
              placeholder="Descripción"
              className={`${inputTexto} resize-none text-neutral-600`}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-negro">¿Qué colores me imagino inmediatamente?</p>
            <div className="flex gap-3">
              {datos.descripcion.colores.map((hex, i) => (
                <div key={i} className="grid gap-1 text-center">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) =>
                      setDatos((d) => ({
                        ...d,
                        descripcion: {
                          ...d.descripcion,
                          colores: d.descripcion.colores.map((c, j) => (j === i ? e.target.value : c)),
                        },
                      }))
                    }
                    className="h-9 w-9 cursor-pointer rounded-full border-0 p-0"
                  />
                  <span className="text-[0.6rem] text-neutral-500">{hex}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Persona */}
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        <div className="flex h-[35%] bg-neutral-200 px-8 py-4">
          <h2 className="flex items-center text-3xl font-extrabold uppercase" style={{ color: rojo }}>
            Persona
          </h2>
          <div className="ml-auto flex max-w-md flex-col justify-center">
            <p className="text-sm font-bold" style={{ color: rojo }}>
              Este proyecto refleja a esta persona
            </p>
            <textarea
              rows={2}
              value={datos.persona.descripcion}
              onChange={(e) => setDatos((d) => ({ ...d, persona: { ...d.persona, descripcion: e.target.value } }))}
              placeholder="Descripción de la persona"
              className={`${inputTexto} resize-none text-neutral-700`}
            />
          </div>
        </div>
        <div className="flex h-[65%] gap-0.5 bg-black">
          <ImagenSlot
            proyectoId={proyectoId}
            carpeta="arte-persona"
            value={datos.persona.imagenIzquierda}
            onChange={(url) => setDatos((d) => ({ ...d, persona: { ...d.persona, imagenIzquierda: url } }))}
            className="h-full w-[35%]"
          />
          <ImagenSlot
            proyectoId={proyectoId}
            carpeta="arte-persona"
            value={datos.persona.imagenDerecha}
            onChange={(url) => setDatos((d) => ({ ...d, persona: { ...d.persona, imagenDerecha: url } }))}
            className="h-full w-[65%]"
            placeholder="+ Collage de objetos"
          />
        </div>
      </div>

      {/* 6. Palabra/Emoción a escoger */}
      <div className="aspect-video w-full rounded-lg bg-neutral-200 p-8">
        <h2 className="mb-8 text-3xl font-extrabold uppercase leading-none" style={{ color: rojo }}>
          Palabra/Emoción a escoger
        </h2>
        <div className="grid grid-cols-2 gap-x-16 gap-y-8">
          {(
            [
              ["¿Qué texturas representan mejor la idea?", "texturas"],
              ["¿Qué objetos físicos podrían representar mi proyecto?", "objetosFisicos"],
              ["¿Qué materiales aparecen en mi mente?", "materiales"],
            ] as const
          ).map(([label, campo]) => (
            <div key={campo}>
              <p className="text-xs font-bold uppercase text-negro">{label}</p>
              <textarea
                rows={2}
                value={datos.palabraEmocion[campo]}
                onChange={(e) =>
                  setDatos((d) => ({ ...d, palabraEmocion: { ...d.palabraEmocion, [campo]: e.target.value } }))
                }
                placeholder="Descripción"
                className={`${inputTexto} resize-none text-neutral-600`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 7. Texturas */}
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        <div className="flex h-[25%] items-center justify-between bg-neutral-900 px-8">
          <h2 className="text-3xl font-extrabold uppercase" style={{ color: rojo }}>
            Texturas
          </h2>
          <input
            value={datos.texturas.justificacion}
            onChange={(e) => setDatos((d) => ({ ...d, texturas: { ...d.texturas, justificacion: e.target.value } }))}
            placeholder="Justificación"
            className={`${inputTexto} max-w-xs text-neutral-300`}
          />
        </div>
        <div className="flex h-[75%] gap-0.5 bg-black">
          {datos.texturas.imagenes.map((img, i) => (
            <ImagenSlot
              key={i}
              proyectoId={proyectoId}
              carpeta="arte-texturas"
              value={img}
              onChange={(url) =>
                setDatos((d) => ({
                  ...d,
                  texturas: { ...d.texturas, imagenes: d.texturas.imagenes.map((im, j) => (j === i ? url : im)) },
                }))
              }
              className="h-full flex-1"
            />
          ))}
        </div>
      </div>

      {/* 8. Ambiente */}
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        <div className="flex h-[75%] gap-0.5 bg-black">
          {datos.ambiente.imagenes.map((img, i) => (
            <ImagenSlot
              key={i}
              proyectoId={proyectoId}
              carpeta="arte-ambiente"
              value={img}
              onChange={(url) =>
                setDatos((d) => ({
                  ...d,
                  ambiente: { ...d.ambiente, imagenes: d.ambiente.imagenes.map((im, j) => (j === i ? url : im)) },
                }))
              }
              className="h-full flex-1"
            />
          ))}
        </div>
        <div className="flex h-[25%] items-center justify-between bg-neutral-900 px-8">
          <h2 className="text-3xl font-extrabold uppercase" style={{ color: rojo }}>
            Ambiente
          </h2>
          <input
            value={datos.ambiente.justificacion}
            onChange={(e) => setDatos((d) => ({ ...d, ambiente: { ...d.ambiente, justificacion: e.target.value } }))}
            placeholder="Justificación"
            className={`${inputTexto} max-w-xs text-neutral-300`}
          />
        </div>
      </div>

      {/* 9. Objeto clave */}
      <div className="aspect-video w-full rounded-lg bg-neutral-900 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-extrabold uppercase" style={{ color: rojo }}>
            Objeto clave
          </h2>
          <input
            value={datos.objetoClave.justificacion}
            onChange={(e) =>
              setDatos((d) => ({ ...d, objetoClave: { ...d.objetoClave, justificacion: e.target.value } }))
            }
            placeholder="Justificación"
            className={`${inputTexto} max-w-xs text-neutral-300`}
          />
        </div>
        <div className="grid grid-cols-3 gap-6">
          {datos.objetoClave.items.map((item, i) => (
            <div key={i} className="grid gap-2">
              <ImagenSlot
                proyectoId={proyectoId}
                carpeta="arte-objeto-clave"
                value={item.imagen}
                onChange={(url) =>
                  setDatos((d) => ({
                    ...d,
                    objetoClave: {
                      ...d.objetoClave,
                      items: d.objetoClave.items.map((it, j) => (j === i ? { ...it, imagen: url } : it)),
                    },
                  }))
                }
                className="aspect-square rounded"
              />
              <input
                value={item.detalle}
                onChange={(e) =>
                  setDatos((d) => ({
                    ...d,
                    objetoClave: {
                      ...d.objetoClave,
                      items: d.objetoClave.items.map((it, j) =>
                        j === i ? { ...it, detalle: e.target.value } : it
                      ),
                    },
                  }))
                }
                className={`${inputTexto} text-neutral-300`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 10. Moodboard */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <ImagenSlot
          proyectoId={proyectoId}
          carpeta="arte-moodboard"
          value={datos.moodboard.imagen}
          onChange={(url) => setDatos((d) => ({ ...d, moodboard: { imagen: url } }))}
          className="absolute inset-0 h-full w-full"
          placeholder="+ Sube la foto de tu moodboard (collage o screenshot)"
        />
        <h2
          className="pointer-events-none absolute left-8 top-6 text-2xl font-extrabold uppercase"
          style={{ color: rojo }}
        >
          Moodboard
        </h2>
      </div>

      {/* 11. Gracias */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <div className="absolute inset-0 h-full w-full">
          {datos.portada.imagen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={datos.portada.imagen} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-r from-black/85 via-black/40 to-transparent p-8">
          <h1 className="text-4xl font-extrabold uppercase leading-none" style={{ color: rojo }}>
            Gracias
          </h1>
          <div className="grid gap-1">
            <p className="text-sm text-neutral-300">{datos.portada.nombreDirector || "Director/a de arte"}</p>
            <p className="text-lg font-bold uppercase text-hueso">Propuesta de arte</p>
          </div>
        </div>
      </div>
    </div>
  );
}
