/** Primer bloque del doc TipTap: siempre heading level 1 (título de la nota). */

import type { JSONContent } from "@tiptap/core";

export const EMPTY_TITLE_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "heading", attrs: { level: 1 } }],
};

function asKids(content: unknown): JSONContent[] {
  const root = content as { type?: string; content?: unknown[] } | null;
  return root && Array.isArray(root.content)
    ? (root.content as JSONContent[])
    : [];
}

/**
 * Garantiza `doc > heading(level:1) + block*`.
 * - heading → fuerza level 1
 * - paragraph / blockquote → convierte a h1 (conserva inline)
 * - otro (lista, hr, …) → prepend h1 vacío
 */
export function ensureTitleH1(content: unknown): JSONContent {
  const kids = asKids(content).map((n) => ({ ...n }));

  if (kids.length === 0) {
    return {
      type: "doc",
      content: [{ type: "heading", attrs: { level: 1 } }],
    };
  }

  const first = kids[0]!;
  if (first.type === "heading") {
    kids[0] = {
      ...first,
      attrs: { ...first.attrs, level: 1 },
    };
    return { type: "doc", content: kids };
  }

  if (first.type === "paragraph" || first.type === "blockquote") {
    kids[0] = {
      type: "heading",
      attrs: { level: 1 },
      ...(first.content ? { content: first.content } : {}),
    };
    return { type: "doc", content: kids };
  }

  // ponytail: no aplastamos listas/hr — prepend. Ceiling: título vacío hasta
  // que el usuario escriba. Upgrade: promover el primer textblock anidado.
  kids.unshift({ type: "heading", attrs: { level: 1 } });
  return { type: "doc", content: kids };
}
