import { test, expect, type Page } from "@playwright/test";
import { ALL_ROUTES } from "./utils/routes";
import { gotoRoute } from "./utils/helpers";

/**
 * Regresión visual por ruta × viewport.
 *
 * Enlaces dinámicos (fecha, feeds, contadores) se enmascaran: el journal
 * cambia entre runs y los tests de botones pueden crear registros en paralelo.
 *
 * Actualizar baselines:
 *   npx playwright test tests/visual.spec.ts --update-snapshots
 */
async function stabilize(page: Page) {
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(150);
}

function dynamicMasks(page: Page) {
  return [
    // Feeds / listas que crecen con datos reales
    page.locator("main"),
    page.locator(".overflow-y-auto").first(),
    // Badges de pendientes en nav
    page.locator("nav span, aside span").filter({ hasText: /^\d+$/ }),
  ];
}

test.describe("Visual snapshots", () => {
  for (const route of ALL_ROUTES) {
    test(`screenshot ${route}`, async ({ page }) => {
      await gotoRoute(page, route);
      await stabilize(page);

      const slug =
        route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");

      await expect(page).toHaveScreenshot(`${slug}.png`, {
        // Viewport fijo: fullPage varía con feeds/fuentes
        fullPage: false,
        animations: "disabled",
        mask: dynamicMasks(page),
        maxDiffPixelRatio: 0.03,
      });
    });
  }
});
