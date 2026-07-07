"use client";

import {
  ArrowLeft, Bold, Italic, Underline, Heading1, Heading2,
  List, ListOrdered, ListChecks, Quote, MoreHorizontal,
  Trash2, Clock, Plus,
} from "lucide-react";
import { TagPill, TagColor } from "../ui/TagPill";
import { DueDateButton } from "../ui/DueDateButton";

/* Editor — cada to-do lleva al inicio un botón de fecha de ejecución
   (icono calendario → chip con la fecha). Para TipTap:
   extender TaskItem con un atributo `dueDate` y un NodeView que
   renderice <TaskRow /> — ver README-CURSOR.md §TipTap. */

export function EditorScreen({
  title = "",
  dateLabel = "Mon, Jul 6",
  timeLabel = "11:37",
  tags = [{ name: "leafland", color: "pink" as TagColor }],
  saveState = "saved",
  onBack,
  onTitleChange,
  onAddTag,
  onRemoveTag,
  onDelete,
  children, // <EditorContent /> de TipTap
}: {
  title?: string;
  dateLabel?: string;
  timeLabel?: string;
  tags?: { name: string; color: TagColor }[];
  saveState?: "saved" | "saving" | "error";
  onBack?: () => void;
  onTitleChange?: (v: string) => void;
  onAddTag?: () => void;
  onRemoveTag?: (name: string) => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Barra superior */}
      <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2.5 md:px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {dateLabel}
        </button>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-stone-400">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                saveState === "saved" ? "bg-emerald-500" : saveState === "saving" ? "animate-pulse bg-amber-400" : "bg-red-500"
              }`}
            />
            <span className="hidden sm:inline">
              {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : "Couldn't save"}
            </span>
          </span>

          <div className="group relative">
            <button className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700" aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <div className="invisible absolute right-0 top-full z-10 mt-1 w-44 rounded-md border border-stone-200 bg-white py-1 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100">
              <button
                onClick={onDelete}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete entry
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar — scrollable horizontal en mobile */}
      <div className="sticky top-0 z-10 flex items-center gap-0.5 overflow-x-auto border-b border-stone-100 bg-white/90 px-3 py-1.5 backdrop-blur md:px-4 [scrollbar-width:none]">
        {[
          { icon: Bold, label: "Bold" },
          { icon: Italic, label: "Italic" },
          { icon: Underline, label: "Underline" },
        ].map(({ icon: Icon, label }) => (
          <ToolbarBtn key={label} label={label}><Icon className="h-4 w-4" /></ToolbarBtn>
        ))}
        <Divider />
        <ToolbarBtn label="Heading 1"><Heading1 className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn label="Heading 2"><Heading2 className="h-4 w-4" /></ToolbarBtn>
        <Divider />
        <ToolbarBtn label="Bullet list"><List className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn label="Numbered list"><ListOrdered className="h-4 w-4" /></ToolbarBtn>
        <ToolbarBtn label="Checklist"><ListChecks className="h-4 w-4" /></ToolbarBtn>
        <Divider />
        <ToolbarBtn label="Quote"><Quote className="h-4 w-4" /></ToolbarBtn>
      </div>

      {/* Documento */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 pb-32 pt-8 md:px-8 md:pt-12">
          <input
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            placeholder="Untitled"
            className="font-display w-full bg-transparent text-2xl text-stone-900 placeholder:text-stone-300 focus:outline-none md:text-3xl"
          />

          {/* Fila de propiedades */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-stone-100 pb-5">
            <button className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-stone-500 transition hover:bg-stone-100">
              <Clock className="h-3.5 w-3.5" />
              {dateLabel} · {timeLabel}
            </button>
            <span className="h-3.5 w-px bg-stone-200" />
            {tags.map((t) => (
              <TagPill key={t.name} name={t.name} color={t.color} size="xs" onRemove={() => onRemoveTag?.(t.name)} />
            ))}
            <button
              onClick={onAddTag}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
            >
              <Plus className="h-3 w-3" />
              Tag
            </button>
          </div>

          <div className="trail-prose pt-6">
            {children ?? (
              <p className="text-stone-300">Write something, or press "/" for commands…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Fila de to-do con fecha de ejecución al inicio.
   Presentacional — en producción es el NodeView de TaskItem. */
export function TaskRow({
  text,
  checked = false,
  dueDate = null,
  onToggle,
  onDueDateChange,
}: {
  text: string;
  checked?: boolean;
  dueDate?: string | null;
  onToggle?: (v: boolean) => void;
  onDueDateChange?: (v: string | null) => void;
}) {
  return (
    <div className="group/task -ml-7 flex items-start gap-1.5 py-0.5">
      {/* Fecha de ejecución — al inicio; visible si tiene fecha, al hover si no */}
      <span className={`mt-0.5 ${dueDate ? "" : "opacity-0 transition group-hover/task:opacity-100"}`}>
        <DueDateButton value={dueDate} onChange={onDueDateChange} />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle?.(e.target.checked)}
        aria-label={text}
        className="mt-1 h-[17px] w-[17px] cursor-pointer appearance-none rounded-sm border-[1.5px] border-stone-400 transition checked:border-stone-900 checked:bg-stone-900 hover:border-stone-500"
      />
      <span className={`text-[15px] leading-7 ${checked ? "text-stone-400 line-through" : "text-stone-900"}`}>
        {text}
      </span>
    </div>
  );
}

function ToolbarBtn({ children, label, active = false }: { children: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`shrink-0 rounded p-1.5 transition ${
        active ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-stone-200" />;
}
