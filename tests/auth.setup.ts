import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH_FILE = path.join("playwright", ".auth", "user.json");

/** ponytail: parser mínimo de .env — evita dependencia dotenv solo para E2E. */
function loadDotEnv() {
  for (const file of [".env", ".env.local"]) {
    try {
      const raw = fs.readFileSync(path.resolve(file), "utf8");
      for (const line of raw.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const i = t.indexOf("=");
        if (i < 0) continue;
        const key = t.slice(0, i).trim();
        let val = t.slice(i + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        // .env.local pisa .env
        if (file === ".env.local" || process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    } catch {
      /* archivo ausente */
    }
  }
}

/**
 * Guarda sesión autenticada para el resto de projects.
 *
 * Requiere:
 *   E2E_EMAIL (o ADMIN_EMAIL) + E2E_PASSWORD
 *
 * Si tienes 2FA (ADMIN_TOTP_SECRET), setea también E2E_TOTP con un código válido
 * en el momento del run (o desactiva TOTP en local para E2E).
 */
setup("authenticate", async ({ page }) => {
  loadDotEnv();
  const email = process.env.E2E_EMAIL ?? process.env.ADMIN_EMAIL;
  const password = process.env.E2E_PASSWORD;
  const totp = process.env.E2E_TOTP;

  if (!email || !password) {
    throw new Error(
      "Faltan credenciales E2E. Exporta E2E_EMAIL (o ADMIN_EMAIL) y E2E_PASSWORD antes de correr playwright.",
    );
  }

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto("/login");
  await page.getByLabel(/correo/i).fill(email!);
  await page.getByLabel(/contraseña/i).fill(password!);

  const totpField = page.getByLabel(/código 2fa|2fa|totp/i);
  if (await totpField.isVisible().catch(() => false)) {
    // TODO: si 2FA está activo y no hay E2E_TOTP, el setup fallará aquí.
    expect(totp, "E2E_TOTP requerido cuando 2FA está habilitado").toBeTruthy();
    await totpField.fill(totp!);
  }

  await page.getByRole("button", { name: /iniciar sesión/i }).click();

  // Tras login: / o redirect a /admin/accounts (admin sin journal account)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
