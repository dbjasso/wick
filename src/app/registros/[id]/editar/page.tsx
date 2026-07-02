import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecordEditor, type RecordData } from "@/components/editor/RecordEditor";

export const metadata = { title: "Editar registro" };

export default async function EditarRegistroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await prisma.record.findUnique({
    where: { id },
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
