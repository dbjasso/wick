import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// TOTP minimalista sin dependencias (RFC 6238 / HOTP con HMAC-SHA1).
// ponytail: implementación propia para evitar agregar otplib. Ceiling: no maneja
// recovery codes ni drift avanzado (sólo ventana ±1 de 30s). Upgrade: migrar a
// otplib si se necesitan recovery codes, más ventanas o RFC 6238 completo.

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  const bits: string[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`carácter base32 inválido: ${ch}`);
    bits.push(idx.toString(2).padStart(5, "0"));
  }
  const all = bits.join("");
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= all.length; i += 8) {
    bytes.push(parseInt(all.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function base32Encode(buf: Buffer): string {
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    out += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return out;
}

export function generateSecret(bytes = 20): string {
  return base32Encode(randomBytes(bytes));
}

function hotp(secret: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  // counter = floor(time/30) => cabe en 32 bits por muchos siglos. Escribimos
  // los 8 bytes big-endian (high 32 = 0).
  // ponytail: si counter >= 2^32 (año ~2170) esto truncaría. Upgrade: BigInt.
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const slice = hmac.subarray(offset, offset + 4);
  const num = (slice.readUInt32BE(0) & 0x7fffffff) % 10 ** digits;
  return num.toString().padStart(digits, "0");
}

export function totpNow(secret: Buffer, step = 30, digits = 6): string {
  return hotp(secret, Math.floor(Date.now() / 1000 / step), digits);
}

// Verifica un código TOTP con tolerancia de ±1 ventana (90s total).
export function verifyTotp(code: string, secret: Buffer, step = 30, digits = 6): boolean {
  if (!/^\d+$/.test(code) || code.length !== digits) return false;
  const now = Math.floor(Date.now() / 1000 / step);
  for (const drift of [0, -1, 1]) {
    const expected = hotp(secret, now + drift, digits);
    const a = Buffer.from(expected);
    const b = Buffer.from(code);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

export function otpauthUri(opts: {
  secret: string;
  account: string;
  issuer: string;
}): string {
  const label = encodeURIComponent(`${opts.issuer}:${opts.account}`);
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer: opts.issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
