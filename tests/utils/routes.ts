/**
 * Fuente única de rutas E2E, derivada de src/app/ (App Router).
 * Las API routes (/api/*) no se incluyen: no son páginas.
 */

/** Rutas estáticas públicas (sin sesión). */
export const PUBLIC_ROUTES = ["/login"] as const;

/**
 * Rutas de la app autenticada (AppShell + páginas journal).
 * Excluidas a propósito:
 * - /account/change-password → solo si mustChangePassword
 * - /dev/ui → página temporal de design system
 */
export const APP_ROUTES = [
  "/",
  "/tags",
  "/pendientes",
  "/buscar",
  "/registros/nuevo",
  "/account",
  "/admin/accounts",
] as const;

/** Todas las rutas de página estáticas que recorremos en los specs. */
export const ALL_ROUTES = [...PUBLIC_ROUTES, ...APP_ROUTES] as const;

export type AppRoute = (typeof ALL_ROUTES)[number];

/**
 * TODO: rutas dinámicas — necesitan fixtures reales en DB.
 * - /tags/[tag]          → ej. /tags/trabajo (crear tag en seed/setup)
 * - /registros/[id]/editar → ej. /registros/<cuid>/editar
 * Cuando tengas IDs estables, añádelos a APP_ROUTES o a un DYNAMIC_ROUTES
 * poblado en auth.setup.ts desde la API.
 */
export const DYNAMIC_ROUTE_TEMPLATES = [
  "/tags/:tag",
  "/registros/:id/editar",
] as const;

/** Rutas con AppShell (Sidebar + MobileNav). /login y el editor no lo usan igual. */
export const SHELL_ROUTES = [
  "/",
  "/tags",
  "/pendientes",
  "/buscar",
  "/account",
  "/admin/accounts",
] as const;
