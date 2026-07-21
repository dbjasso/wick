import assert from "node:assert/strict";
import { diffWords, summarizeEdit } from "../src/lib/diff-text";

// ponytail: chequeo mínimo del diff — correr con: npx tsx scripts/check-diff.ts
const segs = diffWords(
  "Llamada con david. Pendiente fecha.",
  "Llamada con david. Cotización el viernes.",
);
assert.ok(segs.some((s) => s.type === "del"));
assert.ok(segs.some((s) => s.type === "add"));
assert.equal(
  summarizeEdit({ type: "doc", content: [] }, { type: "doc", content: [{ type: "text", text: "hola" }] }),
  "escribió el contenido",
);
console.log("diff-text ok");
