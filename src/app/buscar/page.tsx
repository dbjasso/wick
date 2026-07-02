import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Sidebar } from "@/components/ui/Sidebar";
import { BuscarView } from "@/components/BuscarView";

export const dynamic = "force-dynamic";

export default async function BuscarPage() {
  const session = await auth();
  const pendingCount = await prisma.todoItem.count({ where: { checked: false } });

  return (
    <div className="flex min-h-screen">
      <Sidebar email={session?.user?.email} pendingCount={pendingCount} />
      <BuscarView />
    </div>
  );
}
