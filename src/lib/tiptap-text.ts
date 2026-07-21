import { ensureTitleH1 } from "@/lib/ensure-title-h1";

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

// Segmenta un documento TipTap para el preview de una card: título = primer
// bloque (siempre h1 vía ensureTitleH1) y el resto como segmentos. Los
// taskItem se emiten como "☐ texto" (todo: true) para pintarlos en text-3.
export function previewSegments(
  content: unknown,
): { title: string; segments: PreviewSegment[] } {
  const top = ensureTitleH1(content).content ?? [];
  const titleIdx = 0;
  const title = top[0] ? extractText(top[0]).trim() : "";

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
