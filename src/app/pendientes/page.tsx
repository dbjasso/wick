import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { PendientesView } from "@/components/PendientesView";

export const dynamic = "force-dynamic";

export default async function PendientesPage() {
  const session = await auth();
  const pendingCount = await prisma.todoItem.count({ where: { checked: false } });

  return (
    <AppShell email={session?.user?.email} pendingCount={pendingCount}>
      <PendientesView />
    </AppShell>
  );
}
