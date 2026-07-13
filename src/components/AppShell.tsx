"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/ui/MobileNav";
import { NAV_ROUTES, navKeyFromPath, userNameFromEmail } from "@/lib/nav";

export function AppShell({
  children,
  email,
  pendingCount = 0,
  isAdmin = false,
}: {
  children: React.ReactNode;
  email?: string | null;
  pendingCount?: number;
  isAdmin?: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const active = navKeyFromPath(path);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        active={active}
        pendingCount={pendingCount}
        userName={userNameFromEmail(email)}
        isAdmin={isAdmin}
        onLogout={() => signOut({ redirectTo: "/login" })}
      />
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">{children}</div>
      <MobileNav
        active={active}
        pendingCount={pendingCount}
        onNavigate={(key) => router.push(NAV_ROUTES[key])}
        onNewEntry={() => router.push("/registros/nuevo")}
      />
    </div>
  );
}
