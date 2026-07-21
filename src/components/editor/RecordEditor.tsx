"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList } from "@tiptap/extension-list";
import { ArrowLeft, MoreHorizontal, Trash2, Clock, History } from "lucide-react";
import { Toolbar } from "./Toolbar";
import { TagsField, type TagValue } from "./TagsField";
import { TaskItemWithId } from "./TaskItemWithId";
import { CommentsSection, type CommentData } from "./CommentsSection";
import { HistoryPanel, type HistoryVersion } from "./HistoryPanel";
import { VersionPreview } from "./VersionPreview";
import { TitleDocument, LockedTitleH1 } from "./LockedTitle";
import { ensureTitleH1, EMPTY_TITLE_DOC } from "@/lib/ensure-title-h1";
import {
  isoToLocalInput,
  localInputToIso,
  formatDayHeader,
  formatTime,
} from "@/lib/timezone";

const EMPTY_DOC = EMPTY_TITLE_DOC;

export type RecordData = {
  id: string;
  date: string; // ISO
  content: unknown;
  tags: { id: string; name: string; color?: string | null }[];
  comments: CommentData[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function RecordEditor({
  record,
  initialDateLocal,
}: {
  record?: RecordData;
  initialDateLocal?: string;
}) {
  const router = useRouter();
  const [recordId, setRecordId] = useState<string | null>(record?.id ?? null);
  const [dateLocal, setDateLocal] = useState(
    record
      ? isoToLocalInput(record.date)
      : (initialDateLocal ?? isoToLocalInput(new Date().toISOString())),
  );
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [tags, setTags] = useState<TagValue[]>(
    record?.tags?.map((t) => ({ name: t.name, color: t.color ?? undefined })) ?? [],
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [versions, setVersions] = useState<HistoryVersion[]>([]);
  const [editCount, setEditCount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const contentRef = useRef<unknown>(
    ensureTitleH1(record?.content ?? EMPTY_DOC),
  );
  const dateRef = useRef(dateLocal);
  const idRef = useRef(recordId);
  const tagsRef = useRef(tags);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const sessionDirtyRef = useRef(false);
  const savingRef = useRef(false);
  const needsResaveRef = useRef(false);
  const snapshotNextRef = useRef(false);
  const saveRef = useRef<() => Promise<void>>(async () => {});
  const commitVersionRef = useRef<() => Promise<void>>(async () => {});
  const IDLE_VERSION_MS = 10 * 60 * 1000;

  useEffect(() => { dateRef.current = dateLocal; }, [dateLocal]);
  useEffect(() => { idRef.current = recordId; }, [recordId]);
  useEffect(() => { tagsRef.current = tags; }, [tags]);

  const loadHistory = useCallback(async (id: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/records/${id}/revisions`);
      if (res.ok) {
        const data = (await res.json()) as {
          versions: HistoryVersion[];
          editCount: number;
        };
        setVersions(data.versions);
        setEditCount(data.editCount);
        return data.versions;
      }
    } catch {
      /* fallback abajo */
    } finally {
      setHistoryLoading(false);
    }
    // Si la API falla, al menos mostrar la versión actual del editor
    const fallback: HistoryVersion[] = [
      {
        id: "current",
        timeLabel: "ahora",
        author: "tú",
        summary: "versión actual",
        group: "HOY",
        content: contentRef.current,
        isCurrent: true,
      },
    ];
    setVersions(fallback);
    return fallback;
  }, []);

  const save = useCallback(async () => {
    if (!dirtyRef.current && !snapshotNextRef.current) return;
    if (savingRef.current) {
      needsResaveRef.current = true;
      return;
    }
    const content = contentRef.current;
    const dateIso = localInputToIso(dateRef.current);
    const tagNames = tagsRef.current;
    const forceSnapshot = snapshotNextRef.current;
    snapshotNextRef.current = false;
    setStatus("saving");
    savingRef.current = true;
    try {
      if (!idRef.current) {
        const res = await fetch("/api/records", {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateIso, content, tags: tagNames }),
        });
        if (!res.ok) throw new Error("create failed");
        const created = (await res.json()) as { id: string };
        setRecordId(created.id);
        router.replace(`/registros/${created.id}/editar`);
      } else {
        const res = await fetch(`/api/records/${idRef.current}`, {
          method: "PATCH",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: dateIso,
            content,
            tags: tagNames,
            ...(forceSnapshot ? { snapshot: true } : {}),
          }),
        });
        if (!res.ok) throw new Error("patch failed");
        if (forceSnapshot) {
          sessionDirtyRef.current = false;
          if (historyOpen) void loadHistory(idRef.current);
        }
      }
      dirtyRef.current = false;
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      savingRef.current = false;
      if (needsResaveRef.current) {
        needsResaveRef.current = false;
        void saveRef.current();
      }
    }
  }, [router, historyOpen, loadHistory]);

  useEffect(() => { saveRef.current = save; }, [save]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 1500);
  }, [save]);

  const flush = useCallback((opts?: { snapshot?: boolean }) => {
    if (opts?.snapshot) snapshotNextRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    return save();
  }, [save]);

  const commitVersion = useCallback(async () => {
    if (!idRef.current || !sessionDirtyRef.current) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    snapshotNextRef.current = true;
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    await save();
  }, [save]);

  useEffect(() => { commitVersionRef.current = commitVersion; }, [commitVersion]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!idRef.current) return;
    idleTimerRef.current = setTimeout(() => {
      void commitVersionRef.current();
    }, IDLE_VERSION_MS);
  }, [IDLE_VERSION_MS]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ document: false }),
      TitleDocument,
      LockedTitleH1,
      TaskList,
      TaskItemWithId.configure({
        HTMLAttributes: { "data-type": "taskItem" },
      }),
    ],
    content: ensureTitleH1(record?.content ?? EMPTY_DOC),
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      contentRef.current = ed.getJSON();
      dirtyRef.current = true;
      sessionDirtyRef.current = true;
      scheduleSave();
      resetIdleTimer();
    },
    onCreate: ({ editor: ed }) => {
      ed.view.dispatch(ed.state.tr);
    },
    onBlur: () => {
      if (dirtyRef.current) flush();
    },
  });

  useEffect(() => {
    const onBeforeUnload = () => {
      if (!idRef.current) {
        if (dirtyRef.current) save();
        return;
      }
      if (!sessionDirtyRef.current && !dirtyRef.current) return;
      const body = JSON.stringify({
        date: localInputToIso(dateRef.current),
        content: contentRef.current,
        tags: tagsRef.current,
        ...(sessionDirtyRef.current ? { snapshot: true } : {}),
      });
      void fetch(`/api/records/${idRef.current}`, {
        method: "PATCH",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body,
      });
      sessionDirtyRef.current = false;
      dirtyRef.current = false;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [save]);

  useEffect(() => {
    if (editor && process.env.NODE_ENV !== "production") {
      (window as unknown as { __editor?: unknown }).__editor = editor;
    }
  }, [editor]);

  const onDateChange = (value: string) => {
    setDateLocal(value);
    dateRef.current = value;
    dirtyRef.current = true;
    sessionDirtyRef.current = true;
    scheduleSave();
    resetIdleTimer();
  };

  const onTagsChange = (next: TagValue[]) => {
    setTags(next);
    tagsRef.current = next;
    dirtyRef.current = true;
    sessionDirtyRef.current = true;
    scheduleSave();
    resetIdleTimer();
  };

  useEffect(() => {
    if (status === "error") {
      const t = setTimeout(save, 3000);
      return () => clearTimeout(t);
    }
  }, [status, save]);

  const back = async () => {
    await commitVersion();
    if (dirtyRef.current) await flush();
    router.back();
  };

  const deleteRecord = async () => {
    if (!recordId) return;
    if (!confirm("¿Eliminar esta entrada? No se puede deshacer.")) return;
    const res = await fetch(`/api/records/${recordId}`, { method: "DELETE" });
    if (res.ok) router.push("/");
  };

  useEffect(() => {
    if (recordId && record) void loadHistory(recordId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar / cambiar id
  }, [recordId]);

  const current = versions.find((v) => v.isCurrent) ?? versions[0];
  const viewing = viewingId ? versions.find((v) => v.id === viewingId) : null;
  const isDiffMode = historyOpen && !!viewing && !viewing.isCurrent;

  async function openHistory() {
    if (!recordId) return;
    setHistoryOpen(true);
    const list = (await loadHistory(recordId)) ?? versions;
    const past = list.find((v) => !v.isCurrent);
    setViewingId(past?.id ?? list.find((v) => v.isCurrent)?.id ?? null);
  }

  function closeHistory() {
    setHistoryOpen(false);
    setViewingId(null);
  }

  function backToCurrent() {
    setViewingId(current?.id ?? "current");
    closeHistory();
  }

  async function restoreVersion() {
    if (!viewing || viewing.isCurrent || !editor || !recordId || viewing.id === "current") return;
    setRestoring(true);
    try {
      await flush({ snapshot: true });
      const res = await fetch(`/api/records/${recordId}/revisions/${viewing.id}/restore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("restore failed");
      const fresh = (await res.json()) as { content: unknown };
      editor.commands.setContent(fresh.content ?? EMPTY_DOC);
      contentRef.current = editor.getJSON();
      dirtyRef.current = false;
      setStatus("saved");
      const list = await loadHistory(recordId);
      setViewingId(list?.find((v) => v.isCurrent)?.id ?? "current");
      setHistoryOpen(true);
    } finally {
      setRestoring(false);
    }
  }

  const dateIso = localInputToIso(dateLocal);
  const { weekday, dayNumber, monthYear } = formatDayHeader(dateLocal.slice(0, 10));
  const dateLabel = `${weekday.slice(0, 3)}, ${monthYear.split(" ")[0]?.slice(0, 3) ?? ""} ${dayNumber}`;
  const timeLabel = formatTime(dateIso);
  const viewingTimeShort = viewing?.timeLabel.replace(/\s*[ap]\.?m\.?/i, "").trim() ?? "";
  const isNew = !record;

  return (
    <div className="flex h-dvh flex-col bg-[#F6F5F2]">
      <header className="grid shrink-0 grid-cols-12 border-b border-[#ECEAE5] bg-white px-4 py-3 md:px-7 md:py-3.5">
        <div className="col-span-12 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 md:gap-3.5">
            <button
              type="button"
              onClick={() => void back()}
              className="shrink-0 text-[#4a4a45] transition hover:text-[#1a1a1a]"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <span className="truncate text-base font-semibold text-[#1a1a1a]">{dateLabel}</span>
            <SaveLabel status={status} isNew={isNew} />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!isNew && (
              <button
                type="button"
                onClick={() => (historyOpen ? closeHistory() : void openHistory())}
                className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm transition md:px-3.5 ${
                  historyOpen
                    ? "border-[1.5px] border-[#1a1a1a] bg-[#EFEDE8] font-medium text-[#1a1a1a]"
                    : "border-[#DEDCD6] bg-white text-[#4a4a45] hover:bg-[#F4F2ED]"
                }`}
              >
                <History className="h-4 w-4" strokeWidth={1.8} />
                <span className="hidden sm:inline">Historial</span>
              </button>
            )}

            {recordId && (
              <div className="group relative">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#DEDCD6] bg-white text-[#8a8a84] transition hover:bg-[#F4F2ED]"
                  aria-label="Más acciones"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <div className="invisible absolute right-0 top-full z-30 mt-1 w-44 rounded-[10px] border border-[#E7E5DF] bg-white py-1 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => void deleteRecord()}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar entrada
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-12 border-b border-[#ECEAE5] bg-white">
        <div className="col-span-12">
          <Toolbar editor={editor} />
        </div>
      </div>

      {/* Una sola zona de scroll: la hoja crece con el contenido */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-12 gap-4 px-4 py-6 pb-16 md:gap-5 md:px-7 md:py-9">
          <div
            className={`col-span-12 flex flex-col gap-4 md:gap-5 ${
              historyOpen ? "lg:col-span-8" : "lg:col-span-12 "
            }`}
          >
            <article
              className={`flex flex-col rounded-2xl border border-[#E7E5DF] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] ${
                isNew
                  ? "min-h-[14rem] sm:min-h-[16rem]"
                  : "min-h-[20rem] "
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-[#F0EEE9] px-4 py-4 sm:gap-3 sm:px-7 sm:py-[18px]">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#8a8a84] transition hover:text-[#4a4a45] sm:gap-3">
                  <Clock className="h-[15px] w-[15px] shrink-0" strokeWidth={1.8} />
                  <span className="whitespace-nowrap">
                    {dateLabel} · {timeLabel}
                  </span>
                  <input
                    type="datetime-local"
                    value={dateLocal}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="sr-only"
                    aria-label="Fecha y hora"
                  />
                </label>
                <span className="hidden h-4 w-px bg-[#ECEAE5] sm:block" />
                <TagsField value={tags} onChange={onTagsChange} onAfterChange={flush} />
                {isDiffMode && (
                  <span className="w-full rounded-md bg-[#EFEAFD] px-2.5 py-0.5 text-xs font-semibold text-[#6D28D9] sm:ml-auto sm:w-auto">
                    Viendo versión de {viewingTimeShort}
                  </span>
                )}
              </div>

              {/* Sin flex-1/overflow: la altura sigue al TipTap */}
              <div className={`px-4 py-5 sm:px-7 sm:py-[26px] ${isNew ? "min-h-[8rem]" : "min-h-[12rem] sm:min-h-[16rem]"}`}>
                {isDiffMode && viewing ? (
                  <VersionPreview
                    content={viewing.content}
                    compareTo={current?.content ?? contentRef.current}
                  />
                ) : (
                  <EditorContent editor={editor} className="prose-editor prose-editor--sheet" />
                )}
              </div>

              <div className="border-t border-[#F0EEE9] bg-[#FCFBF9] rounded-b-2xl">
                {isDiffMode ? (
                  <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-7">
                    <p className="text-[13px] text-[#8a8a84]">
                      <span className="text-[#166534]">verde</span> = agregado ·{" "}
                      <span className="text-[#991B1B]">rojo</span> = eliminado (vs. la actual)
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={backToCurrent}
                        className="rounded-[10px] border border-[#DEDCD6] bg-white px-4 py-2 text-sm text-[#4a4a45] transition hover:bg-[#F4F2ED]"
                      >
                        Volver a la actual
                      </button>
                      <button
                        type="button"
                        onClick={() => void restoreVersion()}
                        disabled={restoring}
                        className="rounded-[10px] bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:opacity-60"
                      >
                        {restoring ? "Restaurando…" : "Restaurar esta versión"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-7">
                    {isNew ? (
                      <p className="text-[13px] text-[#b5b3ad]">
                        Nueva entrada · se guarda sola al escribir
                      </p>
                    ) : (
                      <p className="text-[13px] text-[#b5b3ad]">
                        {editCount > 0 ? (
                          <>
                            Editado {editCount} {editCount === 1 ? "vez" : "veces"} ·{" "}
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void openHistory()}
                          className="text-[#6D28D9] hover:text-[#5B21B6]"
                        >
                          Ver historial de cambios
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </article>

            {recordId && (
              <CommentsSection recordId={recordId} initial={record?.comments ?? []} />
            )}
          </div>

          {historyOpen && (
            <aside className="col-span-12 lg:col-span-4">
              <div className="lg:sticky lg:top-4">
                {historyLoading && versions.length === 0 ? (
                  <div className="rounded-2xl border border-[#E7E5DF] bg-white px-5 py-8 text-sm text-[#8a8a84]">
                    Cargando historial…
                  </div>
                ) : (
                  <HistoryPanel
                    versions={versions}
                    viewingId={viewingId}
                    onSelect={setViewingId}
                    onClose={closeHistory}
                  />
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveLabel({ status, isNew }: { status: SaveStatus; isNew: boolean }) {
  if (status === "idle" && isNew) {
    return <span className="hidden text-[13px] text-[#b5b3ad] sm:inline">Borrador</span>;
  }
  if (status === "idle") return null;
  const label =
    status === "saving"
      ? "Guardando…"
      : status === "error"
        ? "No se pudo guardar"
        : "Guardado";
  return (
    <span
      className={`hidden text-[13px] sm:inline ${
        status === "error" ? "text-red-600" : "text-[#b5b3ad]"
      }`}
    >
      {label}
    </span>
  );
}
