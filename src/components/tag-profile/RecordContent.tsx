"use client";

import { Checkbox } from "@/components/ui/Checkbox";

type Mark = { type: string };
type TNode = {
  type?: string;
  text?: string;
  marks?: Mark[];
  attrs?: Record<string, unknown>;
  content?: TNode[];
};

function renderMarks(text: string, marks?: Mark[]): React.ReactNode {
  let node: React.ReactNode = text;
  for (const m of marks ?? []) {
    if (m.type === "bold") node = <strong>{node}</strong>;
    else if (m.type === "italic") node = <em>{node}</em>;
    else if (m.type === "underline") node = <u>{node}</u>;
    else if (m.type === "code")
      node = (
        <code className="rounded bg-surface-2 px-1 text-[0.9em]">{node}</code>
      );
  }
  return node;
}

function NodeView({
  node,
  todoByNodeId,
  onTodoToggle,
}: {
  node: TNode;
  todoByNodeId: Record<string, { id: string; checked: boolean }>;
  onTodoToggle: (todoId: string, checked: boolean) => void;
}) {
  if (node.type === "text" && node.text) {
    return <>{renderMarks(node.text, node.marks)}</>;
  }

  const kids = node.content?.map((c, i) => (
    <NodeView key={i} node={c} todoByNodeId={todoByNodeId} onTodoToggle={onTodoToggle} />
  ));

  switch (node.type) {
    case "doc":
      return <div className="space-y-2">{kids}</div>;
    case "paragraph":
      return <p className="leading-relaxed">{kids}</p>;
    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      if (level === 1)
        return <h1 className="text-lg font-bold">{kids}</h1>;
      return <h2 className="text-base font-semibold">{kids}</h2>;
    }
    case "bulletList":
      return <ul className="list-disc space-y-1 pl-5">{kids}</ul>;
    case "orderedList":
      return <ol className="list-decimal space-y-1 pl-5">{kids}</ol>;
    case "listItem":
      return <li>{kids}</li>;
    case "blockquote":
      return (
        <blockquote className="border-l-2 border-border-strong pl-3 text-text-2">
          {kids}
        </blockquote>
      );
    case "taskList":
      return <ul className="space-y-1.5">{kids}</ul>;
    case "taskItem": {
      const nodeId = node.attrs?.nodeId as string | undefined;
      const checked = !!(node.attrs?.checked ?? todoByNodeId[nodeId ?? ""]?.checked);
      const todo = nodeId ? todoByNodeId[nodeId] : undefined;
      return (
        <li className="flex items-start gap-2">
          <Checkbox
            checked={checked}
            disabled={!todo}
            onChange={(e) => todo && onTodoToggle(todo.id, e.target.checked)}
            className="mt-0.5"
          />
          <div
            className={`min-w-0 flex-1 ${checked ? "text-text-3 line-through" : "text-text"}`}
          >
            {kids}
          </div>
        </li>
      );
    }
    default:
      return kids ? <div>{kids}</div> : null;
  }
}

export function RecordContent({
  content,
  todoItems,
  onTodoToggle,
}: {
  content: unknown;
  todoItems: { id: string; nodeId: string; checked: boolean }[];
  onTodoToggle: (todoId: string, checked: boolean) => void;
}) {
  const todoByNodeId = Object.fromEntries(
    todoItems.map((t) => [t.nodeId, { id: t.id, checked: t.checked }]),
  );
  const root = content as TNode;
  if (!root?.type) return <p className="text-sm text-text-3">Sin contenido</p>;
  return (
    <NodeView
      node={root}
      todoByNodeId={todoByNodeId}
      onTodoToggle={onTodoToggle}
    />
  );
}
