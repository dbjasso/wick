import { TaskItem } from "@tiptap/extension-list";
import { Plugin, PluginKey } from "@tiptap/pm/state";

// TaskItem con un atributo `nodeId` estable, auto-asignado a cualquier ítem que
// no tenga uno (vía appendTransaction). Así el JSON persistido siempre lleva un
// id por ítem y el servidor puede sincronizar la tabla TodoItem sin ambigüedad.
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
          attrs.nodeId ? [["data-node-id", attrs.nodeId as string]] : [],
      },
    };
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
