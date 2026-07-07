# Trail — UI Redesign (Notion/Evernote level) · v2

Componentes React/Next.js listos para integrar con Cursor. Reemplazan las 5 pantallas actuales.

## Cambios v2 (feedback de Diego)

1. **Bordes más rectos** — escala de radios contenida: 3px (checkboxes, chips) y 6px (botones, tarjetas). Se eliminaron los pills full-rounded; los tags ahora son rectangulares con radio 4px.
2. **Fecha de ejecución en to-dos** — cada to-do tiene un `DueDateButton` al inicio (icono de calendario → chip con fecha, rojo si vencida). Editable en el editor Y en la lista de To-dos; es el mismo dato.
3. **Copy en inglés** — todo el texto de producto está en inglés. Español será seleccionable desde account settings (ver §i18n).
4. **Mobile** — sidebar oculto en `< md`, reemplazado por `MobileNav` (tab bar inferior con "+" central). Layouts responsivos en las 5 pantallas.

## Dirección visual

**Tinta sobre piedra.** Casi monocromo estilo Notion: fondo stone-50, superficies blancas, texto stone-900. Acción primaria negra (ink). Violeta solo para el badge "Today" y foco. Tags = único color libre.

**Tipografía editorial.** Newsreader (serif) para fecha del día y títulos; Inter para UI y cuerpo.

**Timeline con riel de hora** en Home — refuerza el modelo "varios registros por día".

## Integración

### 1. Fuentes (app/layout.tsx)

```tsx
import { Inter, Newsreader } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", style: ["normal", "italic"] });

<html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
```

### 2. Tokens

Copiar `styles/tokens.css` al final de `app/globals.css`. Incluye estilos de checklist TipTap (`.trail-prose`) y el hover del botón de fecha (`.due-date-btn`).

### 3. Dependencias

```bash
npm install lucide-react
```

### 4. Estructura

```
components/
  Sidebar.tsx            — nav desktop (hidden < md)
  DayHeader.tsx          — cabecera editorial del día
  EntryCard.tsx          — tarjeta de registro (timeline)
  ui/
    TagPill.tsx          — tag rectangular, 6 colores
    DueDateButton.tsx    — fecha de ejecución (icono ↔ chip, picker nativo)
    MobileNav.tsx        — tab bar inferior mobile
  screens/
    HomeScreen.tsx
    EditorScreen.tsx     — exporta también <TaskRow /> (patrón del to-do)
    TagsScreen.tsx
    TagProfileScreen.tsx
    TodosScreen.tsx      — antes "Pendientes"
    SearchScreen.tsx     — búsqueda en títulos y contenido, filtro por tag
    ProfileScreen.tsx    — Account: perfil, idioma (EN/ES), sign out
  TagDetails.tsx         — tab Details del perfil de tag (contacts, dates, documents)
```

**Navegación a Account**: el bloque de usuario al fondo del Sidebar (y en mobile, un avatar en el header o long-press del tab) navega a `/account` → ProfileScreen.

**Search**: el snippet resalta el match con `<mark>` (amber suave). En producción, generar el snippet server-side extrayendo texto plano del JSON de TipTap y SANITIZAR antes del `dangerouslySetInnerHTML` (solo permitir `<mark>`).

**Tag Details**: las tres secciones (Contacts, Important dates, Documents) mapean a los modelos del spec de perfiles de tag. Documents usa el storage adapter pattern ya definido (local → Vercel Blob/S3).

### 5. Due dates en TipTap

El modelo: `TaskItem` con atributo `dueDate: string | null` (ISO date).

```ts
import TaskItem from "@tiptap/extension-task-item";

const TaskItemWithDueDate = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      dueDate: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-due-date"),
        renderHTML: (attrs) =>
          attrs.dueDate ? { "data-due-date": attrs.dueDate } : {},
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView); // usa el patrón de <TaskRow />
  },
});
```

`TaskItemView` renderiza: `DueDateButton` (clase `due-date-btn`, + `has-date` si tiene valor) → checkbox → `NodeViewContent`. El botón actualiza el atributo con `updateAttributes({ dueDate })`.

**Prisma**: los to-dos ya se extraen del JSON de TipTap para la vista global; incluir `dueDate` en esa extracción/sync. Al editar la fecha desde TodosScreen, actualizar el atributo del nodo en el documento original (misma mecánica que el toggle de done).

**Agrupación en To-dos**: con due date → agrupar por Overdue / Today / This week / Later; sin due date → por fecha del registro (comportamiento actual).

### 6. Pantallas nuevas

**Tag profile · Details** — tres secciones con datos por tag: Contacts (nombre, rol, tel, email), Important dates (label + fecha, atenuadas si pasaron) y Documents (usa tu storage adapter — el patrón local → Blob/S3 que ya definiste). Cada sección tiene "+ Add" y estado vacío clickeable.

**Search** — server-side sobre título + contenido TipTap (extraer texto plano del JSON o columna `searchText` denormalizada; Postgres `ILIKE` basta para arrancar, `tsvector` si crece). El componente recibe resultados con `snippetBefore/match/snippetAfter` para el resaltado.

**Account (ProfileScreen)** — el selector de idioma persiste en el modelo User (conecta con next-intl, §7). El plan NO maneja pago en la app: `onUpgrade` → crear Stripe Checkout Session y redirect; `onManageBilling` → Stripe Customer Portal. Webhook de Stripe actualiza `user.plan`.

**Signup (SignupScreen)** — un componente para signup y login (`mode`). `onSubmit` conecta con tu endpoint de registro + `signIn("credentials")` de NextAuth. Muestra `error` y `loading` como props.

### 7. i18n

Copy hardcodeado en inglés por ahora. Cuando toque el switch de idioma:
- `next-intl` con `messages/en.json` y `messages/es.json`
- Selector en Account settings, persistido en el modelo User
- Los strings de estos componentes ya están aislados (labels y placeholders como props o literales fáciles de extraer)

### 8. Orden sugerido en Cursor

1. Tokens + fuentes + Sidebar + MobileNav
2. HomeScreen + DayHeader + EntryCard
3. EditorScreen + TaskItemWithDueDate (TipTap)
4. TodosScreen (con edición de due date + sync)
5. TagsScreen + TagProfileScreen (tab Details incluido)
6. SearchScreen (+ query server-side)
7. ProfileScreen + integración Stripe (Checkout, Portal, webhook)
8. SignupScreen (NextAuth) + TagDetails (tab Details)
6. SearchScreen (endpoint de búsqueda + snippets)
7. ProfileScreen (/account, selector de idioma persiste en User)

Checkpoint visual después de cada paso, en desktop y en viewport mobile (390px).
