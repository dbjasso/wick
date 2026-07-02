"use client";

import type { Editor } from "@tiptap/react";

type Btn = {
  label: React.ReactNode;
  title: string;
  active: (e: Editor) => boolean;
  run: (e: Editor) => void;
};

const GROUPS: Btn[][] = [
  [
    { label: <b>B</b>, title: "Negrita", active: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
    { label: <i>I</i>, title: "Itálica", active: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
    { label: <u>U</u>, title: "Subrayado", active: (e) => e.isActive("underline"), run: (e) => e.chain().focus().toggleUnderline().run() },
  ],
  [
    { label: "H1", title: "Título 1", active: (e) => e.isActive("heading", { level: 1 }), run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "H2", title: "Título 2", active: (e) => e.isActive("heading", { level: 2 }), run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  ],
  [
    { label: "• Lista", title: "Lista con viñetas", active: (e) => e.isActive("bulletList"), run: (e) => e.chain().focus().toggleBulletList().run() },
    { label: "1. Lista", title: "Lista numerada", active: (e) => e.isActive("orderedList"), run: (e) => e.chain().focus().toggleOrderedList().run() },
    { label: "☐ Checklist", title: "Lista de tareas", active: (e) => e.isActive("taskList"), run: (e) => e.chain().focus().toggleTaskList().run() },
    { label: "“ ”", title: "Cita", active: (e) => e.isActive("blockquote"), run: (e) => e.chain().focus().toggleBlockquote().run() },
  ],
];

export function Toolbar({ editor, className = "" }: { editor: Editor | null; className?: string }) {
  if (!editor) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1 border-b border-border bg-surface px-4 py-2 ${className}`}>
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <span className="mx-1 h-4 w-px bg-border" />}
          {group.map((b) => {
            const active = b.active(editor);
            return (
              <button
                key={b.title}
                type="button"
                title={b.title}
                onClick={() => b.run(editor)}
                className={`flex h-7 min-w-7 items-center justify-center rounded-btn px-2 text-sm transition-colors ${
                  active
                    ? "bg-surface-2 font-semibold text-text"
                    : "text-text-2 hover:bg-surface-2 hover:text-text"
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
