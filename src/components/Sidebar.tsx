"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/pendientes", label: "Pendientes" },
  { href: "/tags", label: "Tags" },
];

export function Sidebar({ email }: { email?: string | null }) {
  const path = usePathname();
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-stone-100/60 px-3 py-5">
      <div className="mb-6 px-2 text-sm font-semibold tracking-tight text-stone-900">
        Registros
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((n) => {
          const active = path === n.href || (n.href !== "/" && path.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-stone-200 text-stone-900"
                  : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-stone-200 pt-3">
        <div className="truncate px-2 pb-2 text-xs text-stone-500" title={email ?? ""}>
          {email}
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
