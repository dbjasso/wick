// Sanitización del contenido TipTap (JSON) antes de persistirlo.
// Defense-in-depth contra XSS stored: aunque el editor sólo produce nodos del
// schema, la API acepta JSON arbitrario (un atacante con sesión podría POSTear
// nodos maliciosos). Acá filtramos a un allowlist de tipos/atributos/marks y
// saneamos hrefs de links (bloqueando javascript:/data: etc.).
//
// ponytail: allowlist manual atado al set de extensiones que usamos. Ceiling: si
// se agregan nuevas extensiones al editor, hay que acordarse de sumar sus tipos
// acá o el contenido nuevo se descarta al guardar. Upgrade: validar contra el
// schema real de TipTap (Node.fromJSON con el schema del editor) en el servidor.

import { ensureTitleH1 } from "@/lib/ensure-title-h1";

const ALLOWED_NODES = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
  "taskList",
  "taskItem",
]);

const ALLOWED_MARKS = new Set(["bold", "italic", "strike", "code", "link"]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const trimmed = href.trim();
  // Permitir http(s), mailto, tel. Bloquear javascript:, data:, vbscript:, etc.
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  // Relativas/anchors (sin protocolo) también ok.
  if (/^(\/|\.\/|\.\.\/|#)/.test(trimmed) || !/:/.test(trimmed)) return trimmed;
  return null;
}

function sanitizeAttrs(type: string, attrs: unknown): Record<string, unknown> | undefined {
  if (!isPlainObject(attrs)) return undefined;
  const out: Record<string, unknown> = {};
  if (type === "heading") {
    const lvl = attrs.level;
    if (typeof lvl === "number" && lvl >= 1 && lvl <= 6) out.level = lvl;
  } else if (type === "taskItem") {
    if (typeof attrs.checked === "boolean") out.checked = attrs.checked;
    if (typeof attrs.nodeId === "string") out.nodeId = attrs.nodeId;
    // Fecha de ejecución opcional (solo día). Solo aceptamos "YYYY-MM-DD".
    if (typeof attrs.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(attrs.dueDate)) {
      out.dueDate = attrs.dueDate;
    }
  } else if (type === "link") {
    const href = safeHref(attrs.href);
    if (href) out.href = href;
  }
  return out;
}

function sanitizeMarks(marks: unknown): unknown[] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const out: unknown[] = [];
  for (const m of marks) {
    if (!isPlainObject(m) || typeof m.type !== "string") continue;
    if (!ALLOWED_MARKS.has(m.type)) continue;
    const attrs = sanitizeAttrs(m.type, m.attrs);
    // Un mark link sin href válido no aporta nada y queda malformado: lo descartamos.
    if (m.type === "link" && (!attrs || !attrs.href)) continue;
    const cleaned: Record<string, unknown> = { type: m.type };
    if (attrs && Object.keys(attrs).length) cleaned.attrs = attrs;
    out.push(cleaned);
  }
  return out.length ? out : undefined;
}

export function sanitizeContent(content: unknown): unknown {
  if (!isPlainObject(content)) return { type: "doc", content: [] };
  const type = typeof content.type === "string" ? content.type : "";
  if (type !== "doc" || !ALLOWED_NODES.has(type)) {
    return { type: "doc", content: [] };
  }
  function walk(node: unknown): unknown {
    if (!isPlainObject(node)) return null;
    const t = typeof node.type === "string" ? node.type : "";
    if (!t || !ALLOWED_NODES.has(t)) return null;
    const out: Record<string, unknown> = { type: t };
    const attrs = sanitizeAttrs(t, node.attrs);
    if (attrs && Object.keys(attrs).length) out.attrs = attrs;
    if (t === "text") {
      if (typeof node.text === "string") out.text = node.text;
      else return null;
      const marks = sanitizeMarks(node.marks);
      if (marks) out.marks = marks;
    }
    if (Array.isArray(node.content)) {
      const kids = node.content.map(walk).filter((x) => x !== null);
      if (kids.length) out.content = kids;
    }
    return out;
  }
  const cleanedContent = Array.isArray(content.content)
    ? content.content.map(walk).filter((x) => x !== null)
    : [];
  return ensureTitleH1({ type: "doc", content: cleanedContent });
}
