import { TaskItem } from "@tiptap/extension-list";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TaskItemView } from "./TaskItemView";

// TaskItem con:
//  - `nodeId` estable, auto-asignado a cualquier ítem que no tenga uno (vía
//    appendTransaction), para que el servidor pueda sincronizar TodoItem.
//  - `dueDate` ("YYYY-MM-DD" | null): fecha de ejecución opcional, editable
//    desde el DueDateButton del NodeView y desde la lista de To-dos.
const key = new PluginKey("taskItemNodeId");

function newId(): string {
  return globalThis.crypto.randomUUID();
}

export const TaskItemWithId = TaskItem.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      nodeId: {
        default: null,
        // Al partir un ítem (Enter), el nuevo no debe heredar el nodeId del padre.
        keepOnSplit: false,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-node-id") || null,
        renderHTML: (attrs) =>
          attrs.nodeId ? { "data-node-id": attrs.nodeId as string } : {},
      },
      dueDate: {
        default: null,
        keepOnSplit: false,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-due-date") || null,
        renderHTML: (attrs) =>
          attrs.dueDate ? { "data-due-date": attrs.dueDate as string } : {},
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView);
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key,
        appendTransaction: (_trs, _old, newState) => {
          const tr = newState.tr;
          let modified = false;
          const seen = new Set<string>();
          newState.doc.descendants((node, pos) => {
            if (node.type.name !== "taskItem") return;
            const id = node.attrs.nodeId as string | null;
            if (!id || seen.has(id)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                nodeId: newId(),
              });
              modified = true;
            } else {
              seen.add(id);
            }
          });
          return modified ? tr : null;
        },
      }),
    ];
  },
});
