# Sistema de Registros (Diario Personal) — Plan de Implementación para Cursor

## Contexto del proyecto

Quiero construir una aplicación web personal de **registros** (NO notas tipo Evernote/Notion,
sino un log/diario donde cada entrada es un **registro** con fecha y hora). Un solo usuario
(yo), acceso restringido con autenticación fuerte.

### Funcionalidad requerida
- Crear registros con texto enriquecido (negritas, listas, títulos, etc. — estilo Evernote).
- Cada registro puede tener múltiples **tags**.
- Filtrar registros por tag (ver todos los registros de un tag).
- Ver registros por fecha (vista tipo calendario/timeline).
- Puedo hacer **N registros por día** (no hay límite, no es "una nota por día").
- Editar registros existentes.
- Agregar comentarios a un registro (un registro puede tener varios comentarios,
  útil para anotar seguimientos sin modificar el contenido original).
- Acceso restringido a un solo usuario, con seguridad robusta (no es una app pública).

## Stack técnico

- **Framework**: Next.js (App Router) + TypeScript
- **Backend**: API Routes / Route Handlers de Next.js (Node.js)
- **Base de datos**: PostgreSQL + Prisma ORM
  - Local: Postgres vía Docker
  - Producción futura: Vercel Postgres / Neon / Supabase (compatible sin cambios de schema)
- **Editor de texto enriquecido**: TipTap (contenido guardado como JSON)
- **Autenticación**: NextAuth.js con Credentials Provider
  - Usuario único definido por variables de entorno (email + hash bcrypt de password)
  - Sesión con cookie segura (httpOnly, secure, sameSite)
  - 2FA (TOTP) como tarea opcional al final
- **Estilos**: Tailwind CSS
- **Despliegue**: local por ahora (`npm run dev`), Vercel más adelante
- **Almacenamiento de documentos** (archivos adjuntos a tags): filesystem local en desarrollo
  (ej. carpeta `/uploads` fuera de `public`, servida por una route handler protegida por
  sesión — nunca en `/public` para que no queden expuestos sin autenticación). Diseñar la
  subida detrás de una función `storage.upload()` / `storage.getUrl()` para poder cambiar de
  adaptador sin tocar el resto del código, porque **en Vercel no hay disco persistente** — al
  desplegar habrá que migrar ese adaptador a Vercel Blob o S3-compatible (esto se documenta en
  la Tarea 9, no hace falta resolverlo ahora).

## Modelo de datos (Prisma)

```prisma
model Record {
  id        String    @id @default(cuid())
  date      DateTime  // fecha "lógica" del registro (puede diferir de createdAt)
  content   Json       // contenido rich text de TipTap
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  tags      Tag[]     @relation("RecordTags")
  comments  Comment[]
  todoItems TodoItem[]
}

model TodoItem {
  id        String   @id @default(cuid())
  nodeId    String   // id estable del nodo del checklist dentro del JSON de TipTap
  text      String   // texto plano extraído del ítem (para listar/buscar sin parsear JSON)
  checked   Boolean  @default(false)
  record    Record   @relation(fields: [recordId], references: [id], onDelete: Cascade)
  recordId  String
  updatedAt DateTime @updatedAt

  @@unique([recordId, nodeId])
}

model Tag {
  id             String        @id @default(cuid())
  name           String        @unique
  description    String?
  records        Record[]      @relation("RecordTags")
  contacts       Contact[]
  importantDates ImportantDate[]
  documents      Document[]
}

model Contact {
  id     String  @id @default(cuid())
  name   String
  email  String?
  phone  String?
  tag    Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId  String
}

model ImportantDate {
  id     String   @id @default(cuid())
  label  String   // ej. "Cumpleaños", "Vencimiento de contrato"
  date   DateTime
  tag    Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId  String
}

model Document {
  id         String   @id @default(cuid())
  filename   String
  url        String   // ruta/URL del archivo almacenado (ver Almacenamiento de archivos)
  mimeType   String
  size       Int
  uploadedAt DateTime @default(now())
  tag        Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId      String
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  record    Record   @relation(fields: [recordId], references: [id], onDelete: Cascade)
  recordId  String
}
```

## Requisitos de seguridad (no negociables)

