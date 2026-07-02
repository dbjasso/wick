// Extrae texto plano de un nodo/JSON de TipTap (recorre content y text).
export function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object") {
    const n = node as { text?: unknown; content?: unknown };
    if (typeof n.text === "string") return n.text;
    if (n.content) return extractText(n.content);
  }
  return "";
}

export function previewText(content: unknown, max = 140): string {
  return extractText(content).slice(0, max);
}

export type PreviewSegment = { text: string; todo: boolean };

// Segmenta un documento TipTap para el preview de una card: un título (primer
// heading, o el primer párrafo si no hay heading) y una lista de segmentos de
// texto. Los taskItem se emiten como "☐ texto" (todo: true) para pintarlos en
// text-3; el resto va como texto normal.
export function previewSegments(
  content: unknown,
): { title: string; segments: PreviewSegment[] } {
  const root = content as { type?: string; content?: unknown[] } | null;
  const top = root && Array.isArray(root.content) ? root.content : [];

  let titleIdx = -1;
  let title = "";
  top.forEach((node, i) => {
    if (titleIdx === -1 && (node as { type?: string }).type === "heading") {
      const t = extractText((node as { content?: unknown }).content).trim();
      if (t) {
        titleIdx = i;
        title = t;
      }
    }
  });
  if (!title) {
    top.forEach((node, i) => {
      if (titleIdx === -1 && (node as { type?: string }).type === "paragraph") {
        const t = extractText((node as { content?: unknown }).content).trim();
        if (t) {
          titleIdx = i;
          title = t;
        }
      }
    });
  }

  const segments: PreviewSegment[] = [];
  top.forEach((node, i) => {
    if (i === titleIdx) return;
    const n = node as { type?: string; content?: unknown };
    if (n.type === "taskList" && Array.isArray(n.content)) {
      n.content.forEach((item) => {
        const t = extractText((item as { content?: unknown }).content).trim();
        if (t) segments.push({ text: "☐ " + t, todo: true });
      });
    } else {
      const t = extractText(node).trim();
      if (t) segments.push({ text: t, todo: false });
    }
  });

  return { title, segments };
}
