import { extractText } from "@/lib/tiptap-text";

export type DiffSeg = { type: "same" | "add" | "del"; text: string };

/** Diff por palabras (Myers-lite vía LCS). Suficiente para historial de prosa. */
export function diffWords(before: string, after: string): DiffSeg[] {
  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length === 0 && b.length === 0) return [];
  if (a.length === 0) return b.length ? [{ type: "add", text: b.join("") }] : [];
  if (b.length === 0) return [{ type: "del", text: a.join("") }];

  const n = a.length;
  const m = b.length;
  // ponytail: LCS O(n·m) — ceiling ~2k tokens; upgrade: diff-match-patch
  if (n * m > 400_000) {
    return [
      { type: "del", text: before },
      { type: "add", text: after },
    ];
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] = a[i] === b[j] ? (dp[i + 1]![j + 1]! + 1) : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const segs: DiffSeg[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push(segs, "same", a[i]!);
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      push(segs, "del", a[i]!);
      i++;
    } else {
      push(segs, "add", b[j]!);
      j++;
    }
  }
  while (i < n) {
    push(segs, "del", a[i]!);
    i++;
  }
  while (j < m) {
    push(segs, "add", b[j]!);
    j++;
  }
  return segs;
}

export function diffTipTap(before: unknown, after: unknown): DiffSeg[] {
  return diffWords(extractText(before).trim(), extractText(after).trim());
}

type TipTapNode = {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string }[];
};

/** Doc TipTap con marcas diffAdd/diffDel — bloques + word-diff en párrafos/headings. */
export function buildBlockDiffDoc(before: unknown, after: unknown): TipTapNode {
  const a = topBlocks(before);
  const b = topBlocks(after);
  if (a.length === 0 && b.length === 0) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  const n = a.length;
  const m = b.length;
  const aKeys = a.map((node) => extractText(node));
  const bKeys = b.map((node) => extractText(node));

  // ponytail: LCS O(n·m) — ceiling ~400 bloques; upgrade: patience diff
  if (n * m > 160_000) {
    return {
      type: "doc",
      content: [
        ...a.map((node) => markAllText(node, "diffDel")),
        ...b.map((node) => markAllText(node, "diffAdd")),
      ],
    };
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] =
        aKeys[i] === bKeys[j]
          ? (dp[i + 1]![j + 1]! + 1)
          : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  type Seg = { type: "same" | "add" | "del"; node: TipTapNode };
  const segs: Seg[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aKeys[i] === bKeys[j]) {
      segs.push({ type: "same", node: a[i]! });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      segs.push({ type: "del", node: a[i]! });
      i++;
    } else {
      segs.push({ type: "add", node: b[j]! });
      j++;
    }
  }
  while (i < n) {
    segs.push({ type: "del", node: a[i]! });
    i++;
  }
  while (j < m) {
    segs.push({ type: "add", node: b[j]! });
    j++;
  }

  const content: TipTapNode[] = [];
  for (let k = 0; k < segs.length; k++) {
    const cur = segs[k]!;
    const next = segs[k + 1];
    if (
      cur.type === "del" &&
      next?.type === "add" &&
      isInlineDiffable(cur.node) &&
      isInlineDiffable(next.node)
    ) {
      content.push(inlineWordDiffBlock(cur.node, next.node));
      k++;
      continue;
    }
    if (cur.type === "same") content.push(cur.node);
    else if (cur.type === "del") content.push(markAllText(cur.node, "diffDel"));
    else content.push(markAllText(cur.node, "diffAdd"));
  }

  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

function topBlocks(doc: unknown): TipTapNode[] {
  const root = doc as { content?: TipTapNode[] } | null;
  return Array.isArray(root?.content) ? root.content : [];
}

function isInlineDiffable(node: TipTapNode): boolean {
  return node.type === "paragraph" || node.type === "heading";
}

function markAllText(node: TipTapNode, markName: string): TipTapNode {
  if (node.type === "text" && typeof node.text === "string") {
    const marks = [...(node.marks ?? [])];
    if (!marks.some((m) => m.type === markName)) marks.push({ type: markName });
    return { ...node, marks };
  }
  if (node.content) {
    return { ...node, content: node.content.map((c) => markAllText(c, markName)) };
  }
  return { ...node };
}

function inlineWordDiffBlock(before: TipTapNode, after: TipTapNode): TipTapNode {
  const segs = diffWords(extractText(before), extractText(after));
  const content: TipTapNode[] = [];
  for (const seg of segs) {
    if (!seg.text) continue;
    const textNode: TipTapNode = { type: "text", text: seg.text };
    if (seg.type === "add") textNode.marks = [{ type: "diffAdd" }];
    if (seg.type === "del") textNode.marks = [{ type: "diffDel" }];
    content.push(textNode);
  }
  return {
    type: after.type ?? "paragraph",
    attrs: after.attrs,
    content: content.length ? content : undefined,
  };
}

export function summarizeEdit(before: unknown, after: unknown): string {
  const a = extractText(before).trim();
  const b = extractText(after).trim();
  if (!a && b) return "escribió el contenido";
  if (a && !b) return "borró el contenido";
  const segs = diffWords(a, b);
  const adds = segs.filter((s) => s.type === "add").length;
  const dels = segs.filter((s) => s.type === "del").length;
  if (adds && dels) return "editó el contenido";
  if (adds) return adds === 1 ? "agregó texto" : "agregó texto";
  if (dels) return "eliminó texto";
  return "guardó cambios";
}

function tokenize(s: string): string[] {
  // palabras + whitespace/punct como tokens separados para un diff legible
  return s.match(/\s+|[^\s]+/g) ?? [];
}

function push(segs: DiffSeg[], type: DiffSeg["type"], text: string) {
  const last = segs[segs.length - 1];
  if (last && last.type === type) last.text += text;
  else segs.push({ type, text });
}
