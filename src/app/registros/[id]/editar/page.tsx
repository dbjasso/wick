import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecordEditor, type RecordData } from "@/components/editor/RecordEditor";
import { getJournalAccountId } from "@/lib/session";

export const metadata = { title: "Editar registro" };
export const dynamic = "force-dynamic";

export default async function EditarRegistroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const accountId = await getJournalAccountId();
  if (!accountId) redirect("/admin/accounts");
  const { id } = await params;
  const record = await prisma.record.findFirst({
    where: { id, accountId },
    include: { tags: true, comments: { orderBy: { createdAt: "asc" } } },
  });
  if (!record) notFound();

  const data: RecordData = {
    id: record.id,
    date: record.date.toISOString(),
    content: record.content,
    tags: record.tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    comments: record.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  };
  return <RecordEditor record={data} />;
}
