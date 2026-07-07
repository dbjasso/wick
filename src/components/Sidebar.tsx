"use client";

import { Home, Tag, CheckSquare, Search, Plus, LogOut } from "lucide-react";
import type { NavKey } from "@/lib/nav";

const NAV: { key: NavKey; label: string; icon: typeof Home; shortcut?: string }[] = [
  { key: "home", label: "Home", icon: Home, shortcut: "H" },
  { key: "tags", label: "Tags", icon: Tag, shortcut: "T" },
  { key: "todos", label: "To-dos", icon: CheckSquare, shortcut: "P" },
  { key: "search", label: "Search", icon: Search, shortcut: "⌘K" },
];

export function Sidebar({
  active = "home",
  pendingCount = 0,
  userName = "you",
  onNavigate,
  onNewEntry,
  onAccount,
  onLogout,
}: {
  active?: NavKey;
  pendingCount?: number;
  userName?: string;
  onNavigate?: (key: NavKey) => void;
  onNewEntry?: () => void;
  onAccount?: () => void;
  onLogout?: () => void;
}) {
  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-stone-200/70 bg-stone-50 px-3 py-4 md:flex">
      <div className="flex items-center gap-2.5 px-2 pb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-900 font-display text-sm text-white">
          T
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-stone-900">Trail</span>
      </div>

      <button
        type="button"
        onClick={onNewEntry}
        className="mb-4 flex items-center justify-center gap-1.5 rounded-md bg-stone-900 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" />
        New entry
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ key, label, icon: Icon, shortcut }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate?.(key)}
              className={`group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition ${
                isActive
                  ? "bg-stone-200/60 font-medium text-stone-900"
                  : "text-stone-600 hover:bg-stone-200/40 hover:text-stone-900"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isActive ? "text-stone-900" : "text-stone-400 group-hover:text-stone-600"}`}
              />
              <span className="flex-1 text-left">{label}</span>
              {key === "todos" && pendingCount > 0 ? (
                <span className="rounded-sm bg-stone-200 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-stone-600">
                  {pendingCount}
                </span>
              ) : (
                shortcut && (
                  <kbd className="hidden rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] text-stone-400 group-hover:inline">
                    {shortcut}
                  </kbd>
                )
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-stone-200/40">
        <button
          type="button"
          onClick={onAccount}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-stone-200 text-[11px] font-semibold uppercase text-stone-600">
            {userName.slice(0, 2)}
          </div>
          <span className="truncate text-sm font-medium text-stone-800">{userName}</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="text-stone-400 transition hover:text-stone-700"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
