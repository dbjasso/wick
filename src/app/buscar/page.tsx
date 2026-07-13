import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { BuscarView } from "@/components/BuscarView";
import { getJournalAccountId, pendingTodosWhere } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function BuscarPage() {
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
      <BuscarView />
    </AppShell>
  );
}
