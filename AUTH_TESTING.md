# Auth Testing

Guia rapida para probar la infraestructura de autenticacion provider-agnostic con Firebase como proveedor activo.

## Modos

### Mock rapido

Usa este modo si solo quieres levantar la app sin Firebase real ni PostgreSQL:

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=4000

DATA_MODE=memory
AUTH_PROVIDER=mock

NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_AUTH_PROVIDER=mock
```

### Firebase real + Prisma

Usa este modo si quieres probar el flujo real:

- login web con Firebase
- envio de bearer token al backend
- verificacion del token con Firebase Admin SDK
- creacion o reutilizacion del usuario local en Prisma

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=4000

DATA_MODE=prisma
AUTH_PROVIDER=firebase
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/encuentralotodo

NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_AUTH_PROVIDER=firebase

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Tambien puedes usar una sola variable para el backend:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={...json completo del service account...}
```

Si usas `FIREBASE_SERVICE_ACCOUNT_JSON`, no necesitas `FIREBASE_CLIENT_EMAIL` ni `FIREBASE_PRIVATE_KEY`.

## Variables obligatorias por escenario

### Obligatoria para Prisma y auth real

- `DATABASE_URL`

### Obligatorias en backend para Firebase Admin

Opcion A:

- `FIREBASE_SERVICE_ACCOUNT_JSON`

Opcion B:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Obligatorias en frontend para Firebase Web

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Recomendadas del config web de Firebase

- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`

## Firebase Storage CORS para uploads directos desde web

Si subes archivos directo desde el navegador con Firebase Storage, el bucket debe aceptar el origen web en CORS. Si no, verás errores como:

- `Response to preflight request doesn't pass access control check`
- `TypeError: Failed to fetch`

Ejemplo de `cors.json` para desarrollo y producción:

Archivo recomendado en este repo:

`tools/firebase/storage.cors.json`

```json
[
  {
    "origin": ["http://localhost:3000", "https://tu-dominio-web.com"],
    "method": ["GET", "HEAD", "POST", "PUT", "OPTIONS"],
    "responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```

Aplicalo al bucket configurado en `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` con una de estas opciones:

```bash
gsutil cors set cors.json gs://TU_BUCKET
```

o con Google Cloud CLI:

```bash
gcloud storage buckets update gs://TU_BUCKET --cors-file=cors.json
```

Luego verifica que el bucket correcto sea el mismo que usa la web y reinicia el frontend si cambiaste variables de entorno.

## Firebase Storage Rules para uploads web

Archivo recomendado en este repo:

`tools/firebase/storage.rules`

Estas reglas permiten:

- lectura publica de imagenes ya publicadas
- escritura solo para usuarios autenticados en Firebase
- branding temporal en `general/business-branding/*` para el flujo de creacion de negocio
- uploads asociados a negocio en `businesses/*`

Publicalas con Firebase CLI desde la raiz del repo:

```bash
firebase deploy --only storage --project ims-app-468aa
```

Si primero quieres seleccionar el proyecto:

```bash
firebase use ims-app-468aa
firebase deploy --only storage
```

Si ya corregiste CORS, puedes dejar ambos cambios aplicados con:

```bash
gcloud storage buckets update gs://ims-app-468aa.firebasestorage.app --cors-file=tools/firebase/storage.cors.json
firebase deploy --only storage --project ims-app-468aa
```

### No necesarias para probar auth

- `RESEND_API_KEY`
- `SENTRY_DSN`
- `GOOGLE_MAPS_API_KEY`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`

## De donde sacar cada valor

### Firebase Web

Firebase Console:

- Project settings
- General
- Your apps
- Web app
- SDK setup and configuration

De ahi salen:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin

Firebase Console:

- Project settings
- Service accounts
- Generate new private key

Del JSON salen:

- `project_id` -> `FIREBASE_PROJECT_ID`
- `client_email` -> `FIREBASE_CLIENT_EMAIL`
- `private_key` -> `FIREBASE_PRIVATE_KEY`

O puedes guardar el JSON completo en `FIREBASE_SERVICE_ACCOUNT_JSON`.

## Setup local recomendado

1. Copia `.env.example` a `.env`.
2. Cambia `DATA_MODE=prisma`.
3. Cambia `AUTH_PROVIDER=firebase`.
4. Cambia `NEXT_PUBLIC_AUTH_PROVIDER=firebase`.
5. Completa `DATABASE_URL`.
6. Completa el bloque `NEXT_PUBLIC_FIREBASE_*`.
7. Completa el bloque `FIREBASE_*` del backend.

## Comandos de preparacion

Si solo quieres probar local rapido sin gestionar migraciones manuales:

```bash
npx prisma db push
npm run prisma:seed
npx prisma generate
```

Luego levanta la app:

```bash
npm run dev:api
npm run dev:web
```

## Checklist end-to-end

1. La web carga sin errores con `NEXT_PUBLIC_AUTH_PROVIDER=firebase`.
2. El login de Firebase devuelve usuario autenticado en el cliente.
3. El frontend adjunta `Authorization: Bearer <id-token>` a las llamadas tRPC.
4. El backend acepta el token y no responde `UNAUTHORIZED`.
5. En la primera llamada autenticada se crea un `User` local si no existe.
6. Tambien se crea un `UserIdentity` con `provider=FIREBASE` y `externalUserId=<uid>`.
7. En llamadas posteriores se reutiliza el mismo usuario local.
8. `ctx.currentUser` contiene `authProvider`, `externalAuthId` y `emailVerified`.
9. Las rutas protegidas siguen funcionando con `ctx.currentUser`.

## Como inspeccionar la base

Puedes abrir Prisma Studio:

```bash
npx prisma studio
```

Revisa:

- tabla `User`
- tabla `UserIdentity`

Lo esperado despues del primer request autenticado:

- un `User` local con `email`, `fullName`, `role`
- un `UserIdentity` con `provider=FIREBASE`
- `externalUserId` igual al `uid` de Firebase
- `userId` apuntando al usuario local correcto

## Errores comunes

### `DATABASE_URL is required`

El backend exige base de datos cuando:

- `DATA_MODE=prisma`
- o `AUTH_PROVIDER` no es `mock`

### `Real auth providers require DATA_MODE=prisma`

Para Firebase real debes usar `DATA_MODE=prisma`.

### `Invalid authentication token`

Normalmente significa una de estas cosas:

- el frontend no esta enviando el bearer token
- el token pertenece a otro proyecto Firebase
- el backend tiene credenciales Admin de otro proyecto
- `FIREBASE_PRIVATE_KEY` quedo mal escapada

### `NEXT_PUBLIC_FIREBASE_* is required`

Si `NEXT_PUBLIC_AUTH_PROVIDER=firebase`, el frontend valida que al menos esten:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
