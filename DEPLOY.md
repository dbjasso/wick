# Deploy en Vercel

La app está pensada para correr localmente primero (`npm run dev` + Postgres en
Docker). Este documento la deja lista para desplegar en Vercel cuando quieras.
**No hace falta desplegar ahora** — son los pasos para el día que decidas hacerlo.

---

## 1. Requisitos

- Cuenta en Vercel y el proyecto subido a un repo de Git.
- CLI de Vercel (`npm i -g vercel`) o el dashboard web. Ambos sirven.
- Node 20+ (Vercel lo provee; coincide con `engines`/`@types/node` del proyecto).

---

## 2. Base de datos Postgres

Vercel no trae Postgres incluido. Crea una DB managed compatible (sin cambios
de schema — usamos Prisma, que abstrae la conexión):

- **Vercel Postgres** ( desde el dashboard: Storage → Create → Postgres), o
- **Neon** (https://neon.tech —分支免费 tier cómoda para un solo usuario), o
- **Supabase** (https://supabase.com — Postgres managed).

Cualquiera te dará una `DATABASE_URL` con el formato:

```
postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public&sslmode=require&pgbouncer=true
```

Notas:
- Neon/Vercel suelen pedir `?pgbouncer=true` (connection pooling). Prisma 6 lo
  soporta; si usas pooling, agrega también `&connect_timeout=15` si ves timeouts
  en cold starts.
- `sslmode=require` es obligatorio en los managed anteriores.

Copia esa URL — va a las env vars de Vercel (paso 4).

---

## 3. Migraciones de Prisma en producción

El `package.json` ya tiene `postinstall: prisma generate`, así que el client se
regenera solo en cada build de Vercel. Falta **aplicar** las migraciones.

Opción A (recomendada, simple para un solo usuario): correr las migraciones
desde tu máquina apuntando a la DB de producción, una sola vez y luego cuando
cambies el schema:

```bash
DATABASE_URL="<tu DATABASE_URL de prod>" npx prisma migrate deploy
```

`migrate deploy` aplica solo las migraciones pendientes (no es interactivo, es
la correcta para prod — a diferencia de `migrate dev`).

Opción B: agregar `prisma migrate deploy` al build de Vercel para que corra en
cada deploy. Solo si querés que las migraciones se apliquen automáticamente.
Edita el `build` script en `package.json`:

```json
"build": "prisma migrate deploy && next build"
```

(Con pgbouncer, `migrate deploy` puede fallar porque necesita una conexión
directa. Si pasa, crea una segunda env var `DIRECT_URL` sin pooler y úsala en
`schema.prisma`: `directUrl = env("DIRECT_URL")`.)

### Seed (opcional)

`ADMIN_EMAIL` y `ADMIN_PASSWORD_HASH` crean el **admin de plataforma** en DB al
primer login (si aún no hay ningún usuario ADMIN). Los **usuarios de cuenta**
(MEMBER) se crean desde `/admin/accounts` después de iniciar sesión como admin.

Para datos de ejemplo del journal, corré una vez contra prod:

```bash
DATABASE_URL="<prod>" npx prisma db seed
```

---

## 4. Variables de entorno en Vercel

En el dashboard: Project → Settings → Environment Variables. Crear una por cada
variable de `.env.example` (los valores de prod, no los locales):

| Variable | Valor en prod | Notas |
|---|---|---|
| `DATABASE_URL` | URL de Neon/Vercel Postgres | del paso 2 |
| `NEXTAUTH_URL` | `https://<tu-dominio>.vercel.app` | NextAuth la usa para callbacks |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | generar uno nuevo, no reuses el local |
| `ADMIN_EMAIL` | tu email de admin | bootstrap del primer ADMIN en DB |
| `ADMIN_PASSWORD_HASH` | base64 del hash bcrypt | bootstrap del primer ADMIN |
| `ADMIN_TOTP_SECRET` | base32 del secret 2FA | **opcional** — ver abajo |
| `BLOB_READ_WRITE_TOKEN` | token de Vercel Blob | **solo si migrás storage** (paso 5) |

### Generar `ADMIN_PASSWORD_HASH` (producción)

```bash
npm run hash-password
# te pide la password, devuelve el base64 listo para pegar
```

El base64 es necesario porque dotenv-expand corrompería los `$2b$10$...` del
hash bcrypt. `authorize()` lo decodifica antes de comparar.

### `ADMIN_TOTP_SECRET` (2FA opcional)

Si querés 2FA en el login, generá el secret y pegalo:

```bash
npm run totp:setup
# devuelve el secret base32 + la URI otpauth para tu app autenticadora
```

Si lo dejás vacío, el login solo pide email + password. Si lo seteás, el form
pide además un código TOTP de 6 dígitos / 30s (RFC 6238).

> Importante: guardá el secret de la app autenticadora en el mismo lugar seguro
> que `NEXTAUTH_SECRET`. Si lo perdés, regenerate uno nuevo y actualizá la env
> var (las apps autenticadoras viejas dejan de valer).

Marcá todas las env vars para el entorno **Production** (y **Preview** si querés
previsualizaciones funcionales).

---

## 5. Migrar el adaptador de almacenamiento (IMPORTANTE)

**Esto es obligatorio para Vercel.** El adaptador actual (`src/lib/storage.ts`)
escribe al filesystem local (`./uploads/`). Vercel es serverless y **no tiene
disco persistente** entre requests — los archivos subidos se perderían de
inmediato. Hay que migrar a **Vercel Blob** (o S3-compatible).

La buena noticia: el resto del código solo usa la interfaz del adaptador
(`upload` / `getBuffer` / `getStream` / `remove` / `getUrl`), así que el swap no
tocas las rutas ni la UI. Solo cambiás la implementación de `src/lib/storage.ts`.

### Pasos con Vercel Blob

1. Crear un Blob store en el dashboard: Storage → Create → Blob.
2. Copiar `BLOB_READ_WRITE_TOKEN` a las env vars de Vercel.
3. Instalar el SDK: `npm i @vercel/blob`.
4. Reescribir `src/lib/storage.ts` usando `put` / `del` / `head` de `@vercel/blob`:

```ts
import { put, del, head } from "@vercel/blob";

export async function upload(input: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<Uploaded> {
  validateUpload(input.mimeType, input.buffer.length);
  const ext = path.extname(input.filename) || "";
  const key = `${randomUUID()}${ext}`;
  const blob = await put(key, input.buffer, {
    access: "public", // la URL sirve el archivo; ver nota de privacidad abajo
    contentType: input.mimeType,
    addRandomSuffix: false,
  });
  return { key, size: input.buffer.length, mimeType: input.mimeType, url: blob.url };
}

export async function remove(key: string): Promise<void> {
  await del([key]); // o guardar la url completa en el Document
}
```

5. **Privacidad de los documentos:** hoy los archivos se sirven detrás de sesión
   (`GET /api/documents/:id` lee del disco y streamea). Con Blob `access: "public"`,
   la URL es adivinable solo si tenés el UUID, pero no está detrás de login.
   Opciones:
   - **Simple:** mantener `access: "public"` y seguir sirviendo via
     `GET /api/documents/:id`, que ahora redirige (302) a la URL de Blob solo si
     hay sesión. El header `url` del Document se guarda en DB.
   - **Estricta:** usar `access: "public"` + URLs firmadas de corta duración
     (regenerar en cada GET autenticado). Vercel Blob no firma URLs nativamente;
     si necesitás esto, usar S3-compatible (ej. Cloudflare R2) con `getSignedUrl`.

6. El model `Document` guarda `key` (y opcionalmente `url`). Si agregás `url` al
   schema, corré `prisma migrate deploy`.

> Si preferís S3-compatible (R2, Backblaze, AWS S3): mismo patrón con
> `@aws-sdk/client-s3` (`PutObject` / `DeleteObject` / `GetSignedUrl`).

---

## 6. Deploy

1. Push del repo a GitHub/GitLab/Bitbucket.
2. En Vercel: Add New → Project → importar el repo.
3. Confirmar que detecta Next.js (framework preset: Next.js). Build command
   `next build` (o el del paso 3-B si agregaste `migrate deploy`).
4. Las env vars ya están cargadas del paso 4.
5. Deploy. Primera vez: correr `prisma migrate deploy` contra prod (paso 3) si
   no lo metiste en el build.

---

## 7. Verificación post-deploy

- `https://<dominio>/api/health` → `{"status":"ok"}` (ruta pública, sin datos).
- `https://<dominio>/login` → carga el form. Si seteaste `ADMIN_TOTP_SECRET`,
  aparece el campo de código 2FA.
- Login con `ADMIN_EMAIL` + password (+ código 2FA si aplica) → redirige a `/`.
- Crear un registro, asignar tags, subir un documento a un tag (valida el paso 5),
  agregar un todo y un comentario → todo persiste al recargar.
- Headers de seguridad presentes: `curl -I https://<dominio>/` muestra
  `Content-Security-Policy`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.

---

## Checklist rápido

- [ ] Postgres managed creado (Neon/Vercel/Supabase) — `DATABASE_URL` copiada
- [ ] `prisma migrate deploy` corrido contra prod (o en el build)
- [ ] 6 env vars base + `BLOB_READ_WRITE_TOKEN` si migraste storage
- [ ] `NEXTAUTH_SECRET` y `ADMIN_PASSWORD_HASH` regenerados para prod
- [ ] `src/lib/storage.ts` migrado a Vercel Blob / S3
- [ ] `/api/health` y login verificados en el dominio de prod
