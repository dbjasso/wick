"use client";

import { X } from "lucide-react";

export type HistoryVersion = {
  id: string;
  timeLabel: string;
  author: string;
  summary: string;
  group: string;
  content: unknown;
  createdAt?: string;
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
    <div className="flex h-full max-h-[min(100%,36rem)] flex-col overflow-hidden rounded-2xl border border-[#E7E5DF] bg-white lg:max-h-[calc(100dvh-8rem)]">
      <div className="flex shrink-0 items-center justify-between border-b border-[#F0EEE9] px-5 py-[18px]">
        <h2 className="text-[15px] font-semibold text-[#1a1a1a]">Historial de cambios</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-base text-[#8a8a84] transition hover:text-[#1a1a1a]"
          aria-label="Cerrar historial"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3.5">
        {versions.length === 0 ? (
          <p className="px-2.5 py-4 text-sm text-[#8a8a84]">Cargando historial…</p>
        ) : (
          groups.map(([group, items]) => (
            <div key={group} className="mb-1">
              <p className="px-2.5 text-[11px] tracking-[2px] text-[#8a8a84]">{group}</p>
              <ul className="mt-2 space-y-2">
                {items.map((v) => {
                  const viewing = viewingId === v.id;
                  const current = !!v.isCurrent;
                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(v.id)}
                        className={`w-full rounded-[10px] px-3.5 py-3 text-left transition ${
                          viewing
                            ? "border-[1.5px] border-[#1a1a1a] bg-[#F4F2ED]"
                            : current
                              ? "border border-[#E7E5DF] hover:bg-[#F4F2ED]"
                              : "border border-transparent hover:bg-[#F4F2ED]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#1a1a1a]">{v.timeLabel}</span>
                          {current && (
                            <span className="rounded-md bg-[#EFEDE8] px-2 py-0.5 text-[11px] font-semibold text-[#4a4a45]">
                              Actual
                            </span>
                          )}
                          {viewing && !current && (
                            <span className="text-xs font-medium text-[#6D28D9]">Viendo</span>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] text-[#8a8a84]">
                          {v.author} · {v.summary}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <p className="shrink-0 border-t border-[#F0EEE9] px-5 py-3.5 text-xs leading-relaxed text-[#b5b3ad]">
        Se guarda una versión al salir de la nota o tras 10 min sin cambios. Restaurar no borra el historial.
      </p>
    </div>
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
