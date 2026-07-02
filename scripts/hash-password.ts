import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

// Genera un hash bcrypt para ADMIN_PASSWORD_HASH.
// Uso: npm run hash-password
async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const pw = await rl.question("Password: ");
  if (!pw) {
    console.error("Password vacía.");
    rl.close();
    process.exit(1);
  }
  const hash = await bcrypt.hash(pw, 10);
  // Los hashes bcrypt contienen `$2b$10$...` y dotenv-expand (Next.js) los
  // corrompería al cargar el .env. Los almacenamos base64-encoded (sin `$`).
  // authorize() los decodifica antes de comparar.
  const b64 = Buffer.from(hash, "utf8").toString("base64");
  console.log("\nPegá esto en tu .env.local:");
  console.log(`ADMIN_PASSWORD_HASH="${b64}"`);
  rl.close();
}

main();
