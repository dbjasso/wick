import Document from "@tiptap/extension-document";
import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/** Schema: el doc siempre empieza con un heading. */
export const TitleDocument = Document.extend({
  content: "heading block*",
});

/** Fuerza level:1 en el primer heading (H2 desde toolbar no pega). */
export const LockedTitleH1 = Extension.create({
  name: "lockedTitleH1",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("lockedTitleH1"),
        appendTransaction(_trs, _old, state) {
          const first = state.doc.firstChild;
          if (!first || first.type.name !== "heading") return null;
          if (first.attrs.level === 1) return null;
          return state.tr.setNodeMarkup(0, undefined, {
            ...first.attrs,
            level: 1,
          });
        },
      }),
    ];
  },
});

/** ¿La selección está en el título (primer bloque)? */
export function isInLockedTitle(editor: Editor): boolean {
  const first = editor.state.doc.firstChild;
  if (!first) return false;
  const { from, to } = editor.state.selection;
  return from < first.nodeSize && to <= first.nodeSize;
}
