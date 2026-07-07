import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { TagsView } from "@/components/TagsView";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const session = await auth();

  const [tags, pendingCount] = await Promise.all([
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { records: true } } },
    }),
    prisma.todoItem.count({ where: { checked: false } }),
  ]);

  const rows = tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    description: t.description,
    count: t._count.records,
  }));

  return (
    <AppShell email={session?.user?.email} pendingCount={pendingCount}>
      <TagsView tags={rows} />
    </AppShell>
  );
}
