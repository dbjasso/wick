"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ListChecks,
  Quote,
} from "lucide-react";

type Btn = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  active: (e: Editor) => boolean;
  run: (e: Editor) => void;
};

const GROUPS: Btn[][] = [
  [
    { icon: Bold, title: "Bold", active: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
    { icon: Italic, title: "Italic", active: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
    { icon: Underline, title: "Underline", active: (e) => e.isActive("underline"), run: (e) => e.chain().focus().toggleUnderline().run() },
  ],
  [
    { icon: Heading1, title: "Heading 1", active: (e) => e.isActive("heading", { level: 1 }), run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
    { icon: Heading2, title: "Heading 2", active: (e) => e.isActive("heading", { level: 2 }), run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  ],
  [
    { icon: List, title: "Bullet list", active: (e) => e.isActive("bulletList"), run: (e) => e.chain().focus().toggleBulletList().run() },
    { icon: ListOrdered, title: "Numbered list", active: (e) => e.isActive("orderedList"), run: (e) => e.chain().focus().toggleOrderedList().run() },
    { icon: ListChecks, title: "Checklist", active: (e) => e.isActive("taskList"), run: (e) => e.chain().focus().toggleTaskList().run() },
    { icon: Quote, title: "Quote", active: (e) => e.isActive("blockquote"), run: (e) => e.chain().focus().toggleBlockquote().run() },
  ],
];

export function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="sticky top-0 z-10 flex items-center gap-0.5 overflow-x-auto border-b border-stone-100 bg-white/90 px-3 py-1.5 backdrop-blur md:px-4 [scrollbar-width:none]">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && <span className="mx-1 h-4 w-px shrink-0 bg-stone-200" />}
          {group.map((b) => {
            const active = b.active(editor);
            const Icon = b.icon;
            return (
              <button
                key={b.title}
                type="button"
                title={b.title}
                aria-label={b.title}
                onClick={() => b.run(editor)}
                className={`shrink-0 rounded p-1.5 transition ${
                  active
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
