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
    id: "contrato-cliente",
    nombre: "Contrato de producción con cliente",
    cuerpo: `CONTRATO DE PRESTACIÓN DE SERVICIOS DE PRODUCCIÓN AUDIOVISUAL

Contrato que celebran, por una parte, LEVEL PRODUCER ("LA PRODUCTORA"), representada en este acto por su responsable (firma al calce), y por la otra, {{nombre}} ("EL CLIENTE"), en relación con la producción audiovisual denominada "{{proyecto}}" (el "Proyecto"), al tenor de las siguientes cláusulas:

PRIMERA. OBJETO.
LA PRODUCTORA se compromete a prestar a EL CLIENTE los servicios de producción audiovisual necesarios para la realización del Proyecto, conforme a lo acordado entre ambas partes previo a la firma del presente contrato (alcance, locaciones, fechas de grabación y entregables).

SEGUNDA. CONTRAPRESTACIÓN Y FORMA DE PAGO.
El monto total pactado por la prestación de los servicios es de $_________________ M.N., que EL CLIENTE se obliga a cubrir a LA PRODUCTORA de la siguiente forma:

- ____% ($_________________) como anticipo, a más tardar antes de la fecha de grabación agendada.
- ____% ($_________________) contra la entrega del material final editado.

TERCERA. FECHA DE ENTREGA.
LA PRODUCTORA entregará el material final editado dentro de las DOS (2) SEMANAS posteriores a la fecha de grabación, salvo que las partes acuerden un plazo distinto por escrito. Excepción pactada para este Proyecto (si aplica): _________________________________________________

CUARTA. INCUMPLIMIENTO DE PAGO.
En caso de que EL CLIENTE no realice el pago conforme a lo pactado en la cláusula SEGUNDA, LA PRODUCTORA tendrá derecho, sin responsabilidad alguna de su parte, a:
(a) suspender y/o cancelar cualquier grabación pendiente del Proyecto; y
(b) retener la totalidad del material generado (crudo y editado) hasta en tanto EL CLIENTE regularice el pago correspondiente.

QUINTA. CANCELACIÓN POR EL CLIENTE.
Si EL CLIENTE cancela una grabación ya agendada con menos de siete (7) días naturales de anticipación a la fecha programada, el anticipo entregado conforme a la cláusula SEGUNDA no será reembolsable, como compensación por el tiempo, personal y recursos reservados para dicha fecha. Las cancelaciones notificadas con mayor anticipación podrán reprogramarse sin penalización, sujeto a disponibilidad de LA PRODUCTORA.

SEXTA. DERECHOS DE IMAGEN Y USO DEL MATERIAL.
Una vez entregado el material final y cubierta la totalidad del pago pactado, EL CLIENTE contará con los derechos de uso comercial exclusivo del material producido para los fines del Proyecto. LA PRODUCTORA conservará el derecho de utilizar fragmentos del material (crudo o editado) con fines de portafolio, demo reel y promoción de su propio trabajo, salvo que EL CLIENTE solicite confidencialidad de forma expresa y por escrito.

SÉPTIMA. RELACIÓN ENTRE LAS PARTES.
El presente contrato no crea relación laboral, de sociedad ni de representación entre LA PRODUCTORA y EL CLIENTE, ni entre LA PRODUCTORA y el personal que EL CLIENTE llegara a aportar al Proyecto. Ambas partes actúan como contratantes independientes.

OCTAVA. MODIFICACIONES.
Cualquier modificación al presente contrato (alcance, fechas, monto) deberá constar por escrito y ser firmada por ambas partes para tener validez.

NOVENA. JURISDICCIÓN.
Para la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes y tribunales de _________________________________, renunciando a cualquier otro fuero que pudiera corresponderles.

Leído que fue el presente contrato y enteradas las partes de su contenido y alcance legal, lo firman de conformidad:

Fecha: _________________________________
Fecha de grabación acordada: _________________________________


POR EL CLIENTE

Nombre completo / Empresa: _________________________________

Firma: _________________________________


POR LEVEL PRODUCER`,
  },
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
