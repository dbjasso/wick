import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

// PATCH /api/todos/reorder — asigna sortOrder = índice según `ids`.
export async function PATCH(request: Request) {
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
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }
  const { ids } = parsed.data;

  const owned = await prisma.todoItem.findMany({
    where: { id: { in: ids }, record: { accountId } },
    select: { id: true },
  });
  if (owned.length !== ids.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.todoItem.update({ where: { id }, data: { sortOrder: i } }),
    ),
  );

  return NextResponse.json({ ok: true });
}
