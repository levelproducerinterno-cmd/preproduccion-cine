// Documentos ya listos para usar en cualquier proyecto, sin tener que
// crearlos/copiarlos a mano cada vez. Usan los mismos placeholders que los
// documentos personalizados ({{nombre}} y {{proyecto}}), reemplazados por
// DocumentoPdfBoton al generar el PDF.
export type DocumentoPredeterminado = {
  id: string;
  nombre: string;
  cuerpo: string;
};

export const DOCUMENTOS_PREDETERMINADOS: DocumentoPredeterminado[] = [
  {
    id: "autorizacion-talento",
    nombre: "Autorización de uso de imagen y participación como talento",
    cuerpo: `Yo, {{nombre}}, mayor de edad, en pleno uso de mis facultades, por medio del presente documento manifiesto mi voluntad libre y expresa de participar como talento/extra en la producción audiovisual "{{proyecto}}".

En este acto, AUTORIZO de manera expresa, gratuita e irrevocable a la producción de "{{proyecto}}" y a quien ésta designe, para:

1. Captar, grabar y fotografiar mi imagen, voz y participación durante el rodaje de la producción antes mencionada.

2. Usar, reproducir, editar, distribuir, exhibir y promocionar dicho material en cualquier medio conocido o por conocerse (incluyendo, de forma enunciativa mas no limitativa: cine, televisión, plataformas digitales, redes sociales y publicidad), sin restricción de tiempo ni territorio.

3. Utilizar el material resultante con fines de exhibición, promoción y/o comercialización del proyecto, sin que ello genere derecho a compensación adicional a la acordada (en su caso) al momento de mi participación.

Declaro que mi participación es completamente voluntaria, que no fui sujeto a ningún tipo de coacción, y que renuncio a cualquier reclamación presente o futura relacionada con el uso de mi imagen conforme a lo aquí autorizado.

Firmo de conformidad:

Nombre completo: _________________________________

Firma: _________________________________

Fecha: _________________________________

Teléfono (opcional): _________________________________`,
  },
];
