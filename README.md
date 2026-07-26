# Preproducción de cine

Sistema para gestionar la preproducción de cortometrajes/largometrajes: crew por departamento,
guion con formato de screenplay que genera escenas automáticamente, y desglose de producción
por escena. Es un proyecto separado del Level CRM (código y base de datos propios).

## Stack

- Next.js (App Router) + TypeScript + Tailwind.
- Supabase (Postgres + Auth + RLS) como backend. Proyecto: `preproduccion-cine` (`xazhzjiijqwhfsejlwww`).
- El esquema y las políticas de RLS están versionados en `supabase/migrations/`.

## Variables de entorno

Crea `.env.local` (no se commitea) con:

```
NEXT_PUBLIC_SUPABASE_URL=https://xazhzjiijqwhfsejlwww.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key del proyecto>
```

## Modelo de permisos

- Cada persona (`personas`) se autentica con su propia cuenta (Supabase Auth).
- Dentro de un proyecto, cada quien tiene uno o más `departamentos` (ej. "AD y Producción").
- Dirección/AD y Producción ven y administran todo el proyecto.
- Cada departamento solo edita lo que le corresponde (su status de confirmación, los elementos
  de desglose de su propio departamento).
- El guion (screenplay) solo lo edita Dirección/AD; el resto del crew lo puede leer.

## Desarrollo local

```
npm install
npm run dev
```

## Estado actual (rebanada 1)

Construido: Proyectos, Crew (alta + confirmaciones + departamentos múltiples), Guion
(editor con formato de escena → genera Escenas automáticamente), Desglose por escena
(categorías estándar de la industria + categorías personalizadas).

Pendiente (siguientes rebanadas): Presupuesto por departamento + exportación PDF/Excel,
Plan de rodaje (vista derivada), Calendario de preproducción (visible para todo el crew),
Junta de producción + Minutas.
