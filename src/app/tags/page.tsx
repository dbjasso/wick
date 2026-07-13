import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { TagsView } from "@/components/TagsView";
import { getJournalAccountId, pendingTodosWhere } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const session = await auth();
  const accountId = await getJournalAccountId();
  if (!accountId) redirect("/admin/accounts");

  const [tags, pendingCount] = await Promise.all([
    prisma.tag.findMany({
      where: { accountId },
      orderBy: { name: "asc" },
      include: { _count: { select: { records: true } } },
    }),
    prisma.todoItem.count({ where: pendingTodosWhere(accountId) }),
  ]);

  const rows = tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    description: t.description,
    count: t._count.records,
  }));

  return (
    <AppShell
      email={session?.user?.email}
      pendingCount={pendingCount}
      isAdmin={session?.user?.role === "ADMIN"}
    >
      <TagsView tags={rows} />
    </AppShell>
  );
}