- Todas las rutas de la app (excepto `/login`) protegidas por middleware que verifica sesión.
- Ninguna API route debe responder sin sesión válida.
- Password guardado SOLO como hash bcrypt (nunca en texto plano), vía variable de entorno.
- Rate limiting en el endpoint de login (máx. intentos por IP/tiempo).
- Cookies de sesión: `httpOnly`, `secure` (en producción), `sameSite=lax`.
- Headers de seguridad básicos (CSP, X-Frame-Options, etc.) vía `next.config.js`.
- Variables sensibles (`DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`)
  solo en `.env.local`, nunca commiteadas (verificar `.gitignore`).

---

## Diseño de UI/UX

Referencia visual: [Untitled UI](https://www.untitledui.com/) — kit de diseño minimal usado en
producto SaaS moderno. Estilo a replicar (no se usa el kit pagado, solo el lenguaje visual):

### Paleta de color

- **Todo el UI es escala de grises** (fondos, bordes, texto, botones, iconos) — sin negro ni
  blanco absolutos, usando tonos cálidos/suaves (ej. de `#FAFAF9` a `#1C1C1A` en vez de
  `#FFFFFF`/`#000000`). Las acciones primarias (botón "Nuevo registro", CTA, foco de inputs) se
  distinguen por el gris más oscuro de la escala + peso tipográfico, no por color.
- **El color es exclusivo de los tags.** Cada tag recibe un color de un set curado de tonos
  suaves/pastel (ej. 8-10 colores agradables, asignados de forma determinística por nombre de
  tag — mismo tag siempre mismo color). El resto de la interfaz nunca usa esos colores.
- Esto mantiene el look minimal y hace que los tags "salten a la vista" como el único acento
  visual — justo lo que necesitas para escanear rápido de qué trata cada registro.

- Mucho whitespace, sin gradientes ni sombras marcadas — bordes finos (1px) en vez de sombras.
- Esquinas redondeadas suaves (8–12px), tipografía sans-serif limpia.
- Tags/etiquetas como "pills" (badges redondeados), cada uno con su color asignado.
- Sidebar de navegación simple con iconos + labels (en escala de grises).
- Cards con borde fino para agrupar contenido, sin relieve pesado.

### Pantallas

**1. Login**
- Sin sidebar. Card centrada (~360px de ancho).
- Input email, input password (toggle mostrar/ocultar), botón primario "Iniciar sesión" (ancho
  completo).
- Error inline si falla, sin popups.

**2. Timeline / Inicio (vista por fecha)**
- Layout: sidebar izquierda (logo, nav: Inicio / Pendientes / Tags / Buscar, avatar+logout al
  fondo) + contenido.
- Header: selector de fecha (día actual por default), flechas ◀ ▶ para navegar días, botón de
  mini-calendario para saltar a fecha específica.
- Botón "Nuevo registro" fijo arriba a la derecha (gris oscuro, la acción más prominente de la
  pantalla) — al hacer clic navega directo a la pantalla de nuevo registro (Tarea 4), NO abre
  modal.
- Lista de registros del día: cada uno como card con hora, preview del contenido, tags como
  pills debajo. Clic en la card lleva al detalle.
- Empty state simple si no hay registros ese día.

**3. Nuevo registro / Editor — pantalla completa, NO modal**
- Página independiente (`/registros/nuevo`), no modal ni panel lateral.
- Header: selector de fecha/hora (default: ahora), y un indicador de estado de guardado en vez
  de botón "Guardar" (ver Autosave abajo). Botón de volver/cerrar a la izquierda.
- Toolbar de formato minimal (negrita, itálica, lista, título) — barra fina arriba del editor.
- Área de texto tipo Evernote (TipTap), sin bordes visibles.
- Campo de tags abajo del contenido, con autocompletado + creación on the fly.

**4. Detalle de registro**
- Misma estructura que el editor pero en modo lectura, con edición inline al hacer clic
  (también autosave, mismo comportamiento que la pantalla de nuevo registro).
- Header: fecha/hora, menú de tres puntos (eliminar).
- Tags como pills clicables (llevan a la vista de ese tag).
- Sección de comentarios: lista cronológica simple + input al final para agregar uno nuevo.

**5. Tags (listado)**
- Grid o lista de todos los tags con contador de registros (ej. "trabajo · 34").
- Clic lleva al perfil de ese tag.

**6. Perfil de tag (detalle + registros filtrados)**
- Header: nombre del tag (con su color), botón editar.
- **Panel de información** arriba (colapsable si está vacío, para no ensuciar la vista de tags
  simples que no lo necesitan):
  - Descripción: texto libre corto.
  - Contacto(s): nombre, email, teléfono — puede haber más de uno (ej. tag de una empresa con
    varios contactos), cada uno como card pequeña.
  - Fechas importantes: lista de "etiqueta + fecha" (ej. "Vencimiento contrato · 15 sep 2026"),
    ordenadas cronológicamente, con indicador visual si ya pasaron.
  - Documentos: lista de archivos adjuntos con nombre, tipo, tamaño y fecha de subida; botón
    para subir uno nuevo; clic descarga/abre el archivo.
- **Lista de registros** debajo, mismo formato de card que el Timeline (todas las fechas, orden
  cronológico inverso).

**7. Pendientes (to-do's)**
- Filtros arriba: estado (Pendiente / Hecho / Todos) y tag (usa los mismos pills de color).
- Lista de ítems: checkbox, texto del to-do, tags heredados del registro (pills), fecha del
  registro, clic navega al registro donde vive ese to-do.
- Marcar el checkbox aquí actualiza tanto el índice como el checklist dentro del registro
  original (quedan sincronizados).
- Empty state si no hay pendientes con los filtros actuales.

**8. (Opcional) Búsqueda rápida (⌘K)**
- Overlay centrado tipo command palette: input arriba, resultados agrupados por tipo
  (registros, tags) abajo.

### Autosave (aplica a Nuevo registro y edición de registro existente)
- Sin botón "Guardar" explícito. El contenido se guarda solo.
- Guardar con debounce (~1-2 segundos después de dejar de escribir), no en cada tecla.
- Al crear un registro nuevo: se crea en el backend en el primer guardado (puede empezar vacío
  o con el primer cambio), y a partir de ahí cada edición hace `PUT`/`PATCH` sobre ese mismo
  registro — no se generan registros duplicados.
- Indicador de estado sutil junto al header: "Guardando…" / "Guardado" (sin toast ni modal),
  desaparece o se queda discreto tras unos segundos.
- Si falla el guardado, mostrar el estado como "Sin guardar — reintentando" en vez de fallar
  silenciosamente.
- El botón "Nuevo registro" en el Timeline simplemente navega a `/registros/nuevo` con un
  editor en blanco; no hay flujo de "confirmar antes de crear".

---

## Instrucciones para Cursor

Implementa este proyecto **tarea por tarea, en el orden indicado**. Al terminar cada tarea:
1. Corre la app / pruebas para confirmar que funciona.
2. Muéstrame un resumen breve de qué se hizo y cómo probarlo.
3. Espera mi validación antes de pasar a la siguiente tarea.

No avances varias tareas de golpe aunque parezca eficiente — necesito poder validar cada paso.

---

### Tarea 0 — Setup del proyecto
- Crear proyecto Next.js (App Router, TypeScript, Tailwind).
- Configurar ESLint + Prettier.
- Configurar Docker Compose con un contenedor de PostgreSQL para desarrollo local.
- Crear `.env.example` con las variables necesarias (sin valores reales).
- Verificar que `npm run dev` levanta la app en blanco correctamente.

**Validación**: la app corre en local, conecta a Postgres (puedes hacer un endpoint `/api/health`
que haga un `SELECT 1`).

---

### Tarea 1 — Modelo de datos con Prisma
- Instalar y configurar Prisma.
- Crear el schema con los modelos `Record`, `Tag`, `Comment`, `Contact`, `ImportantDate`,
  `Document`, `TodoItem` (ver arriba).
- Generar y correr la migración inicial.
- Crear un script de seed simple con 2-3 registros de ejemplo, tags, al menos un tag con
  contacto/descripción/fecha importante, y al menos un registro con un checklist (algunos
  ítems marcados, otros no) para probar Pendientes.

**Validación**: `npx prisma studio` muestra las tablas y los datos de seed.

---

### Tarea 2 — Autenticación (usuario único)
- Configurar NextAuth con Credentials Provider.
- Usuario definido por `ADMIN_EMAIL` y `ADMIN_PASSWORD_HASH` (bcrypt) en `.env.local`.
- Crear script/comando para generar el hash de una contraseña (`npm run hash-password`).
- Página de login simple (`/login`).
- Middleware que protege todas las rutas excepto `/login` y assets públicos.
- Rate limiting básico en el endpoint de login (ej. 5 intentos / 10 min por IP).

**Validación**: no puedo acceder a ninguna página sin login; login funciona con las credenciales
del `.env.local`; tras varios intentos fallidos se bloquea temporalmente.

---

### Tarea 3 — CRUD de registros (API)
- `POST /api/records` — crear registro (date, content). Debe poder crearse con contenido vacío
  para soportar autosave (el registro se crea desde el primer guardado, no requiere contenido
  completo).
- `GET /api/records` — listar registros (con paginación).
- `GET /api/records/:id` — obtener un registro.
- `PATCH /api/records/:id` — actualizar parcialmente (content, date y/o tags) — este es el
  endpoint que usará el autosave, pensado para llamarse frecuentemente.
- `DELETE /api/records/:id` — eliminar registro.
- Todas las rutas validan sesión y validan el body (usar zod).

**Validación**: probar los endpoints con curl/Postman o un script, confirmando que sin sesión
responden 401, y que `PATCH` permite updates parciales sin mandar el objeto completo.

---

### Tarea 4 — Editor de texto enriquecido (UI)
- Integrar TipTap en una página completa `/registros/nuevo` (NO modal, NO panel lateral).
- Toolbar básica: negritas, itálica, listas, títulos, blockquote.
- Selector de fecha para el registro (default: ahora).
- **Autosave**: al escribir, guardar con debounce (~1-2s de inactividad) vía
  `POST`/`PATCH` (ver Tarea 3). El primer guardado crea el registro; los siguientes actualizan
  ese mismo registro. Mostrar indicador discreto de estado ("Guardando…" / "Guardado"), sin
  botón "Guardar" visible.
- Página `/registros/[id]/editar` reutilizando el mismo editor y el mismo comportamiento de
  autosave, precargando el contenido existente.
- El botón "Nuevo registro" del Timeline navega directo a `/registros/nuevo` con editor en
  blanco.

**Validación**: puedo crear un registro escribiendo (sin dar clic a ningún botón de guardar) y
al volver al Timeline el registro ya existe con lo que escribí; editarlo después conserva el
formato y sigue autoguardando.

---

### Tarea 5 — Tags: asignación, listado y perfil
- Al crear/editar un registro, poder agregar tags (autocompletar con tags existentes + crear
  nuevos on the fly).
- Asignar color determinístico por tag (mismo nombre → mismo color siempre, ver paleta arriba).
- API: `GET /api/tags`, `GET /api/tags/:id`, `PATCH /api/tags/:id` (description, contacts,
  importantDates — ver modelos), `POST /api/tags/:id/contacts`, `DELETE
  /api/contacts/:id`, `POST /api/tags/:id/dates`, `DELETE /api/dates/:id`.
- Página `/tags` que lista todos los tags con conteo de registros.
- Página `/tags/[tag]` (perfil de tag): panel de descripción, contactos y fechas importantes
  editables, + lista de registros con ese tag (ver pantalla 6).

**Validación**: crear registros con distintos tags, filtrar por un tag y ver solo los registros
correspondientes; editar la descripción/contacto/fecha de un tag y confirmar que persiste.

---

### Tarea 5b — Documentos adjuntos a tags
- Implementar el adaptador de almacenamiento (`storage.upload()` / `storage.getUrl()`) usando
  filesystem local para desarrollo (ver "Almacenamiento de documentos" arriba).
- `POST /api/tags/:id/documents` — subir archivo (validar tipo y tamaño máximo razonable, ej.
  10-20MB).
- `GET /api/documents/:id` — descargar/servir el archivo (protegido por sesión, nunca público).
- `DELETE /api/documents/:id` — eliminar documento (y su archivo del storage).
- UI en el perfil de tag: lista de documentos + botón de subida + confirmación antes de borrar.

**Validación**: subir un archivo a un tag, verlo listado con su metadata, descargarlo, y
confirmar que sin sesión el endpoint de descarga responde 401.

---

### Tarea 6 — Vista por fecha
- Página principal (`/` o `/registros`) con vista tipo timeline agrupada por día,
  mostrando todos los registros de cada fecha (recordar: puede haber varios por día).
- Selector/calendario para saltar a una fecha específica.
- Navegación simple (día anterior / día siguiente).

**Validación**: puedo navegar por fechas y ver correctamente múltiples registros del mismo día.

---

### Tarea 6b — To-do's: checklist inline + vista global indexada
- Habilitar la extensión de TaskList/TaskItem de TipTap en el editor (Tarea 4), para poder
  escribir checklists dentro del texto libre igual que cualquier otro formato.
- Cada `taskItem` debe tener un `nodeId` estable (generado al crearse el ítem), guardado como
  atributo del nodo en el JSON.
- Al autoguardar un registro (`PATCH /api/records/:id`): además de guardar el `content`,
  parsear el JSON en busca de nodos `taskItem` y sincronizar la tabla `TodoItem`
  (upsert por `recordId` + `nodeId`; eliminar filas cuyo `nodeId` ya no exista en el content,
  por si borraste el ítem del texto).
- `GET /api/todos?status=pending|done&tagId=...` — listar to-do's indexados con filtros.
- `PATCH /api/todos/:id` — marcar como hecho/pendiente: actualiza `TodoItem.checked` Y
  parchea el nodo correspondiente dentro del `content` JSON del registro (para que quede
  igual si abres el registro directamente).
- Página `/pendientes` con los filtros y la lista (ver pantalla 7).

**Validación**: escribir un checklist dentro de un registro, verificar que aparece en
`/pendientes`; marcarlo como hecho desde ahí y confirmar que también se ve marcado al abrir el
registro original; filtrar por tag y por estado.

---

### Tarea 7 — Comentarios en registros
- En la vista de detalle de un registro, sección de comentarios.
- `POST /api/records/:id/comments` — agregar comentario.
- `DELETE /api/comments/:id` — eliminar comentario (opcional).
- Mostrar comentarios ordenados cronológicamente bajo el registro.

**Validación**: agregar varios comentarios a un registro y verificar que persisten y se muestran
en orden.

---

### Tarea 8 — Endurecimiento de seguridad
- Agregar headers de seguridad (CSP, X-Frame-Options, X-Content-Type-Options) en
  `next.config.js`.
- Revisar que todas las API routes validen sesión (auditoría rápida de todas las rutas).
- Sanitizar el HTML/JSON de TipTap antes de guardar (evitar XSS si algún día se abre más acceso).
- Agregar logs básicos de intentos de login fallidos.
- (Opcional) Agregar 2FA con TOTP (ej. librería `otplib`) como segundo factor en el login.

**Validación**: revisar checklist de seguridad manualmente; intentar acceder a rutas protegidas
sin sesión y confirmar 401/redirect en todos los casos.

---

### Tarea 9 — Preparación para deploy en Vercel (a futuro, no ejecutar aún)
- Documentar en un `DEPLOY.md` los pasos para:
  - Crear base de datos Postgres en Vercel/Neon.
  - Configurar variables de entorno en Vercel.
  - Correr migraciones de Prisma en producción.
  - **Migrar el adaptador de almacenamiento de documentos** de filesystem local a Vercel Blob
    (o S3-compatible), ya que Vercel no tiene disco persistente.
- No hace falta desplegar todavía, solo dejar la app lista para cuando decida hacerlo.

**Validación**: revisar que el `DEPLOY.md` tenga todos los pasos claros y que no falte ninguna
variable de entorno en `.env.example`.

---

## Notas finales para Cursor
- Prioriza código simple y mantenible sobre "clever". Es un proyecto personal de un solo usuario.
- Usa TypeScript estricto.
- Comenta brevemente las decisiones no obvias (ej. por qué se guarda `date` separado de
  `createdAt`).
- Si alguna tarea requiere una decisión de diseño no cubierta aquí, pregunta antes de asumir.
