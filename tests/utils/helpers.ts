import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";

/** Márgen de 2px para scroll horizontal (subpixel / scrollbar). */
const HSCROLL_SLACK_PX = 2;

/** Selectores de controles interactivos a auditar. */
export const INTERACTIVE_SELECTOR = [
  "button:visible",
  '[role="button"]:visible',
  'a.rounded-md:visible',
  'a[class*="bg-stone-900"]:visible',
].join(", ");

/**
 * Acciones que no aportan en automatización:
 * - logout / delete → rompen sesión o datos
 * - Open calendar → showPicker() falla fuera de gesto "real" en algunos engines
 */
/**
 * Acciones que no aportan en automatización:
 * - logout / delete → rompen sesión o datos
 * - Open calendar → showPicker() falla en automation
 * - Untitled / entry cards → navegan al editor (lento, flaky en suite paralela)
 * - Add entry (empty-state) → mismo motivo
 */
const SKIP_LABEL_RE =
  /log\s*out|cerrar\s*sesión|sign\s*out|eliminar|borrar|delete|trash|open calendar|abrir calendario|untitled|what happened today|write your first|^\+\s*add entry$/i;

/** Ruido de Next/dev / APIs de date picker en automation. */
function isIgnorableError(text: string): boolean {
  return (
    /Download the React DevTools/i.test(text) ||
    /hydrat/i.test(text) ||
    /Fast Refresh/i.test(text) ||
    /ChunkLoadError/i.test(text) ||
    /hmr-client/i.test(text) ||
    /turbopack/i.test(text) ||
    /showPicker/i.test(text) ||
    /requires a user gesture/i.test(text) ||
    /Failed to load chunk/i.test(text) ||
    /Failed to fetch RSC payload/i.test(text) ||
    /Falling back to browser navigation/i.test(text) ||
    /Load failed/i.test(text)
  );
}

export type ButtonFailure = {
  route: string;
  project: string;
  label: string;
  reason: string;
};

export const buttonFailures: ButtonFailure[] = [];

export function isMobileProject(projectName: string): boolean {
  return projectName.startsWith("Mobile");
}

export function expectsDesktopNav(projectName: string): boolean {
  return !isMobileProject(projectName);
}

export function desktopNav(page: Page): Locator {
  return page.locator("aside").filter({ hasText: "paperTrail" });
}

export function mobileNav(page: Page): Locator {
  return page.locator("nav.fixed.inset-x-0.bottom-0");
}

export const HAMBURGER_TODO =
  "No hay hamburguesa/drawer en el código actual (MobileNav bottom bar).";

export async function gotoRoute(page: Page, route: string) {
  // Retry: Next a veces interrumpe goto con un redirect/refresh concurrente
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt === 2 || !/interrupted|destroyed|Timeout/i.test(msg)) throw e;
      await page.waitForTimeout(200);
    }
  }
  // No networkidle: en next dev HMR nunca “idle” y mata el timeout en mobile
  await page.waitForLoadState("load").catch(() => {});
  await dismissNextOverlay(page);
}

/** El error overlay de Next en `next dev` intercepta clicks (nextjs-portal). */
export async function dismissNextOverlay(page: Page) {
  await page.keyboard.press("Escape").catch(() => {});
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    document
      .querySelectorAll("[data-nextjs-dialog], [data-nextjs-toast]")
      .forEach((el) => el.remove());
  }).catch(() => {});
}

export function attachConsoleGuards(page: Page) {
  const errors: string[] = [];

  page.on("pageerror", (err) => {
    if (isIgnorableError(err.message)) return;
    errors.push(`pageerror: ${err.message}`);
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isIgnorableError(text)) return;
    errors.push(`console: ${text}`);
  });

  return {
    /** Errores desde el último clear (o desde el attach). */
    getErrors: () => [...errors],
    clear: () => {
      errors.length = 0;
    },
    assertClean: async () => {
      expect(errors, errors.join("\n")).toEqual([]);
    },
  };
}

export async function getInteractiveControls(page: Page): Promise<Locator[]> {
  // Solo chrome (nav / aside / header) — no el feed (EntryCards → editor).
  const scoped = page.locator(
    [
      "nav button:visible",
      'nav [role="button"]:visible',
      "aside a.rounded-md:visible",
      'aside a[class*="bg-stone-900"]:visible',
      "aside button:visible",
      "header button:visible",
      'header [role="button"]:visible',
    ].join(", "),
  );
  const n = await scoped.count();
  const out: Locator[] = [];
  for (let i = 0; i < n; i++) {
    const el = scoped.nth(i);
    if (await shouldSkipControl(el)) continue;
    out.push(el);
  }
  return out;
}

async function shouldSkipControl(el: Locator): Promise<boolean> {
  const label =
    (await el.getAttribute("aria-label")) ??
    (await el.innerText().catch(() => "")) ??
    "";
  if (SKIP_LABEL_RE.test(label)) return true;
  if (await el.isDisabled().catch(() => false)) return true;
  return false;
}

