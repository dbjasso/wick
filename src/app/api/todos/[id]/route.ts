import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  patchTaskItemChecked,
  patchTaskItemDueDate,
  dueDateToDb,
} from "@/lib/todos";

const patchSchema = z
  .object({
    checked: z.boolean().optional(),
    // "YYYY-MM-DD" para fijar la fecha, null para quitarla.
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
  })
  .refine((v) => v.checked !== undefined || v.dueDate !== undefined, {
    message: "Nothing to update",
  });

// PATCH /api/todos/:id — actualiza checked y/o dueDate. Mantiene sincronizado el
// nodo taskItem dentro del content JSON del registro, para que el editor muestre
// lo mismo que la lista global de To-dos.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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

  const todo = await prisma.todoItem.findUnique({ where: { id } });
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Parchear el content del registro (checked y/o dueDate) y persistirlo.
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
