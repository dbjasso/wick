import assert from "node:assert/strict";
import { ensureTitleH1 } from "../src/lib/ensure-title-h1";
import { previewSegments } from "../src/lib/tiptap-text";

// ponytail: chequeo mínimo — npx tsx scripts/check-ensure-title-h1.ts

const empty = ensureTitleH1({ type: "doc", content: [] });
assert.equal(empty.content?.[0]?.type, "heading");
assert.equal(empty.content?.[0]?.attrs?.level, 1);

const fromP = ensureTitleH1({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Envios" }] },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "BOON" }] },
  ],
});
assert.equal(fromP.content?.[0]?.type, "heading");
assert.equal(fromP.content?.[0]?.attrs?.level, 1);
assert.equal(
  (fromP.content?.[0] as { content?: { text?: string }[] } | undefined)?.content?.[0]?.text,
  "Envios",
);
assert.equal(fromP.content?.[1]?.type, "heading");

const h2 = ensureTitleH1({
  type: "doc",
  content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "X" }] }],
});
assert.equal(h2.content?.[0]?.attrs?.level, 1);

const listFirst = ensureTitleH1({
  type: "doc",
  content: [{ type: "bulletList", content: [] }],
});
assert.equal(listFirst.content?.[0]?.type, "heading");
assert.equal(listFirst.content?.[1]?.type, "bulletList");

const preview = previewSegments({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Envios" }] },
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "BOON_3852" }] },
  ],
});
assert.equal(preview.title, "Envios");

console.log("ensure-title-h1 ok");
