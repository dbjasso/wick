import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import { createRecordSchema } from "@/lib/schemas";
import { syncRecordTags } from "@/lib/records";
import { repairTaskItemNodeIds, syncTodoItems } from "@/lib/todos";
import { sanitizeContent } from "@/lib/sanitize";
import { EMPTY_TITLE_DOC } from "@/lib/ensure-title-h1";
import { authorFromEmail, ensureCreatedRevision } from "@/lib/revisions";

const EMPTY_DOC = EMPTY_TITLE_DOC;

// GET /api/records?page=1&limit=20 — lista paginada (date desc, createdAt desc).
export async function GET(request: Request) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));

  const [items, total] = await Promise.all([
    prisma.record.findMany({
      where: { accountId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { tags: true },
    }),
    prisma.record.count({ where: { accountId } }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}

// POST /api/records — crea un registro. content puede ser vacío (autosave
// crea el registro desde el primer guardado, sin requerir contenido completo).
export async function POST(request: Request) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }
  const { date, content, tags } = parsed.data;
  const safeContent = repairTaskItemNodeIds(sanitizeContent(content ?? EMPTY_DOC));

  const record = await prisma.record.create({
    data: {
      date: date ? new Date(date) : new Date(),
      content: safeContent as never,
      accountId,
    },
    include: { tags: true },
  });

  if (tags && tags.length) {
    await syncRecordTags(record.id, tags, accountId);
  }
  await syncTodoItems(record.id, safeContent);
  await ensureCreatedRevision({
    recordId: record.id,
    content: safeContent,
    author: authorFromEmail(session.user.email),
  });

  const fresh = await prisma.record.findUnique({
    where: { id: record.id },
    include: { tags: true, comments: { orderBy: { createdAt: "asc" } }, todoItems: true },
  });
  return NextResponse.json(fresh, { status: 201 });
}
