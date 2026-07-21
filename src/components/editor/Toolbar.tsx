"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
} from "lucide-react";
import { isInLockedTitle } from "./LockedTitle";

type Btn = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  active: (e: Editor) => boolean;
  run: (e: Editor) => void;
  /** Deshabilitar cuando el cursor está en el título locked. */
  lockInTitle?: boolean;
};

const GROUPS: Btn[][] = [
  [
    { icon: Bold, title: "Bold", active: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
    { icon: Italic, title: "Italic", active: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
    { icon: Underline, title: "Underline", active: (e) => e.isActive("underline"), run: (e) => e.chain().focus().toggleUnderline().run() },
    { icon: Strikethrough, title: "Strikethrough", active: (e) => e.isActive("strike"), run: (e) => e.chain().focus().toggleStrike().run() },
  ],
  [
    {
      icon: Heading1,
      title: "Heading 1",
      active: (e) => e.isActive("heading", { level: 1 }),
      run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
      lockInTitle: true,
    },
    {
      icon: Heading2,
      title: "Heading 2",
      active: (e) => e.isActive("heading", { level: 2 }),
      run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      lockInTitle: true,
    },
    {
      icon: Minus,
      title: "Horizontal rule",
      active: () => false,
      run: (e) => e.chain().focus().setHorizontalRule().run(),
      lockInTitle: true,
    },
  ],
  [
    {
      icon: ListOrdered,
      title: "Numbered list",
      active: (e) => e.isActive("orderedList"),
      run: (e) => e.chain().focus().toggleOrderedList().run(),
      lockInTitle: true,
    },
    {
      icon: ListChecks,
      title: "Checklist",
      active: (e) => e.isActive("taskList"),
      run: (e) => e.chain().focus().toggleTaskList().run(),
      lockInTitle: true,
    },
    {
      icon: List,
      title: "Bullet list",
      active: (e) => e.isActive("bulletList"),
      run: (e) => e.chain().focus().toggleBulletList().run(),
      lockInTitle: true,
    },
    {
      icon: Quote,
      title: "Quote",
      active: (e) => e.isActive("blockquote"),
      run: (e) => e.chain().focus().toggleBlockquote().run(),
      lockInTitle: true,
    },
  ],
];

export function Toolbar({ editor }: { editor: Editor | null }) {
  const inTitle = useEditorState({
    editor,
    selector: ({ editor: ed }) => (ed ? isInLockedTitle(ed) : false),
  });

  if (!editor) return null;
  return (
    <div className="flex items-center gap-1 overflow-x-auto px-5 py-2 text-[#6b6b66] md:px-7 [scrollbar-width:none]">
      {GROUPS.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1">
          {gi > 0 && <span className="mx-1.5 h-[18px] w-px shrink-0 bg-[#ECEAE5]" />}
          {group.map((b) => {
            const active = b.active(editor);
            const locked = !!(b.lockInTitle && inTitle);
            // Título locked: H1 se ve activo (es el estado fijo), no se puede apagar.
            const showActive = locked && b.title === "Heading 1" ? true : active && !locked;
            const Icon = b.icon;
            return (
              <button
                key={b.title}
                type="button"
                title={locked ? "El título es siempre H1" : b.title}
                aria-label={b.title}
                disabled={locked}
                onClick={() => {
                  if (!locked) b.run(editor);
                }}
                className={`shrink-0 rounded-lg p-1.5 transition ${
                  locked && b.title !== "Heading 1"
                    ? "cursor-not-allowed opacity-35"
                    : showActive
                      ? "bg-[#EFEDE8] text-[#1a1a1a]"
                      : locked
                        ? "cursor-not-allowed opacity-35"
                        : "hover:bg-[#F4F2ED] hover:text-[#1a1a1a]"
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
