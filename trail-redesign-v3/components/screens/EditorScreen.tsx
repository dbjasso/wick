"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft, Bold, Italic, Underline, Strikethrough, Heading1, Heading2,
  List, ListOrdered, ListChecks, Quote, MoreHorizontal, Minus,
  Trash2, Clock, History, Plus,
} from "lucide-react";
import { TagPill, TagColor } from "../ui/TagPill";
import { DueDateButton } from "../ui/DueDateButton";
import { HistoryPanel, type HistoryVersion } from "./HistoryPanel";

export type DiffSeg = { type: "same" | "add" | "del"; text: string };

export type CommentItem = {
  id: string;
  content: string;
  authorInitials: string;
};

const DEMO_BODY =
  "Llamada con david mercado. Quedamos en enviar la cotización el viernes.";

const DEMO_VERSIONS: HistoryVersion[] = [
  {
    id: "v1",
    timeLabel: "08:15 a.m.",
    author: "diego",
    summary: "editó 2 frases",
    group: "HOY",
    content: DEMO_BODY,
    isCurrent: true,
  },
  {
    id: "v2",
    timeLabel: "08:02 a.m.",
    author: "diego",
    summary: "agregó cotización",
    group: "HOY",
    content: "Llamada con david mercado. Pendiente definir fecha.",
  },
  {
    id: "v3",
    timeLabel: "07:58 a.m.",
    author: "diego",
    summary: "creó la entrada",
    group: "HOY",
    content: "Llamada con david mercado.",
  },
  {
    id: "v4",
    timeLabel: "05:42 p.m.",
    author: "diego",
    summary: 'agregó tag "leafland"',
    group: "AYER",
    content: "Llamada con david mercado.",
  },
];

/* Diff DEMO entre versión vista y la actual — sin lib. */
const DEMO_DIFFS: Record<string, DiffSeg[]> = {
  v2: [
    { type: "same", text: "Llamada con david mercado. " },
    { type: "del", text: "Pendiente definir fecha." },
    { type: "add", text: "Quedamos en enviar la cotización el viernes." },
  ],
  v3: [
    { type: "same", text: "Llamada con david mercado." },
    { type: "add", text: " Quedamos en enviar la cotización el viernes." },
  ],
  v4: [
    { type: "same", text: "Llamada con david mercado." },
    { type: "add", text: " Quedamos en enviar la cotización el viernes." },
  ],
};

/* Editor — cada to-do lleva al inicio un botón de fecha de ejecución
   (icono calendario → chip con la fecha). Para TipTap:
   extender TaskItem con un atributo `dueDate` y un NodeView que
   renderice <TaskRow /> — ver README-CURSOR.md §TipTap. */

