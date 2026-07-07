import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { BuscarView } from "@/components/BuscarView";

export const dynamic = "force-dynamic";

export default async function BuscarPage() {
  const session = await auth();
  const pendingCount = await prisma.todoItem.count({ where: { checked: false } });

  return (
    <AppShell email={session?.user?.email} pendingCount={pendingCount}>
      <BuscarView />
    </AppShell>
  );
}
