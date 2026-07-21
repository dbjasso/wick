"use client";

import { useEffect, useMemo } from "react";
import { Mark } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList } from "@tiptap/extension-list";
import { TaskItemWithId } from "./TaskItemWithId";
import { TitleDocument, LockedTitleH1 } from "./LockedTitle";
import { buildBlockDiffDoc } from "@/lib/diff-text";
import { ensureTitleH1, EMPTY_TITLE_DOC } from "@/lib/ensure-title-h1";

const DiffAdd = Mark.create({
  name: "diffAdd",
  inclusive: false,
  parseHTML() {
    return [{ tag: "span[data-diff='add']" }];
  },
  renderHTML() {
    return [
      "span",
      {
        "data-diff": "add",
        class: "rounded-sm bg-[#DCFCE7] text-[#166534]",
      },
      0,
    ];
  },
});

const DiffDel = Mark.create({
  name: "diffDel",
  inclusive: false,
  parseHTML() {
    return [{ tag: "span[data-diff='del']" }];
  },
  renderHTML() {
    return [
      "span",
      {
        "data-diff": "del",
        class: "rounded-sm bg-[#FEE2E2] text-[#991B1B] line-through",
      },
      0,
    ];
  },
});

/**
 * Vista read-only del TipTap JSON.
 * Con `compareTo`, pinta agregado (verde) / eliminado (rojo) vs esa versión.
 */
export function VersionPreview({
  content,
  compareTo,
}: {
  content: unknown;
  compareTo?: unknown;
}) {
  const doc = useMemo(
    () =>
      ensureTitleH1(
        compareTo !== undefined
          ? buildBlockDiffDoc(content, compareTo)
          : (content ?? EMPTY_TITLE_DOC),
      ),
    [content, compareTo],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ document: false }),
      TitleDocument,
      LockedTitleH1,
      TaskList,
      TaskItemWithId.configure({
        HTMLAttributes: { "data-type": "taskItem" },
      }),
      DiffAdd,
      DiffDel,
    ],
    content: doc,
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(doc);
  }, [editor, doc]);

  return <EditorContent editor={editor} className="prose-editor prose-editor--sheet" />;
}
