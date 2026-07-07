import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { AccountView } from "@/components/AccountView";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  const pendingCount = await prisma.todoItem.count({ where: { checked: false } });

  return (
    <AppShell email={session?.user?.email} pendingCount={pendingCount}>
      <AccountView email={session?.user?.email} />
    </AppShell>
  );
}
