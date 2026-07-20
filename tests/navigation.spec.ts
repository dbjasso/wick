import { test, expect } from "@playwright/test";
import { ALL_ROUTES, APP_ROUTES } from "./utils/routes";
import {
  attachConsoleGuards,
  assertControlReachable,
  appOverlayVisible,
  controlLabel,
  dismissNextOverlay,
  formatButtonFailureReport,
  getInteractiveControls,
  gotoRoute,
  recordButtonFailure,
} from "./utils/helpers";

/**
 * Navegación + botones interactivos por ruta.
 * Corre en cada project (viewport) definido en playwright.config.ts.
 */
test.describe("Rutas y elementos interactivos", () => {
  test.describe.configure({ mode: "serial" });

  for (const route of ALL_ROUTES) {
    test(`carga ${route} sin error de página`, async ({ page }) => {
      const guards = attachConsoleGuards(page);
      await gotoRoute(page, route);

      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("text=Application error")).toHaveCount(0);
      await guards.assertClean();
    });
  }

  for (const route of APP_ROUTES) {
    test(`botones en ${route}: visibles, clicables, sin crash`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(90_000);

      const guards = attachConsoleGuards(page);
      await gotoRoute(page, route);

      if (page.url().includes("/login")) {
        test.skip(true, "Sin sesión válida — revisa E2E_PASSWORD / bootstrap admin");
      }

      const initial = await getInteractiveControls(page);
      const max = Math.min(initial.length, 6);

      for (let i = 0; i < max; i++) {
        await gotoRoute(page, route);
        if (page.url().includes("/login")) break;

        guards.clear();

        const fresh = await getInteractiveControls(page);
        if (i >= fresh.length) break;
        const el = fresh[i];
        const label = await controlLabel(el);

        try {
          await assertControlReachable(el);

          const beforeUrl = page.url();
          expect(await el.isDisabled().catch(() => false)).toBe(false);

          await dismissNextOverlay(page);
          await el.click({ timeout: 8_000 });
          await page.waitForTimeout(200);
          await dismissNextOverlay(page);

          const afterUrl = page.url();
          if (afterUrl !== beforeUrl) {
            expect(afterUrl).not.toMatch(/\/login$/);
          } else {
            await appOverlayVisible(page);
          }

          const errs = guards.getErrors();
          if (errs.length) throw new Error(errs.join("\n"));
        } catch (e) {
          const reason = e instanceof Error ? e.message : String(e);
          if (/closed|Test timeout/i.test(reason)) throw e;
          await recordButtonFailure(testInfo, {
            route,
            project: testInfo.project.name,
            label,
            reason,
          });
          expect.soft(false, `"${label}" en ${route}: ${reason}`).toBeTruthy();
        }
      }
    });
  }

  test("reporte de botones fallidos", async () => {
    const report = formatButtonFailureReport();
    // eslint-disable-next-line no-console
    console.log("\n—— Button failure report ——\n" + report + "\n");
  });
});
