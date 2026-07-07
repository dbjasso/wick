"use client";

import { Home, Tag, CheckSquare, Search, Plus } from "lucide-react";

type NavKey = "home" | "tags" | "todos" | "search";

/* Barra inferior para mobile (visible < md).
   El "+" central es la acción primaria — igual jerarquía que
   "New entry" en el sidebar de desktop. */

export function MobileNav({
  active = "home",
  pendingCount = 0,
  onNavigate,
  onNewEntry,
}: {
  active?: NavKey;
  pendingCount?: number;
  onNavigate?: (key: NavKey) => void;
  onNewEntry?: () => void;
}) {
  const Item = ({
    k,
    label,
    icon: Icon,
    badge,
  }: {
    k: NavKey;
    label: string;
    icon: typeof Home;
    badge?: number;
  }) => {
    const isActive = active === k;
    return (
      <button
        onClick={() => onNavigate?.(k)}
        className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
          isActive ? "text-stone-900" : "text-stone-400"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} />
        {label}
        {!!badge && (
          <span className="absolute right-1/2 top-1 translate-x-4 rounded bg-stone-900 px-1 text-[9px] leading-4 text-white tabular-nums">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center border-t border-stone-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <Item k="home" label="Home" icon={Home} />
      <Item k="tags" label="Tags" icon={Tag} />

      {/* Acción primaria */}
      <button
        onClick={onNewEntry}
        aria-label="New entry"
        className="mx-2 -mt-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-stone-900 text-white shadow-lg transition active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Item k="todos" label="To-dos" icon={CheckSquare} badge={pendingCount} />
      <Item k="search" label="Search" icon={Search} />
    </nav>
  );
}
