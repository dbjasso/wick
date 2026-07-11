"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList } from "@tiptap/extension-list";
import { ArrowLeft, MoreHorizontal, Trash2, Clock } from "lucide-react";
import { Toolbar } from "./Toolbar";
import { TagsField, type TagValue } from "./TagsField";
import { TaskItemWithId } from "./TaskItemWithId";
import { CommentsSection, type CommentData } from "./CommentsSection";
import {
  isoToLocalInput,
  localInputToIso,
  formatDayHeader,
  formatTime,
} from "@/lib/timezone";

const EMPTY_DOC = { type: "doc", content: [] };

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

  // Refs para evitar closures stale dentro del debounce / beforeunload.
  const contentRef = useRef<unknown>(record?.content ?? EMPTY_DOC);
  const dateRef = useRef(dateLocal);
  const idRef = useRef(recordId);
  const tagsRef = useRef(tags);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const needsResaveRef = useRef(false);
  const saveRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => { dateRef.current = dateLocal; }, [dateLocal]);
  useEffect(() => { idRef.current = recordId; }, [recordId]);
  useEffect(() => { tagsRef.current = tags; }, [tags]);

  const save = useCallback(async () => {
    if (!dirtyRef.current) return;
    // Si ya hay un save en vuelo, marcamos para re-guardar al terminar (sin
    // intercalar dos POST/PATCH). ponytail: ceiling — si llegan más cambios
    // durante el save en vuelo, sólo se persiste el último estado al terminar.
    if (savingRef.current) {
      needsResaveRef.current = true;
      return;
    }
    const content = contentRef.current;
    const dateIso = localInputToIso(dateRef.current);
    const tagNames = tagsRef.current;
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
        // Reemplazo la URL para que un reload conserve el registro recién creado.
        router.replace(`/registros/${created.id}/editar`);
      } else {
        const res = await fetch(`/api/records/${idRef.current}`, {
          method: "PATCH",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: dateIso, content, tags: tagNames }),
        });
        if (!res.ok) throw new Error("patch failed");
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
  }, [router]);

  useEffect(() => { saveRef.current = save; }, [save]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 1500);
  }, [save]);

  // Flush = guardar ya (sin esperar al debounce). Usado en blur, back y beforeunload.
  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    return save();
  }, [save]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItemWithId.configure({
        HTMLAttributes: { "data-type": "taskItem" },
      }),
    ],
    content: record?.content ?? EMPTY_DOC,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      contentRef.current = editor.getJSON();
      dirtyRef.current = true;
      scheduleSave();
    },
    onCreate: ({ editor }) => {
      // Dispara appendTransaction para asignar nodeIds únicos al cargar.
      editor.view.dispatch(editor.state.tr);
    },
    onBlur: () => {
      if (dirtyRef.current) flush();
    },
  });

  // beforeunload: mejor esfuerzo (keepalive) para no perder cambios al cerrar/recargar.
  useEffect(() => {
    const onBeforeUnload = () => {
      if (dirtyRef.current) save();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [save]);

  // Debug dev-only: expone el editor para inspección/testing desde la consola.
  useEffect(() => {
    if (editor && process.env.NODE_ENV !== "production") {
      (window as unknown as { __editor?: unknown }).__editor = editor;
    }
  }, [editor]);

  const onDateChange = (value: string) => {
    setDateLocal(value);
    dateRef.current = value;
    dirtyRef.current = true;
    scheduleSave();
  };

  const onTagsChange = (next: TagValue[]) => {
    setTags(next);
    tagsRef.current = next;
    dirtyRef.current = true;
    scheduleSave();
  };

  // Reintento automático tras un fallo.
  useEffect(() => {
    if (status === "error") {
      const t = setTimeout(save, 3000);
      return () => clearTimeout(t);
    }
  }, [status, save]);

  const back = async () => {
    await flush();
    router.back();
  };

  const deleteRecord = async () => {
    if (!recordId) return;
    if (!confirm("Delete this entry? This can't be undone.")) return;
    const res = await fetch(`/api/records/${recordId}`, { method: "DELETE" });
    if (res.ok) router.push("/");
  };

  const dateIso = localInputToIso(dateLocal);
  const { weekday, dayNumber, monthYear } = formatDayHeader(
    dateLocal.slice(0, 10),
  );
  const dateLabel = `${weekday.slice(0, 3)}, ${monthYear.split(" ")[0]?.slice(0, 3) ?? ""} ${dayNumber}`;

  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2.5 md:px-4">
        <button
          type="button"
          onClick={back}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {dateLabel}
        </button>

        <div className="flex items-center gap-2">
          <SaveIndicator status={status} />
          {recordId && (
            <div className="group relative">
              <button
                type="button"
                className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <div className="invisible absolute right-0 top-full z-10 mt-1 w-44 rounded-md border border-stone-200 bg-white py-1 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => void deleteRecord()}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete entry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toolbar editor={editor} />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 pb-32 pt-8 md:px-8 md:pt-12">
          <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 pb-5">
            <label className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs text-stone-500 transition hover:bg-stone-100">
              <Clock className="h-3.5 w-3.5" />
              <span className="tabular-nums">
                {dateLabel} · {formatTime(dateIso)}
              </span>
              <input
                type="datetime-local"
                value={dateLocal}
                onChange={(e) => onDateChange(e.target.value)}
                className="sr-only"
                aria-label="Entry date and time"
              />
            </label>
            <span className="h-3.5 w-px bg-stone-200" />
            <TagsField value={tags} onChange={onTagsChange} onAfterChange={flush} />
          </div>

          <EditorContent editor={editor} className="prose-editor pt-6" />

          {recordId && (
            <CommentsSection recordId={recordId} initial={record?.comments ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const color =
    status === "saved"
      ? "bg-emerald-500"
      : status === "saving"
        ? "animate-pulse bg-amber-400"
        : "bg-red-500";
  const label =
    status === "saved" ? "Saved" : status === "saving" ? "Saving…" : "Couldn't save";
  return (
    <span className="flex items-center gap-1.5 text-xs text-stone-400">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
