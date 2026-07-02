export type RecordCursor = { date: string; id: string };

export function encodeRecordCursor(c: RecordCursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function parseRecordCursor(raw: string | null): RecordCursor | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(Buffer.from(raw, "base64url").toString()) as RecordCursor;
    if (c.date && c.id) return c;
  } catch {
    /* ignore */
  }
  return null;
}