export function EditorScreen({
  dateLabel = "Wed, Jul 15",
  timeLabel = "08:15 a.m.",
  tags: tagsProp = [{ name: "leafland", color: "pink" as TagColor }],
  saveLabel = "Guardado hace 2 min",
  editCount = 3,
  initialBody = DEMO_BODY,
  initialVersions = DEMO_VERSIONS,
  initialComments = [] as CommentItem[],
  authorInitials = "DI",
  onBack,
  onAddTag,
  onRemoveTag,
  onDelete,
  onSave,
  children,
}: {
  dateLabel?: string;
  timeLabel?: string;
  tags?: { name: string; color: TagColor }[];
  saveLabel?: string;
  editCount?: number;
  initialBody?: string;
  initialVersions?: HistoryVersion[];
  initialComments?: CommentItem[];
  authorInitials?: string;
  onBack?: () => void;
  onAddTag?: () => void;
  onRemoveTag?: (name: string) => void;
  onDelete?: () => void;
  onSave?: (body: string) => void;
  children?: React.ReactNode;
}) {
  const [body, setBody] = useState(initialBody);
  const [tags, setTags] = useState(tagsProp);
  const [versions, setVersions] = useState(initialVersions);
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState(saveLabel);

  const current = versions.find((v) => v.isCurrent) ?? versions[0];
  const viewing = viewingId ? versions.find((v) => v.id === viewingId) : null;
  const isDiffMode = !!viewing && !viewing.isCurrent;

  const diffSegs = useMemo(() => {
    if (!viewingId || !isDiffMode) return null;
    return DEMO_DIFFS[viewingId] ?? [{ type: "same" as const, text: viewing?.content ?? "" }];
  }, [viewingId, isDiffMode, viewing?.content]);

  function openHistory(selectId?: string) {
    setHistoryOpen(true);
    setViewingId(selectId ?? current?.id ?? null);
  }

  function closeHistory() {
    setHistoryOpen(false);
    setViewingId(null);
  }

  function selectVersion(id: string) {
    setViewingId(id);
  }

  function backToCurrent() {
    setViewingId(current?.id ?? null);
  }

  function restoreVersion() {
    if (!viewing || viewing.isCurrent) return;
    const content = viewing.content;
    setBody(content);
    setVersions((prev) =>
      prev.map((v) => ({
        ...v,
        isCurrent: v.id === viewing.id,
        content: v.id === viewing.id ? content : v.content,
        summary: v.id === viewing.id ? "restauró esta versión" : v.summary,
      })),
    );
    setViewingId(viewing.id);
    setSavedLabel("Guardado ahora");
  }

  function handleSave() {
    onSave?.(body);
    setSavedLabel("Guardado ahora");
  }

  function addComment() {
    const value = commentText.trim();
    if (!value) return;
    setComments((c) => [
      ...c,
      { id: `c-${Date.now()}`, content: value, authorInitials },
    ]);
    setCommentText("");
  }

  function removeTag(name: string) {
    setTags((t) => t.filter((x) => x.name !== name));
    onRemoveTag?.(name);
  }

  return (
    <div className="flex h-screen bg-stone-50">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 md:px-5">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="rounded-md p-1.5 text-stone-500 transition hover:bg-stone-200/60 hover:text-stone-900"
              aria-label="Volver"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm font-medium text-stone-900">{dateLabel}</p>
              <p className="text-xs text-stone-400">{savedLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => (historyOpen ? closeHistory() : openHistory())}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                historyOpen
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              Historial
            </button>

            <div className="group relative">
              <button
                className="rounded-md border border-stone-200 bg-white p-1.5 text-stone-400 transition hover:border-stone-300 hover:text-stone-700"
                aria-label="Más acciones"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <div className="invisible absolute right-0 top-full z-10 mt-1 w-44 rounded-md border border-stone-200 bg-white py-1 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100">
                <button
                  onClick={onDelete}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar entrada
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mx-3 flex items-center gap-0.5 overflow-x-auto rounded-md border border-stone-200 bg-white px-2 py-1 md:mx-5 [scrollbar-width:none]">
          <ToolbarBtn label="Bold"><Bold className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Italic"><Italic className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Underline"><Underline className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolbarBtn>
          <Divider />
          <ToolbarBtn label="Heading 1"><Heading1 className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Heading 2"><Heading2 className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Divider"><Minus className="h-4 w-4" /></ToolbarBtn>
          <Divider />
          <ToolbarBtn label="Numbered list"><ListOrdered className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Checklist" active><ListChecks className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Bullet list"><List className="h-4 w-4" /></ToolbarBtn>
          <ToolbarBtn label="Quote"><Quote className="h-4 w-4" /></ToolbarBtn>
        </div>

        {/* Sheet + comments */}
        <div className="flex-1 overflow-y-auto px-3 py-4 md:px-5">
          <div className="mx-auto max-w-2xl space-y-4 pb-16">
            {/* Visible sheet */}
            <div className="rounded-lg border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-4 py-3 md:px-5">
                <span className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Clock className="h-3.5 w-3.5" />
                  {dateLabel} · {timeLabel}
                </span>
                <span className="h-3.5 w-px bg-stone-200" />
                {tags.map((t) => (
                  <TagPill
                    key={t.name}
                    name={t.name}
                    color={t.color}
                    size="xs"
                    onRemove={isDiffMode ? undefined : () => removeTag(t.name)}
                  />
                ))}
                {!isDiffMode && (
                  <button
                    onClick={onAddTag}
                    className="flex items-center gap-1 rounded border border-dashed border-stone-300 px-2 py-0.5 text-xs text-stone-400 transition hover:border-stone-400 hover:text-stone-600"
                  >
                    <Plus className="h-3 w-3" />
                    Tag
                  </button>
                )}
                {isDiffMode && viewing && (
                  <span className="ml-auto text-xs font-medium text-violet-600">
                    Viendo versión de {viewing.timeLabel.replace(/\s*[ap]\.?m\.?/i, "").trim()}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="px-4 py-5 md:px-5 md:py-6">
                {isDiffMode && diffSegs ? (
                  <div className="trail-prose">
                    <p>
                      {diffSegs.map((s, i) => (
                        <span
                          key={i}
                          className={
                            s.type === "add" ? "diff-add" : s.type === "del" ? "diff-del" : undefined
                          }
                        >
                          {s.text}
                        </span>
                      ))}
                    </p>
                  </div>
                ) : (
                  <div className="trail-prose">
                    {children ?? (
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Sigue escribiendo... usa [] para un to-do, # para tags"
                        rows={6}
                        className="w-full resize-none bg-transparent font-[inherit] text-[inherit] leading-[inherit] text-stone-900 placeholder:text-stone-300 focus:outline-none"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 md:px-5">
                {isDiffMode ? (
                  <>
                    <p className="text-xs text-stone-400">
                      <span className="text-green-600">verde = agregado</span>
                      {" · "}
                      <span className="text-red-600">rojo = eliminado</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={backToCurrent}
                        className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-300"
                      >
                        Volver a la actual
                      </button>
                      <button
                        onClick={restoreVersion}
                        className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-stone-800"
                      >
                        Restaurar esta versión
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openHistory()}
                      className="text-xs font-medium text-violet-600 transition hover:text-violet-700"
                    >
                      Editado {editCount} veces · Ver historial de cambios
                    </button>
                    <button
                      onClick={handleSave}
                      className="rounded-md bg-stone-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-stone-800"
                    >
                      Guardar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Comments */}
            {!isDiffMode && (
              <div className="rounded-lg border border-stone-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] md:px-5">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-stone-400">
                  Comentarios
                </p>

                {comments.length > 0 && (
                  <ul className="mb-3 space-y-2">
                    {comments.map((c) => (
                      <li key={c.id} className="flex gap-2.5 text-sm text-stone-700">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-medium text-stone-600">
                          {c.authorInitials}
                        </span>
                        <span className="pt-1">{c.content}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[11px] font-medium text-stone-600">
                    {authorInitials}
                  </span>
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addComment();
                    }}
                    placeholder="Agregar un comentario..."
                    className="min-w-0 flex-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none"
                  />
                  <button
                    onClick={addComment}
                    disabled={!commentText.trim()}
                    className="shrink-0 rounded-md bg-stone-100 px-3 py-2 text-xs font-medium text-stone-600 transition hover:bg-stone-200 disabled:cursor-default disabled:opacity-50"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History side panel */}
      {historyOpen && (
        <>
          <button
            className="fixed inset-0 z-20 bg-stone-900/20 md:hidden"
            aria-label="Cerrar historial"
            onClick={closeHistory}
          />
          <div className="fixed inset-y-0 right-0 z-30 w-[min(100%,20rem)] md:relative md:z-0 md:w-auto">
            <HistoryPanel
              versions={versions}
              viewingId={viewingId}
              onSelect={selectVersion}
              onClose={closeHistory}
            />
          </div>
        </>
      )}
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

function ToolbarBtn({
  children,
  label,
  active = false,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`shrink-0 rounded p-1.5 transition ${
        active ? "bg-violet-50 text-violet-700" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px shrink-0 bg-stone-200" />;
}
