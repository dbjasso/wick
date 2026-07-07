import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AppShell } from "@/components/AppShell";
import { TagProfile } from "@/components/TagProfile";
import { fetchTagRecordsPage } from "@/lib/tag-records";

export const dynamic = "force-dynamic";

export default async function TagProfilePage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const session = await auth();
  const { tag: rawName } = await params;
  const name = decodeURIComponent(rawName);

  const [tag, pendingCount] = await Promise.all([
    prisma.tag.findUnique({
      where: { name },
      include: {
        contacts: true,
        importantDates: true,
        documents: true,
        _count: { select: { records: true } },
      },
    }),
    prisma.todoItem.count({ where: { checked: false } }),
  ]);

  if (!tag) notFound();

  const [lastRecord, initialFeed] = await Promise.all([
    prisma.record.findFirst({
      where: { tags: { some: { id: tag.id } } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    fetchTagRecordsPage(tag.id),
  ]);

  return (
    <AppShell email={session?.user?.email} pendingCount={pendingCount}>
      <TagProfile
        tag={{
          id: tag.id,
          name: tag.name,
          color: tag.color,
          description: tag.description,
          count: tag._count.records,
          lastRecordAt: lastRecord?.createdAt.toISOString() ?? null,
          contacts: tag.contacts.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
          })),
          dates: tag.importantDates.map((d) => ({
            id: d.id,
            label: d.label,
            date: d.date.toISOString(),
          })),
          documents: tag.documents.map((d) => ({
            id: d.id,
            filename: d.filename,
            mimeType: d.mimeType,
            size: d.size,
            uploadedAt: d.uploadedAt.toISOString(),
          })),
          initialRecords: initialFeed.items,
          initialCursor: initialFeed.nextCursor,
        }}
      />
    </AppShell>
  );
}
