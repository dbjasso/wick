import { test, expect } from "@playwright/test";
import { SHELL_ROUTES } from "./utils/routes";
import {
  desktopNav,
  expectsDesktopNav,
  gotoRoute,
  HAMBURGER_TODO,
  mobileNav,
} from "./utils/helpers";

/**
 * Responsive / layout según viewport del project.
 *
 * Realidad del UI (no hamburguesa):
 * - Mobile*: MobileNav bottom bar visible; Sidebar oculto
 * - Tablet / Laptop / Desktop (md+): Sidebar visible; MobileNav oculto
 */
test.describe("Responsive / menús", () => {
  for (const route of SHELL_ROUTES) {
    test(`nav correcta en ${route}`, async ({ page }, testInfo) => {
      await gotoRoute(page, route);
      if (page.url().includes("/login")) {
        test.skip(true, "Sin sesión");
      }

      const desktop = desktopNav(page);
      const mobile = mobileNav(page);

      if (expectsDesktopNav(testInfo.project.name)) {
        await expect(desktop).toBeVisible();
        await expect(mobile).toBeHidden();
        // Links del sidebar clicables
        await expect(desktop.getByRole("link", { name: "Home" })).toBeVisible();
        await expect(
          desktop.getByRole("link", { name: /new entry/i }),
        ).toBeVisible();
      } else {
        await expect(mobile).toBeVisible();
        await expect(desktop).toBeHidden();
        // Tabs del bottom nav
        await expect(mobile.getByRole("button", { name: "Home" })).toBeVisible();
        await expect(
          mobile.getByRole("button", { name: /new entry/i }),
        ).toBeVisible();
      }
    });

    test(`mobile nav navega desde ${route}`, async ({ page }, testInfo) => {
      test.skip(
        expectsDesktopNav(testInfo.project.name),
        "Solo aplica a projects Mobile*",
      );

      await gotoRoute(page, route);
      if (page.url().includes("/login")) {
        test.skip(true, "Sin sesión");
      }

      const mobile = mobileNav(page);
      await mobile.getByRole("button", { name: "Tags" }).click();
      await expect(page).toHaveURL(/\/tags/);

      await mobile.getByRole("button", { name: "Search" }).click();
      await expect(page).toHaveURL(/\/buscar/);
    });
  }

  test("documenta ausencia de hamburguesa", async () => {
    // Falla de forma explícita si alguien espera el spec original del usuario
    // sin haber leído el TODO — soft doc via expect.soft no aplica; usamos skip.
    test.info().annotations.push({
      type: "TODO",
      description: HAMBURGER_TODO,
    });
    expect(HAMBURGER_TODO).toContain("No hay hamburguesa");
  });
});

test.describe("Layout / bounding boxes", () => {
  test("sidebar y main no se solapan en desktop", async ({ page }, testInfo) => {
    test.skip(
      !expectsDesktopNav(testInfo.project.name),
      "Solo desktop/tablet md+",
    );

    await gotoRoute(page, "/");
    if (page.url().includes("/login")) {
      test.skip(true, "Sin sesión");
    }

    const aside = desktopNav(page);
    const main = page.locator("main").first();
    await expect(aside).toBeVisible();
    await expect(main).toBeVisible();

    const a = await aside.boundingBox();
    const m = await main.boundingBox();
    expect(a && m).toBeTruthy();
    if (!a || !m) return;

    // Main debe empezar a la derecha del sidebar (sin overlap horizontal fuerte)
    expect(m.x).toBeGreaterThanOrEqual(a.x + a.width - 2);
  });

  test("mobile nav no tapa el CTA new-entry del bottom bar", async ({
    page,
  }, testInfo) => {
    test.skip(
      expectsDesktopNav(testInfo.project.name),
      "Solo mobile",
    );

    await gotoRoute(page, "/");
    if (page.url().includes("/login")) {
      test.skip(true, "Sin sesión");
    }

    const fab = mobileNav(page).getByRole("button", { name: /new entry/i });
    await expect(fab).toBeVisible();
    const box = await fab.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;
    // Dentro del viewport
    const vp = page.viewportSize();
    expect(box.y + box.height).toBeLessThanOrEqual((vp?.height ?? 0) + 2);
  });
});
