import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { PendientesView } from "@/components/PendientesView";
import { getJournalAccountId, pendingTodosWhere } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PendientesPage() {
  const session = await auth();
  const accountId = await getJournalAccountId();
  if (!accountId) redirect("/admin/accounts");
  const pendingCount = await prisma.todoItem.count({ where: pendingTodosWhere(accountId) });

  return (
    <AppShell
      email={session?.user?.email}
      pendingCount={pendingCount}
      isAdmin={session?.user?.role === "ADMIN"}
    >
      <PendientesView />
    </AppShell>
  );
}
