import { test, expect } from "@playwright/test";
import { ALL_ROUTES, APP_ROUTES } from "./utils/routes";
import {
  checkNoHorizontalScroll,
  checkNoObviousOverlaps,
  gotoRoute,
  scrollInternalContainers,
  scrollToBottomAndCheckFooter,
} from "./utils/helpers";

/**
 * Scroll: horizontal indeseado, vertical hasta el final, scrollers internos.
 */
test.describe("Scroll", () => {
  for (const route of ALL_ROUTES) {
    test(`sin scroll horizontal en ${route}`, async ({ page }) => {
      await gotoRoute(page, route);
      await checkNoHorizontalScroll(page);
    });
  }

  for (const route of APP_ROUTES) {
    test(`scroll vertical completo en ${route}`, async ({ page }) => {
      await gotoRoute(page, route);
      if (page.url().includes("/login")) {
        test.skip(true, "Sin sesión");
      }

      await scrollToBottomAndCheckFooter(page);
      await checkNoHorizontalScroll(page);
    });

    test(`scroll interno + sin saltos de layout en ${route}`, async ({
      page,
    }) => {
      await gotoRoute(page, route);
      if (page.url().includes("/login")) {
        test.skip(true, "Sin sesión");
      }

      // Contenedores overflow-y (HomeView, TagsView, Sidebar no scrollea página)
      await scrollInternalContainers(page);

      // Scroll rápido a varias posiciones; heurística de overlaps
      await checkNoObviousOverlaps(page);

      // Tras el vaivén, el layout no debe haber ganado scroll-x
      await checkNoHorizontalScroll(page);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});
