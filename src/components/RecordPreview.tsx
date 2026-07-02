import { previewSegments } from "@/lib/tiptap-text";

export function RecordPreview({ content }: { content: unknown }) {
  const { title, segments } = previewSegments(content);

  if (!title && segments.length === 0) {
    return <p className="text-sm text-text-3">Sin contenido</p>;
  }

  return (
    <div>
      {title && (
        <h3 className="line-clamp-1 text-sm font-semibold text-text">{title}</h3>
      )}
      {segments.length > 0 && (
        <p className="mt-0.5 line-clamp-2 text-sm text-text-2">
          {segments.map((s, i) => (
            <span key={i} className={s.todo ? "text-text-3" : ""}>
              {s.text}{" "}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
