import { tagColor } from "@/lib/tag-colors";

export function TagPill({
  name,
  onClick,
  onRemove,
  href,
}: {
  name: string;
  onClick?: () => void;
  onRemove?: () => void;
  href?: string;
}) {
  const c = tagColor(name);
  const style = { backgroundColor: c.bg, color: c.text, borderColor: c.border };

  const content = (
    <span
      style={style}
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: c.dot }}
      />
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full px-1 leading-none hover:opacity-70"
          aria-label={`Quitar ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );

  if (href) {
    return (
      <a href={href} className="inline-flex">
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="inline-flex">
        {content}
      </button>
    );
  }
  return content;
}
