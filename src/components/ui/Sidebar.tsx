"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/", label: "Inicio", icon: <IconHome /> },
  { href: "/tags", label: "Tags", icon: <IconTag /> },
  { href: "/pendientes", label: "Pendientes", icon: <IconCheck /> },
  { href: "/buscar", label: "Buscar", icon: <IconSearch /> },
];

export function Sidebar({
  email,
  pendingCount = 0,
}: {
  email?: string | null;
  pendingCount?: number;
}) {
  const path = usePathname();
  const name = email ? email.split("@")[0] : "yo";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <aside className="flex w-[216px] shrink-0 flex-col border-r border-border bg-surface px-3 py-5">
      <div className="mb-6 flex items-center gap-2 px-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-btn bg-text text-sm font-bold text-surface">
          T
        </span>
        <span className="text-sm font-semibold tracking-tight text-text">
          Trail
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map((n) => {
          const active =
            n.href === "/"
              ? path === "/"
              : path === n.href || path.startsWith(n.href + "/");
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2.5 rounded-btn px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-surface-2 font-semibold text-text"
                  : "font-medium text-text-2 hover:bg-surface-2 hover:text-text"
              }`}
            >
              <span className="text-text-3">{n.icon}</span>
              <span className="flex-1">{n.label}</span>
              {n.href === "/pendientes" && pendingCount > 0 && (
                <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-xs font-semibold tabular-nums text-text-2">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-border pt-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-xs font-semibold text-text">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-text">{name}</div>
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/login" })}
            className="text-xs text-text-3 hover:text-text-2"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 7L8 2.5 13.5 7v6a.5.5 0 01-.5.5H10V9H6v4.5H3a.5.5 0 01-.5-.5V7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function IconTag() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3h4l6 6-4 4-6-6V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 8.5l2 2 3-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
