"use client";

import { useState, useTransition } from "react";
import type { PresentacionDireccionDatos } from "@/lib/types";
import { guardarPresentacion } from "../actions";
import ImagenSlot from "@/components/presentaciones/ImagenSlot";
import { crearDocSlides, agregarImagenCover, hexARgbSlide, SLIDE_W, SLIDE_H } from "@/lib/pdf-slides";
import { finalizarConPiePagina } from "@/lib/pdf-machote";

const inputTexto =
  "w-full border-none bg-transparent p-0 text-sm outline-none placeholder:text-neutral-400 focus:ring-0";

export default function DireccionEditor({
  proyectoId,
  proyectoNombre,
  colorPrimario,
  datosIniciales,
}: {
  proyectoId: string;
  proyectoNombre: string;
  colorPrimario: string;
  datosIniciales: PresentacionDireccionDatos;
}) {
  const [datos, setDatos] = useState(datosIniciales);
  const [pendiente, startTransition] = useTransition();
  const [generando, setGenerando] = useState(false);

  function guardar() {
    startTransition(() => {
      guardarPresentacion(proyectoId, "direccion", datos);
    });
  }

  const rojo = colorPrimario || "#c72a09";

  function agregarUbicacion() {
    setDatos((d) => ({
      ...d,
      ubicaciones: [
        ...d.ubicaciones,
        { titulo: `Ubicación ${d.ubicaciones.length + 1}`, justificacion: "", imagenes: [null, null, null] },
      ],
    }));
  }

  function quitarUbicacion(i: number) {
    setDatos((d) => ({ ...d, ubicaciones: d.ubicaciones.filter((_, j) => j !== i) }));
  }

  function agregarPersonaje() {
    setDatos((d) => ({
      ...d,
      personajes: [...d.personajes, { nombre: "", descripcion: "", imagenIzquierda: null, imagenDerecha: null }],
    }));
  }

  function quitarPersonaje(i: number) {
    setDatos((d) => ({ ...d, personajes: d.personajes.filter((_, j) => j !== i) }));
  }

  async function descargarPdf() {
    setGenerando(true);
    const doc = await crearDocSlides();
    const [r, g, b] = hexARgbSlide(rojo);
    const negro: [number, number, number] = [10, 10, 10];
    const claro: [number, number, number] = [227, 227, 227];
    let primero = true;
    const nuevaPagina = () => {
      if (!primero) doc.addPage();
      primero = false;
    };

    // 1. Portada
    nuevaPagina();
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
    doc.setFont("helvetica", "normal");
    doc.text(datos.portada.logline || "Logline", 18, 120, { maxWidth: SLIDE_W * 0.35 });
    doc.setFont("helvetica", "bold");
    doc.text("MOODBOARD DE CINE", 18, 150);

    // 2. Películas similares
    nuevaPagina();
    doc.setFillColor(...claro);
    doc.rect(0, 0, SLIDE_W * 0.4, SLIDE_H, "F");
    doc.setFillColor(25, 30, 35);
    doc.rect(SLIDE_W * 0.4, 0, SLIDE_W * 0.6, SLIDE_H, "F");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("PELÍCULAS\nSIMILARES\nQUE NOS\nENCANTAN", 18, 40);
    doc.setTextColor(50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(datos.peliculasSimilares.parrafo || "Descripción", 18, 110, { maxWidth: SLIDE_W * 0.32 });
    const cwPos = SLIDE_W * 0.4 + 15;
    const posterW = (SLIDE_W * 0.6 - 45) / 2;
    await agregarImagenCover(doc, datos.peliculasSimilares.imagenes[0], cwPos, 15, posterW, SLIDE_H - 30, negro);
    await agregarImagenCover(
      doc,
      datos.peliculasSimilares.imagenes[1],
      cwPos + posterW + 15,
      15,
      posterW,
      SLIDE_H - 30,
      negro
    );

    // 3. Ubicación (divisor)
    nuevaPagina();
    await agregarImagenCover(doc, datos.ubicacionDivisor.imagen, 0, 0, SLIDE_W, SLIDE_H, negro);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.text("UBICACIÓN", SLIDE_W / 2, SLIDE_H / 2, { align: "center" });

    // 4+. Ubicaciones (banner alterna arriba/abajo)
    for (let i = 0; i < datos.ubicaciones.length; i++) {
      const u = datos.ubicaciones[i];
      nuevaPagina();
      const bannerArriba = i % 2 === 0;
      const bannerH = 42;
      const imgY = bannerArriba ? bannerH : 0;
      const imgH = SLIDE_H - bannerH;
      const cw = SLIDE_W / 3;
      for (let j = 0; j < 3; j++) {
        await agregarImagenCover(doc, u.imagenes[j], j * cw, imgY, cw, imgH, negro);
      }
      const bannerY = bannerArriba ? 0 : imgH;
      doc.setFillColor(25, 32, 30);
      doc.rect(0, bannerY, SLIDE_W, bannerH, "F");
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text(u.titulo.toUpperCase(), 18, bannerY + 26);
      doc.setTextColor(200);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(u.justificacion || "Justificación", 150, bannerY + 26, { maxWidth: 170 });
    }

    // Fotografía (divisor)
    nuevaPagina();
    await agregarImagenCover(doc, datos.fotografiaDivisor.imagen, 0, 0, SLIDE_W, SLIDE_H, negro);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.text("FOTOGRAFÍA", 18, SLIDE_H / 2);

    // Fotografía (detalle)
    nuevaPagina();
    doc.setFillColor(20, 28, 30);
    doc.rect(0, 0, SLIDE_W, SLIDE_H, "F");
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text("FOTOGRAFÍA", 18, 30);
    doc.setTextColor(200);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(datos.fotografia.parrafo || "Descripción", 200, 25, { maxWidth: 120 });
    {
      const cw = SLIDE_W / 3;
      for (let i = 0; i < 3; i++) {
        await agregarImagenCover(doc, datos.fotografia.items[i]?.imagen, i * cw + 10, 48, cw - 20, 100, negro);
        doc.setTextColor(220);
        doc.setFontSize(9);
        doc.text(datos.fotografia.items[i]?.detalle || "Detalles aquí", i * cw + 10, 158);
      }
    }

    // Vestuario (divisor)
    nuevaPagina();
    await agregarImagenCover(doc, datos.vestuarioDivisor.imagen, 0, 0, SLIDE_W, SLIDE_H, negro);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.text("VESTUARIO", SLIDE_W - 18, SLIDE_H / 2, { align: "right" });

    // Personajes
    for (const p of datos.personajes) {
      nuevaPagina();
      doc.setFillColor(...claro);
      doc.rect(0, 0, SLIDE_W, 42, "F");
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(30);
      doc.text("PERSONAJE", 18, 27);
      doc.setFontSize(13);
      doc.text(p.nombre || "Nombre del personaje", 150, 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      doc.setFontSize(10);
      doc.text(p.descripcion || "Descripción del personaje", 150, 28, { maxWidth: 175 });
      await agregarImagenCover(doc, p.imagenIzquierda, 0, 42, SLIDE_W * 0.35, SLIDE_H - 42, negro);
      await agregarImagenCover(doc, p.imagenDerecha, SLIDE_W * 0.35, 42, SLIDE_W * 0.65, SLIDE_H - 42, [30, 35, 45]);
    }

    // Galería final
    nuevaPagina();
    {
      const cols = 4;
      const rows = 3;
      const cw = SLIDE_W / cols;
      const ch = SLIDE_H / rows;
      for (let i = 0; i < cols * rows && i < datos.galeriaFinal.length; i++) {
        const cx = (i % cols) * cw;
        const cy = Math.floor(i / cols) * ch;
        await agregarImagenCover(doc, datos.galeriaFinal[i], cx, cy, cw, ch, negro);
      }
    }

    await finalizarConPiePagina(doc);
    doc.save(`presentacion-direccion-${proyectoNombre.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setGenerando(false);
  }

  return (
    <div className="grid gap-6 pb-16">
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-neutral-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Presentación de Dirección</h2>
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
          carpeta="direccion-portada"
          value={datos.portada.imagen}
          onChange={(url) => setDatos((d) => ({ ...d, portada: { ...d.portada, imagen: url } }))}
          className="absolute inset-0 h-full w-full"
          placeholder="+ Foto de portada"
        />
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-r from-black/85 via-black/40 to-transparent p-8">
          <h1 className="text-4xl font-extrabold uppercase leading-none" style={{ color: rojo }}>
            {proyectoNombre}
          </h1>
          <div className="grid gap-1">
            <textarea
              rows={2}
              value={datos.portada.logline}
              onChange={(e) => setDatos((d) => ({ ...d, portada: { ...d.portada, logline: e.target.value } }))}
              placeholder="Logline"
              className={`${inputTexto} resize-none text-neutral-300`}
            />
            <p className="text-lg font-bold uppercase text-hueso">Moodboard de cine</p>
          </div>
        </div>
      </div>

      {/* 2. Películas similares que nos encantan */}
      <div className="aspect-video w-full overflow-hidden rounded-lg">
        <div className="flex h-full">
          <div className="flex w-[40%] flex-col justify-between bg-neutral-200 p-8">
            <h2 className="text-2xl font-extrabold uppercase leading-none" style={{ color: rojo }}>
              Películas similares que nos encantan
            </h2>
            <textarea
              rows={5}
              value={datos.peliculasSimilares.parrafo}
              onChange={(e) =>
                setDatos((d) => ({
                  ...d,
                  peliculasSimilares: { ...d.peliculasSimilares, parrafo: e.target.value },
                }))
              }
              placeholder="Descripción"
              className={`${inputTexto} resize-none text-neutral-600`}
            />
          </div>
          <div className="flex w-[60%] gap-2 bg-neutral-900 p-4">
            {datos.peliculasSimilares.imagenes.map((img, i) => (
              <ImagenSlot
                key={i}
                proyectoId={proyectoId}
                carpeta="direccion-peliculas"
                value={img}
                onChange={(url) =>
                  setDatos((d) => ({
                    ...d,
                    peliculasSimilares: {
                      ...d.peliculasSimilares,
                      imagenes: d.peliculasSimilares.imagenes.map((im, j) => (j === i ? url : im)),
                    },
                  }))
                }
                className="h-full flex-1 rounded"
                placeholder="+ Póster"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Ubicación (divisor) */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <ImagenSlot
          proyectoId={proyectoId}
          carpeta="direccion-ubicacion-divisor"
          value={datos.ubicacionDivisor.imagen}
          onChange={(url) => setDatos((d) => ({ ...d, ubicacionDivisor: { imagen: url } }))}
          className="absolute inset-0 h-full w-full opacity-70"
          placeholder="+ Imagen de fondo"
        />
        <h2
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-4xl font-extrabold uppercase"
          style={{ color: rojo }}
        >
          Ubicación
        </h2>
      </div>

      {/* 4+. Ubicaciones repetibles */}
      {datos.ubicaciones.map((u, i) => {
        const bannerArriba = i % 2 === 0;
        return (
          <div key={i} className="aspect-video w-full overflow-hidden rounded-lg">
            <div className={`flex h-full flex-col ${bannerArriba ? "" : "flex-col-reverse"}`}>
              <div className="flex h-[22%] items-center justify-between gap-4 bg-neutral-900 px-8">
                <input
                  value={u.titulo}
                  onChange={(e) =>
                    setDatos((d) => ({
                      ...d,
                      ubicaciones: d.ubicaciones.map((it, j) => (j === i ? { ...it, titulo: e.target.value } : it)),
                    }))
                  }
                  className={`${inputTexto} max-w-[10rem] text-2xl font-extrabold uppercase`}
                  style={{ color: rojo }}
                />
                <input
                  value={u.justificacion}
                  onChange={(e) =>
                    setDatos((d) => ({
                      ...d,
                      ubicaciones: d.ubicaciones.map((it, j) =>
                        j === i ? { ...it, justificacion: e.target.value } : it
                      ),
                    }))
                  }
                  placeholder="Justificación"
                  className={`${inputTexto} max-w-xs text-neutral-300`}
                />
                <button
                  onClick={() => quitarUbicacion(i)}
                  className="shrink-0 text-xs text-neutral-500 hover:text-rojo"
                >
                  Quitar
                </button>
              </div>
              <div className="flex h-[78%] gap-0.5 bg-black">
                {u.imagenes.map((img, j) => (
                  <ImagenSlot
                    key={j}
                    proyectoId={proyectoId}
                    carpeta={`direccion-ubicacion-${i}`}
                    value={img}
                    onChange={(url) =>
                      setDatos((d) => ({
                        ...d,
                        ubicaciones: d.ubicaciones.map((it, k) =>
                          k === i ? { ...it, imagenes: it.imagenes.map((im, l) => (l === j ? url : im)) } : it
                        ),
                      }))
                    }
                    className="h-full flex-1"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <button
        onClick={agregarUbicacion}
        className="justify-self-start rounded border border-dashed border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-500 hover:border-rojo hover:text-rojo"
      >
        + Agregar otra ubicación
      </button>

      {/* Fotografía (divisor) */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <ImagenSlot
          proyectoId={proyectoId}
          carpeta="direccion-fotografia-divisor"
          value={datos.fotografiaDivisor.imagen}
          onChange={(url) => setDatos((d) => ({ ...d, fotografiaDivisor: { imagen: url } }))}
          className="absolute inset-0 h-full w-full opacity-70"
          placeholder="+ Imagen de fondo"
        />
        <h2
          className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-4xl font-extrabold uppercase"
          style={{ color: rojo }}
        >
          Fotografía
        </h2>
      </div>

      {/* Fotografía (detalle) */}
      <div className="aspect-video w-full rounded-lg bg-neutral-900 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-extrabold uppercase" style={{ color: rojo }}>
            Fotografía
          </h2>
          <textarea
            rows={2}
            value={datos.fotografia.parrafo}
            onChange={(e) =>
              setDatos((d) => ({ ...d, fotografia: { ...d.fotografia, parrafo: e.target.value } }))
            }
            placeholder="Descripción"
            className={`${inputTexto} max-w-md resize-none text-neutral-300`}
          />
        </div>
        <div className="grid grid-cols-3 gap-6">
          {datos.fotografia.items.map((item, i) => (
            <div key={i} className="grid gap-2">
              <ImagenSlot
                proyectoId={proyectoId}
                carpeta="direccion-fotografia"
                value={item.imagen}
                onChange={(url) =>
                  setDatos((d) => ({
                    ...d,
                    fotografia: {
                      ...d.fotografia,
                      items: d.fotografia.items.map((it, j) => (j === i ? { ...it, imagen: url } : it)),
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
                    fotografia: {
                      ...d.fotografia,
                      items: d.fotografia.items.map((it, j) =>
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

      {/* Vestuario (divisor) */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <ImagenSlot
          proyectoId={proyectoId}
          carpeta="direccion-vestuario-divisor"
          value={datos.vestuarioDivisor.imagen}
          onChange={(url) => setDatos((d) => ({ ...d, vestuarioDivisor: { imagen: url } }))}
          className="absolute inset-0 h-full w-full"
          placeholder="+ Imagen de fondo"
        />
        <h2
          className="pointer-events-none absolute bottom-10 right-8 text-4xl font-extrabold uppercase"
          style={{ color: rojo }}
        >
          Vestuario
        </h2>
      </div>

      {/* Personajes repetibles */}
      {datos.personajes.map((p, i) => (
        <div key={i} className="aspect-video w-full overflow-hidden rounded-lg">
          <div className="flex h-[35%] bg-neutral-200 px-8 py-4">
            <h2 className="flex items-center text-3xl font-extrabold uppercase" style={{ color: rojo }}>
              Personaje
            </h2>
            <div className="ml-auto flex max-w-md flex-col justify-center gap-1">
              <input
                value={p.nombre}
                onChange={(e) =>
                  setDatos((d) => ({
                    ...d,
                    personajes: d.personajes.map((it, j) => (j === i ? { ...it, nombre: e.target.value } : it)),
                  }))
                }
                placeholder="Nombre del personaje"
                className={`${inputTexto} font-bold`}
                style={{ color: rojo }}
              />
              <textarea
                rows={2}
                value={p.descripcion}
                onChange={(e) =>
                  setDatos((d) => ({
                    ...d,
                    personajes: d.personajes.map((it, j) =>
                      j === i ? { ...it, descripcion: e.target.value } : it
                    ),
                  }))
                }
                placeholder="Descripción del personaje"
                className={`${inputTexto} resize-none text-neutral-700`}
              />
              <button
                onClick={() => quitarPersonaje(i)}
                className="justify-self-end text-xs text-neutral-500 hover:text-rojo"
              >
                Quitar personaje
              </button>
            </div>
          </div>
          <div className="flex h-[65%] gap-0.5 bg-black">
            <ImagenSlot
              proyectoId={proyectoId}
              carpeta={`direccion-personaje-${i}`}
              value={p.imagenIzquierda}
              onChange={(url) =>
                setDatos((d) => ({
                  ...d,
                  personajes: d.personajes.map((it, j) => (j === i ? { ...it, imagenIzquierda: url } : it)),
                }))
              }
              className="h-full w-[35%]"
            />
            <ImagenSlot
              proyectoId={proyectoId}
              carpeta={`direccion-personaje-${i}`}
              value={p.imagenDerecha}
              onChange={(url) =>
                setDatos((d) => ({
                  ...d,
                  personajes: d.personajes.map((it, j) => (j === i ? { ...it, imagenDerecha: url } : it)),
                }))
              }
              className="h-full w-[65%]"
              placeholder="+ Collage de objetos"
            />
          </div>
        </div>
      ))}
      <button
        onClick={agregarPersonaje}
        className="justify-self-start rounded border border-dashed border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-500 hover:border-rojo hover:text-rojo"
      >
        + Agregar otro personaje
      </button>

      {/* Galería final */}
      <div className="grid aspect-video w-full grid-cols-4 grid-rows-3 gap-0.5 overflow-hidden rounded-lg bg-black">
        {datos.galeriaFinal.map((img, i) => (
          <ImagenSlot
            key={i}
            proyectoId={proyectoId}
            carpeta="direccion-galeria-final"
            value={img}
            onChange={(url) =>
              setDatos((d) => ({ ...d, galeriaFinal: d.galeriaFinal.map((g, j) => (j === i ? url : g)) }))
            }
            className="h-full"
            placeholder="+"
          />
        ))}
      </div>
    </div>
  );
}
