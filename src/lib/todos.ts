import { prisma } from "@/lib/prisma";
import { extractText } from "@/lib/tiptap-text";

type TaskNode = { nodeId: string; text: string; checked: boolean };

// Asigna nodeId únicos si faltan o hay duplicados (p.ej. tras split de TipTap).
export function repairTaskItemNodeIds(content: unknown): unknown {
  const seen = new Set<string>();
  function walk(node: unknown): unknown {
    if (!node || typeof node !== "object") return node;
    const n = node as {
      type?: string;
      attrs?: Record<string, unknown>;
      content?: unknown[];
    };
    let attrs = n.attrs;
    if (n.type === "taskItem") {
      const id = attrs?.nodeId;
      if (typeof id !== "string" || !id || seen.has(id)) {
        attrs = { ...(attrs ?? {}), nodeId: crypto.randomUUID() };
      }
      seen.add((attrs as Record<string, unknown>).nodeId as string);
    }
    const newContent = n.content?.map(walk);
    if (attrs !== n.attrs || newContent !== undefined) {
      return { ...n, attrs, ...(newContent !== undefined ? { content: newContent } : {}) };
    }
    return n;
  }
  return walk(content);
}

// Recorre el JSON de TipTap y recolecta los nodos taskItem con su nodeId,
// texto plano y estado. Los ítems sin nodeId se ignoran (el editor siempre los
// debería asignar, pero defendemos contra JSON incompleto).
export function collectTaskItems(content: unknown): TaskNode[] {
  const out: TaskNode[] = [];
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as {
      type?: string;
      attrs?: Record<string, unknown>;
      content?: unknown[];
    };
    if (n.type === "taskItem" && n.attrs) {
      const nodeId = n.attrs.nodeId;
      if (typeof nodeId === "string" && nodeId) {
        out.push({
          nodeId,
          text: extractText(n.content).trim(),
          checked: !!n.attrs.checked,
        });
      }
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
  }
  walk(content);
  return out;
}

// Sincroniza la tabla TodoItem con los taskItem del content del registro:
// upsert por (recordId, nodeId) y borra los nodeId que ya no existen.
export async function syncTodoItems(recordId: string, content: unknown) {
  const repaired = repairTaskItemNodeIds(content);
  const items = collectTaskItems(repaired);
  const nodeIds = items.map((i) => i.nodeId);

  for (const it of items) {
    await prisma.todoItem.upsert({
      where: { recordId_nodeId: { recordId, nodeId: it.nodeId } },
      create: { recordId, nodeId: it.nodeId, text: it.text, checked: it.checked },
      update: { text: it.text, checked: it.checked },
    });
  }

  // Si nodeIds está vacío, `in: []` no matchea nada => NOT(...) = todos => borra.
  await prisma.todoItem.deleteMany({
    where: { recordId, ...(nodeIds.length ? { NOT: { nodeId: { in: nodeIds } } } : {}) },
  });
}

// Parchea el atributo `checked` del nodo taskItem con `nodeId` dentro del
// content JSON del registro. Devuelve el content mutado (nuevo objeto, sin
// mutar el original) o null si no encuentra el nodo.
export function patchTaskItemChecked(content: unknown, nodeId: string, checked: boolean): unknown {
  function clone(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(clone);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      const copy: Record<string, unknown> = {};
      for (const k in o) copy[k] = clone(o[k]);
      return copy;
    }
    return v;
  }
  function walk(node: unknown): boolean {
    if (!node || typeof node !== "object") return false;
    const n = node as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] };
    if (n.type === "taskItem" && n.attrs?.nodeId === nodeId) {
      n.attrs = { ...n.attrs, checked };
      return true;
    }
    if (Array.isArray(n.content)) {
      for (const c of n.content) if (walk(c)) return true;
    }
    return false;
  }
  const cloned = clone(content);
  if (walk(cloned)) return cloned;
  return null;
}
