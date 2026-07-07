export type NavKey = "home" | "tags" | "todos" | "search";

export const NAV_ROUTES: Record<NavKey, string> = {
  home: "/",
  tags: "/tags",
  todos: "/pendientes",
  search: "/buscar",
};

export function navKeyFromPath(path: string): NavKey {
  if (path.startsWith("/tags")) return "tags";
  if (path.startsWith("/pendientes")) return "todos";
  if (path.startsWith("/buscar")) return "search";
  return "home";
}

export function userNameFromEmail(email?: string | null): string {
  return email ? email.split("@")[0] : "you";
}
