import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { patchTaskItemChecked } from "@/lib/todos";

const patchSchema = z.object({ checked: z.boolean() });

// PATCH /api/todos/:id — marcar como hecho/pendiente. Actualiza TodoItem.checked
// Y parchea el nodo taskItem correspondiente dentro del content JSON del registro,
// para que abrir el registro muestre el mismo estado.
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
  const { checked } = parsed.data;

  const todo = await prisma.todoItem.findUnique({ where: { id } });
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Parchear el content del registro y persistirlo.
  const record = await prisma.record.findUnique({ where: { id: todo.recordId } });
  if (record) {
    const patched = patchTaskItemChecked(record.content, todo.nodeId, checked);
    if (patched !== null) {
      await prisma.record.update({
        where: { id: record.id },
        data: { content: patched as never },
      });
    }
  }

  const updated = await prisma.todoItem.update({
    where: { id },
    data: { checked },
  });
  return NextResponse.json({ id: updated.id, checked: updated.checked });
}