export async function controlLabel(el: Locator): Promise<string> {
  const aria = await el.getAttribute("aria-label");
  if (aria) return aria.trim();
  const text = (await el.innerText().catch(() => "")).trim().replace(/\s+/g, " ");
  if (text) return text.slice(0, 80);
  const href = await el.getAttribute("href");
  return href ?? "<unnamed>";
}

export async function assertControlReachable(el: Locator) {
  await expect(el).toBeVisible();
  await el.scrollIntoViewIfNeeded();

  // MobileNav fijo: deja el control por encima del bottom bar
  await el.page().evaluate(() => {
    const nav = document.querySelector(
      "nav.fixed.inset-x-0.bottom-0",
    ) as HTMLElement | null;
    if (!nav) return;
    const style = getComputedStyle(nav);
    if (style.display === "none" || style.visibility === "hidden") return;
    const pad = nav.getBoundingClientRect().height + 16;
    window.scrollBy(0, -pad);
  });

  const box = await el.boundingBox();
  expect(box, "sin boundingBox").toBeTruthy();
  if (!box || box.width < 1 || box.height < 1) {
    throw new Error("control sin área clickable");
  }
}

/**
 * Overlay de la app (no el error dialog de Next.js).
 * Solo comprueba visibilidad si aparece tras el click.
 */
export async function appOverlayVisible(page: Page): Promise<boolean> {
  const overlay = page.locator(
    '[role="dialog"]:not([data-nextjs-dialog]), [role="menu"], [role="listbox"], [data-state="open"]',
  );
  const n = await overlay.count();
  for (let i = 0; i < n; i++) {
    if (await overlay.nth(i).isVisible().catch(() => false)) return true;
  }
  return false;
}

export async function checkNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `scroll horizontal indeseado: scrollWidth=${scrollWidth} clientWidth=${clientWidth}`,
  ).toBeLessThanOrEqual(clientWidth + HSCROLL_SLACK_PX);
}

export async function scrollToBottomAndCheckFooter(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight * 0.8, 200);
    let prev = -1;
    while (document.documentElement.scrollTop !== prev) {
      prev = document.documentElement.scrollTop;
      window.scrollBy(0, step);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  });

  const last = page.locator("main *, [class*='overflow-y'] > *").last();
  if ((await last.count()) === 0) return;
  await expect(last).toBeInViewport({ ratio: 0.1 });
}

export async function scrollInternalContainers(page: Page) {
  const scrollers = page.locator(
    '.overflow-y-auto, .overflow-y-scroll, [class*="overflow-y-auto"]',
  );
  const n = await scrollers.count();
  for (let i = 0; i < n; i++) {
    const scroller = scrollers.nth(i);
    if (!(await scroller.isVisible().catch(() => false))) continue;
    await scroller.evaluate((node) => {
      const el = node as HTMLElement;
      el.scrollTop = el.scrollHeight;
      el.scrollTop = 0;
      el.scrollTop = el.scrollHeight / 2;
    });
  }
}

/**
 * Heurística de overlaps: ignora chrome fixed/sticky (MobileNav, headers)
 * porque se solapan con el contenido a propósito.
 */
export async function checkNoObviousOverlaps(page: Page) {
  const positions = [0, 0.5, 1];
  for (const p of positions) {
    await page.evaluate((ratio) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, Math.max(0, max * ratio));
    }, p);
    await page.waitForTimeout(50);

    const overlaps = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll("h1, h2, main button, main [role='button']"),
      ) as HTMLElement[];

      const boxes = nodes
        .filter((el) => {
          const style = getComputedStyle(el);
          if (style.position === "fixed" || style.position === "sticky") return false;
          if (el.closest("nav.fixed, aside")) return false;
          const r = el.getBoundingClientRect();
          return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight;
        })
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { t: el.tagName, x: r.x, y: r.y, w: r.width, h: r.height };
        });

      const hits: string[] = [];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
          const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
          // Overlap sustancial (no bordes compartidos)
          if (ox > 16 && oy > 16 && ox * oy > 256) {
            hits.push(`${a.t}@${Math.round(a.x)},${Math.round(a.y)} ∩ ${b.t}`);
          }
        }
      }
      return hits.slice(0, 5);
    });

    expect(overlaps, `overlaps en scroll ${p}: ${overlaps.join("; ")}`).toEqual([]);
  }
}

export async function recordButtonFailure(
  info: TestInfo,
  failure: ButtonFailure,
) {
  buttonFailures.push(failure);
  await info.attach("button-failure", {
    body: JSON.stringify(failure, null, 2),
    contentType: "application/json",
  });
}

export function formatButtonFailureReport(): string {
  if (buttonFailures.length === 0) return "OK: ningún botón falló.";
  return buttonFailures
    .map((f) => `[${f.project}] ${f.route} → "${f.label}": ${f.reason}`)
    .join("\n");
}
