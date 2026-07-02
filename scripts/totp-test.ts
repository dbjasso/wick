// Test unitario de la librería TOTP (sin exponer secrets: el secret se genera
// in-memory y no se imprime). Valida round-trip, código incorrecto y base32.
import { createHmac } from "node:crypto";
import { generateSecret, base32Decode, base32Encode, totpNow, verifyTotp } from "../src/lib/totp";

const secret = generateSecret();
const secretBuf = base32Decode(secret);

// Round-trip base32
const rt = base32Encode(secretBuf);
console.log("1) base32 round-trip ->", rt === secret);

// Código actual válido
const code = totpNow(secretBuf);
console.log("2) totpNow ->", code, "(6 dígitos:", /^\d{6}$/.test(code), ")");
console.log("3) verifyTotp(código actual) ->", verifyTotp(code, secretBuf), "(esperado true)");

// Código incorrecto
console.log("4) verifyTotp('000000') ->", verifyTotp("000000", secretBuf), "(probablemente false)");
console.log("5) verifyTotp('abc123') ->", verifyTotp("abc123", secretBuf), "(esperado false, no numérico)");
console.log("6) verifyTotp('12345') (5 dígitos) ->", verifyTotp("12345", secretBuf), "(esperado false, longitud)");

// Un código desplazado +/-2 ventanas (fuera de tolerancia ±1) debe fallar.
function hotp(counter: number) {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const h = createHmac("sha1", secretBuf).update(buf).digest();
  const off = h[h.length - 1] & 0x0f;
  const n = (h.subarray(off, off + 4).readUInt32BE(0) & 0x7fffffff) % 1e6;
  return String(n).padStart(6, "0");
}
const now = Math.floor(Date.now() / 1000 / 30);
const farCode = hotp(now + 2);
console.log("7) verifyTotp(+2 ventanas) ->", verifyTotp(farCode, secretBuf), "(esperado false, fuera de ventana)");
