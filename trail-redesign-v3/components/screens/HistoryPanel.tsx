"use client";

import { X } from "lucide-react";

export type HistoryVersion = {
  id: string;
  timeLabel: string;
  author: string;
  summary: string;
  group: string;
  content: string;
  isCurrent?: boolean;
};

export function HistoryPanel({
  versions,
  viewingId,
  onSelect,
  onClose,
}: {
  versions: HistoryVersion[];
  viewingId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const groups = groupBy(versions, (v) => v.group);

  return (
    <aside className="flex h-full w-full flex-col border-l border-stone-200 bg-white md:w-72">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <h2 className="text-sm font-medium text-stone-900">Historial de cambios</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          aria-label="Cerrar historial"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {groups.map(([group, items]) => (
          <div key={group} className="mb-4">
            <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-widest text-stone-400">
              {group}
            </p>
            <ul className="space-y-1.5">
              {items.map((v) => {
                const viewing = viewingId === v.id;
                const current = !!v.isCurrent;
                return (
                  <li key={v.id}>
                    <button
                      onClick={() => onSelect(v.id)}
                      className={`w-full rounded-md border px-3 py-2.5 text-left transition ${
                        viewing
                          ? "border-stone-900 bg-white"
                          : "border-transparent hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-900">{v.timeLabel}</span>
                        {current && (
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                            Actual
                          </span>
                        )}
                        {viewing && !current && (
                          <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
                            Viendo
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-stone-400">
                        {v.author} · {v.summary}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <p className="border-t border-stone-100 px-4 py-3 text-[11px] leading-relaxed text-stone-400">
        Se guarda una versión con cada edición. Restaurar no borra el historial.
      </p>
    </aside>
  );
}

function groupBy<T>(items: T[], key: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const arr = map.get(k);
    if (arr) arr.push(item);
    else map.set(k, [item]);
  }
  return [...map.entries()];
}
