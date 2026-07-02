import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Sidebar } from "@/components/ui/Sidebar";
import { PendientesView } from "@/components/PendientesView";

export const dynamic = "force-dynamic";

export default async function PendientesPage() {
  const session = await auth();
  const pendingCount = await prisma.todoItem.count({ where: { checked: false } });

  return (
    <div className="flex min-h-screen">
      <Sidebar email={session?.user?.email} pendingCount={pendingCount} />
      <PendientesView />
    </div>
  );
}
