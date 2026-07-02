// Genera un secret TOTP (base32) para 2FA y muestra la URI otpauth para agregar
// a una app autenticadora (Google Authenticator, Authy, 2FAS, etc.).
// Uso: npx tsx scripts/totp-secret.ts
import { generateSecret, otpauthUri } from "../src/lib/totp";

const account = process.env.ADMIN_EMAIL || "admin@wick.local";
const issuer = "Registros";
const secret = generateSecret();

console.log("\n2FA TOTP setup\n");
console.log(`Secret (base32):  ${secret}`);
console.log("Pegalo en tu .env.local:");
console.log(`ADMIN_TOTP_SECRET="${secret}"\n`);
console.log("URI para la app autenticadora (escaneá con un QR desde esta URI,");
console.log("o agregá el secret manualmente):");
console.log(otpauthUri({ secret, account, issuer }));
console.log("");
