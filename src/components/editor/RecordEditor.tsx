"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskList } from "@tiptap/extension-list";
import { Toolbar } from "./Toolbar";
import { TagsField, type TagValue } from "./TagsField";
import { TaskItemWithId } from "./TaskItemWithId";
import { CommentsSection, type CommentData } from "./CommentsSection";
import { isoToLocalInput, localInputToIso } from "@/lib/timezone";

const EMPTY_DOC = { type: "doc", content: [] };

export type RecordData = {
  id: string;
  date: string; // ISO
  content: unknown;
  tags: { id: string; name: string; color?: string | null }[];
  comments: CommentData[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function relTime(savedAt: number, now: number): string {
  const s = Math.max(0, Math.floor((now - savedAt) / 1000));
  if (s < 2) return "Guardado";
  if (s < 60) return `Guardado hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `Guardado hace ${m}m`;
  return `Guardado hace ${Math.floor(m / 60)}h`;
}

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
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(0);

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

  // Reloj para el "hace Xs" del indicador de guardado.
  useEffect(() => {
    if (status !== "saved") return;
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, [status]);

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
      setSavedAt(Date.now());
      setNow(Date.now());
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
    router.push("/");
  };

  const deleteRecord = async () => {
    if (!recordId) return;
    if (!confirm("¿Eliminar este registro? No se puede deshacer.")) return;
    const res = await fetch(`/api/records/${recordId}`, { method: "DELETE" });
    if (res.ok) router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <div className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-sm">
        <header className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={back}
              className="flex h-8 w-8 items-center justify-center rounded-btn text-text-2 hover:bg-surface-2 hover:text-text"
              aria-label="Volver"
              title="Volver"
            >
              ←
            </button>
            <input
              type="datetime-local"
              value={dateLocal}
              onChange={(e) => onDateChange(e.target.value)}
              className="rounded-btn border border-border bg-surface-2 px-2.5 py-1.5 text-sm tabular-nums text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              title="Fecha y hora del registro"
            />
          </div>
          <div className="flex items-center gap-2">
            {recordId && (
              <button
                type="button"
                onClick={() => void deleteRecord()}
                className="rounded-btn px-2.5 py-1.5 text-sm text-text-2 hover:bg-surface-2 hover:text-[#B42318]"
                title="Eliminar registro"
              >
                Eliminar
              </button>
            )}
            <SaveIndicator status={status} savedAt={savedAt} now={now} />
          </div>
        </header>

        <Toolbar editor={editor} className="border-b-0" />
      </div>

      <div className="mx-auto w-full max-w-[760px] flex-1 px-4 py-6">
        <EditorContent editor={editor} className="prose-editor" />
        <div className="mt-8 border-t border-border pt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-3">
            Tags
          </div>
          <TagsField value={tags} onChange={onTagsChange} onAfterChange={flush} />
        </div>
        {recordId && (
          <CommentsSection recordId={recordId} initial={record?.comments ?? []} />
        )}
      </div>
    </div>
  );
}

function SaveIndicator({
  status,
  savedAt,
  now,
}: {
  status: SaveStatus;
  savedAt: number | null;
  now: number;
}) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-text-2">
        <span className="h-1.5 w-1.5 rounded-full bg-text-3" />
        Guardando…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-text-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#F59E0B" }} />
        Sin conexión, reintentando
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-text-2">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#16A34A" }} />
      {savedAt ? relTime(savedAt, now) : "Guardado"}
    </span>
  );
}
