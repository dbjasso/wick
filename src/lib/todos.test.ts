import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dueDateToDb,
  dueDateFromDb,
  patchTaskItemDueDate,
  collectTaskItems,
} from "./todos";
import { todoBucket } from "./date-labels";
import { todayKey, shiftDayKey } from "./timezone";
import { sanitizeContent } from "./sanitize";

test("dueDateToDb / dueDateFromDb round-trip a date-only value", () => {
  const iso = dueDateToDb("2026-07-08");
  assert.equal(iso?.toISOString(), "2026-07-08T00:00:00.000Z");
  assert.equal(dueDateFromDb(iso), "2026-07-08");
  assert.equal(dueDateToDb(null), null);
  assert.equal(dueDateToDb("garbage"), null);
  assert.equal(dueDateFromDb(null), null);
});

test("todoBucket classifies relative to today", () => {
  const today = todayKey();
  assert.equal(todoBucket(null), "none");
  assert.equal(todoBucket(shiftDayKey(today, -1)), "overdue");
  assert.equal(todoBucket(today), "today");
  assert.equal(todoBucket(shiftDayKey(today, 3)), "week");
  assert.equal(todoBucket(shiftDayKey(today, 7)), "week");
  assert.equal(todoBucket(shiftDayKey(today, 8)), "later");
});

test("patchTaskItemDueDate sets the attr on the matching node only", () => {
  const doc = {
    type: "doc",
    content: [
      {
        type: "taskList",
        content: [
          { type: "taskItem", attrs: { nodeId: "a", checked: false }, content: [] },
          { type: "taskItem", attrs: { nodeId: "b", checked: false }, content: [] },
        ],
      },
    ],
  };
  const patched = patchTaskItemDueDate(doc, "b", "2026-07-08");
  assert.notEqual(patched, null);
  const items = collectTaskItems(patched);
  assert.deepEqual(
    items.map((i) => [i.nodeId, i.dueDate]),
    [
      ["a", null],
      ["b", "2026-07-08"],
    ],
  );
  // Nodo inexistente -> null (no cambia nada).
  assert.equal(patchTaskItemDueDate(doc, "zzz", "2026-07-08"), null);
});

test("sanitizeContent preserva dueDate válido y descarta el inválido", () => {
  const make = (dueDate: unknown) => ({
    type: "doc",
    content: [
      {
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { nodeId: "a", checked: false, dueDate },
            content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }],
          },
        ],
      },
    ],
  });
  // Válido: sobrevive el sanitizado (regresión del bug "no guarda la fecha").
  assert.equal(collectTaskItems(sanitizeContent(make("2026-07-08")))[0].dueDate, "2026-07-08");
  // Inválido: se descarta.
  assert.equal(collectTaskItems(sanitizeContent(make("garbage")))[0].dueDate, null);
  assert.equal(collectTaskItems(sanitizeContent(make(12345)))[0].dueDate, null);
});
