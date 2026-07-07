"use client";

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { DueDateButton } from "@/components/ui/DueDateButton";

// NodeView de taskItem — mismo layout que TaskRow en EditorScreen:
// carril fijo w-7 para la fecha (-ml-7 mete el badge en el margen izquierdo),
// checkbox siempre alineado, hint al hover si no hay fecha.
export function TaskItemView({ node, updateAttributes, editor }: NodeViewProps) {
  const checked = !!node.attrs.checked;
  const dueDate = (node.attrs.dueDate as string | null) ?? null;
  const editable = editor.isEditable;

  return (
    <NodeViewWrapper
      as="li"
      data-checked={checked ? "true" : "false"}
      className="group/task -ml-7 flex items-center gap-1.5 py-0.5"
    >
      <span
        className={`due-date-btn flex w-7 shrink-0 items-center justify-center ${dueDate ? "has-date" : ""}`}
        contentEditable={false}
      >
        <DueDateButton
          value={dueDate}
          onChange={editable ? (v) => updateAttributes({ dueDate: v }) : undefined}
        />
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={!editable}
        onChange={(e) => updateAttributes({ checked: e.target.checked })}
        contentEditable={false}
        className="h-[17px] w-[17px] shrink-0 cursor-pointer appearance-none rounded-sm border-[1.5px] border-stone-400 transition checked:border-stone-900 checked:bg-stone-900 hover:border-stone-500"
      />
      <NodeViewContent
        className={`min-w-0 flex-1 text-[15px] leading-7 ${
          checked ? "text-stone-400 line-through" : "text-stone-900"
        }`}
      />
      {!dueDate && editable && (
        <span className="pointer-events-none hidden shrink-0 text-xs text-stone-300 opacity-0 transition group-hover/task:opacity-100 sm:inline">
          ← hover the line to set a due date
        </span>
      )}
    </NodeViewWrapper>
  );
}
