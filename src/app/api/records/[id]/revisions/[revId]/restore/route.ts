import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { recordForAccount } from "@/lib/account-scope";
import { authorFromEmail, createRevision, findRevision } from "@/lib/revisions";
import { repairTaskItemNodeIds, syncTodoItems } from "@/lib/todos";
import { sanitizeContent } from "@/lib/sanitize";

// POST /api/records/:id/revisions/:revId/restore
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; revId: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id, revId } = await params;
  const existing = await recordForAccount(id, accountId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const revision = await findRevision(id, revId);
  if (!revision) {
    return NextResponse.json({ error: "Revision not found" }, { status: 404 });
  }

  const record = await prisma.record.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const author = authorFromEmail(session.user.email);
  await createRevision({
    recordId: id,
    content: record.content,
    author,
    summary: "antes de restaurar",
  });

  const safeContent = repairTaskItemNodeIds(sanitizeContent(revision.content));
  await prisma.record.update({
    where: { id },
    data: { content: safeContent as never },
  });
  await syncTodoItems(id, safeContent);

  const fresh = await prisma.record.findUnique({
    where: { id },
    include: { tags: true, comments: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(fresh);
}
