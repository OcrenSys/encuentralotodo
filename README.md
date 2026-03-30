# EncuentraloTodo

MVP de marketplace local orientado a discovery de negocios, productos y promociones con conversión por WhatsApp.

## Stack

- Nx monorepo
- Web: Next.js App Router, React, TypeScript, Tailwind CSS, Radix UI, Sonner
- Mobile: Expo / React Native
- API: Express + tRPC + Zod
- Data: Prisma + PostgreSQL, con modo local en memoria para desarrollo rápido
- Auth: patrón Adapter/Provider con Firebase, Cognito y modo mock
- Infra e integraciones: S3, Resend, Google Maps, Sentry, OpenTelemetry

## Estructura

- `apps/web`: discovery web mobile-first, perfil de negocio, alta de negocio y panel admin
- `apps/api`: backend tRPC con routers `auth`, `business`, `product`, `promotion`, `review`, `admin`
- `apps/mobile`: app Expo inicial enfocada en discovery + WhatsApp
- `packages/ui`: componentes base del sistema visual
- `packages/types`: contratos del dominio, enums, Zod schemas y seed data
- `packages/config`: tokens de diseño y env parsing
- `packages/auth`: adapter/provider para auth
- `packages/utils`: utilidades compartidas
- `prisma/schema.prisma`: modelo PostgreSQL del MVP

## Flujos MVP implementados

1. Crear negocio desde la web en `/submit-business`
2. Revisar y aprobar negocio desde `/admin`
3. Visualizar negocio aprobado en `/business/[id]`
4. Contactar directamente por WhatsApp desde cards y perfil

## Reglas del negocio

- Los negocios creados por usuarios entran como `PENDING`
- Un `ADMIN`, `SUPERADMIN` o `GLOBALADMIN` aprueba la publicación
- `FREE_TRIAL`: máximo 5 productos destacados
- `PREMIUM`: catálogo visible limitado
- `PREMIUM_PLUS`: catálogo completo
- Cada negocio tiene 1 owner y múltiples managers

## Desarrollo local

1. Instala dependencias con `npm install`
2. Copia `.env.example` a `.env` y ajusta valores
3. Ejecuta la API con `npm run dev:api`
4. Ejecuta la web con `npm run dev:web`
5. Ejecuta mobile con `npm run dev:mobile`

## Base de datos

- El backend corre por defecto con `DATA_MODE=memory` para tener un flujo funcional sin depender de una base local.
- Para pasar a PostgreSQL, define `DATABASE_URL`, ejecuta `npm run prisma:generate` y usa el esquema de `prisma/schema.prisma`.
- El seed compartido está en `prisma/seed.ts`.

## CI/CD

- `pull_request`: lint + typecheck + test
- `dev`: despliegue development
- `staging`: despliegue staging
- `main`: despliegue production

La web está preparada para Vercel. Como alternativa low-cost para desplegar API y web fuera de Vercel, una opción razonable para este MVP es Railway o Coolify.

## Excluido del MVP

- cupones avanzados
- royalty
- tasa de cambio
- vacantes / jobs