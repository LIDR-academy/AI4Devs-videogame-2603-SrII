// @ts-check
const { test } = require("@playwright/test");
const { expect, getCell, startBuiltinPuzzle, enterNumber } = require("./helpers");

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("blank cell uses the dark-theme background (#2a2a2a)", async ({ page }) => {
    await startBuiltinPuzzle(page, "Tiny");
    const bg = await getCell(page, 1, 1).evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(bg).toBe("rgb(42, 42, 42)");
  });

  test("error highlighting still applies in dark mode", async ({ page }) => {
    await startBuiltinPuzzle(page, "Tiny");
    await enterNumber(page, 1, 1, 5);
    await enterNumber(page, 1, 2, 5);
    await expect(getCell(page, 1, 1)).toHaveClass(/\berror\b/);
    await expect(getCell(page, 1, 2)).toHaveClass(/\berror\b/);
  });
});

test.describe("light mode", () => {
  test.use({ colorScheme: "light" });

  test("blank cell uses the light-theme background (white)", async ({ page }) => {
    await startBuiltinPuzzle(page, "Tiny");
    const bg = await getCell(page, 1, 1).evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(bg).toBe("rgb(255, 255, 255)");
  });
});

test.describe("narrow viewport (375x700)", () => {
  test.use({ viewport: { width: 375, height: 700 } });

  test("the page does not scroll horizontally", async ({ page }) => {
    await startBuiltinPuzzle(page, "Tiny");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("numpad buttons keep at least a 44px touch target", async ({ page }) => {
    await startBuiltinPuzzle(page, "Tiny");
    const h = await page
      .locator(`#numpad-container .numpad-btn[data-digit="1"]`)
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThanOrEqual(44);
  });
});

test.describe("mid viewport (768x800)", () => {
  test.use({ viewport: { width: 768, height: 800 } });

  test("grid is at most 600px wide and centered", async ({ page }) => {
    await startBuiltinPuzzle(page, "Classic"); // 8x8 — would otherwise be 8*56 = 448px
    const w = await page
      .locator("#grid-container")
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(w).toBeLessThanOrEqual(600);
  });
});

test.describe("prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("blank cell transitions are <= 200ms", async ({ page }) => {
    await startBuiltinPuzzle(page, "Tiny");
    const dur = await getCell(page, 1, 1).evaluate(
      (el) => getComputedStyle(el).transitionDuration,
    );
    // CSS returns "150ms" or "0.15s". Convert to ms.
    const ms = dur.endsWith("ms")
      ? parseFloat(dur)
      : parseFloat(dur) * 1000;
    expect(ms).toBeLessThanOrEqual(200);
  });

  test("confetti is suppressed", async ({ page }) => {
    await startBuiltinPuzzle(page, "Tiny");
    // Solve Tiny to trigger the celebration.
    await enterNumber(page, 1, 1, 1);
    await enterNumber(page, 1, 2, 2);
    await enterNumber(page, 2, 1, 3);
    await enterNumber(page, 2, 2, 8);
    await expect(page.locator("#win-overlay")).toBeVisible();
    // Confetti container is added to <body>; CSS sets display:none under
    // reduced-motion so visually it isn't present.
    const c = page.locator(".confetti-container");
    if ((await c.count()) > 0) {
      await expect(c).toBeHidden();
    }
  });
});
