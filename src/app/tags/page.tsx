import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Sidebar } from "@/components/ui/Sidebar";
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
    <div className="flex min-h-screen">
      <Sidebar email={session?.user?.email} pendingCount={pendingCount} />
      <main className="flex-1 px-[34px] py-[26px]">
        <div className="mx-auto max-w-[860px]">
          <TagsView tags={rows} />
        </div>
      </main>
    </div>
  );
}
