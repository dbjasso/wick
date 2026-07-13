import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { accountIdFrom, requireAccountSession } from "@/lib/session";
import {
  patchTaskItemChecked,
  patchTaskItemDueDate,
  dueDateToDb,
} from "@/lib/todos";
import { todoForAccount } from "@/lib/account-scope";

const patchSchema = z
  .object({
    checked: z.boolean().optional(),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
  })
  .refine((v) => v.checked !== undefined || v.dueDate !== undefined, {
    message: "Nothing to update",
  });

// PATCH /api/todos/:id — actualiza checked y/o dueDate.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAccountSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = accountIdFrom(session);
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation", details: parsed.error.flatten() }, { status: 400 });
  }
  const { checked, dueDate } = parsed.data;

  const todo = await todoForAccount(id, accountId);
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const record = await prisma.record.findUnique({ where: { id: todo.recordId } });
  if (record) {
    let content: unknown = record.content;
    let changed = false;
    if (checked !== undefined) {
      const p = patchTaskItemChecked(content, todo.nodeId, checked);
      if (p !== null) { content = p; changed = true; }
    }
    if (dueDate !== undefined) {
      const p = patchTaskItemDueDate(content, todo.nodeId, dueDate);
      if (p !== null) { content = p; changed = true; }
    }
    if (changed) {
      await prisma.record.update({
        where: { id: record.id },
        data: { content: content as never },
      });
    }
  }

  const updated = await prisma.todoItem.update({
    where: { id },
    data: {
      ...(checked !== undefined ? { checked } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDateToDb(dueDate) } : {}),
    },
  });
  return NextResponse.json({
    id: updated.id,
    checked: updated.checked,
    dueDate: updated.dueDate ? updated.dueDate.toISOString().slice(0, 10) : null,
  });
}
