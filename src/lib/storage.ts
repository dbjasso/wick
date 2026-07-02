import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";

// Adaptador de almacenamiento — filesystem local para desarrollo.
// ponytail: en Vercel no hay disco persistente; al desplegar hay que migrar
// upload/getUrl/delete/getStream a Vercel Blob o S3-compatible (ver Tarea 9).
// La interfaz (upload/getUrl/delete/getStream) es lo que el resto del código usa,
// así el swap no toca las rutas ni la UI.

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

// Tipos permitidos: documentos, imágenes, audio/video, texto. Bloqueamos
// ejecutables/scripting para evitar servir contenido activo peligroso aunque
// la descarga esté detrás de sesión.
const ALLOWED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/msword",
  "application/vnd.ms-powerpoint",
  "application/zip",
  "audio/mpeg",
  "audio/ogg",
  "video/mp4",
  "video/webm",
];

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function validateUpload(mimeType: string, size: number) {
  if (!mimeType) throw new UploadError("Tipo de archivo desconocido.");
  if (!ALLOWED_MIME.includes(mimeType.toLowerCase())) {
    throw new UploadError(`Tipo no permitido: ${mimeType}`, 415);
  }
  if (size > MAX_UPLOAD_BYTES) {
    throw new UploadError(`Archivo demasiado grande (máx ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).`);
  }
}

export type Uploaded = { key: string; size: number; mimeType: string };

export async function upload(input: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<Uploaded> {
  validateUpload(input.mimeType, input.buffer.length);
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(input.filename) || "";
  const key = `${randomUUID()}${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, key), input.buffer);
  return { key, size: input.buffer.length, mimeType: input.mimeType };
}

export function localPath(key: string): string {
  // Defensa mínima contra path traversal: la key es un UUID nuestro, pero por
  // si llegara un valor manipulado, nos aseguramos de no salir de UPLOAD_DIR.
  const full = path.join(UPLOAD_DIR, path.basename(key));
  if (!full.startsWith(UPLOAD_DIR)) throw new UploadError("Clave inválida.", 400);
  return full;
}

export async function getBuffer(key: string): Promise<Buffer> {
  return fs.readFile(localPath(key));
}

export function getStream(key: string): Readable {
  return createReadStream(localPath(key));
}

export async function remove(key: string): Promise<void> {
  await fs.rm(localPath(key), { force: true });
}

// URL pública de descarga. En local se sirve via route handler protegido por
// sesión (GET /api/documents/:id). En un adaptador Blob/S3 esto devolvería una
// URL firmada y la route podría redirigir en vez de streamear.
export function getUrl(docId: string): string {
  return `/api/documents/${docId}`;
}
