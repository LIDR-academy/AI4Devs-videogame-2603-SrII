// @ts-check
const { test } = require("@playwright/test");
const { expect, startBuiltinPuzzle } = require("./helpers");

test("page loads with title and grid", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Cross Sums/);
  await expect(page.locator("#grid-container .cell").first()).toBeVisible();
});

test("loading a named builtin puzzle works", async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
  // Tiny is 4x4 = 16 cells. Just confirm at least one cell rendered;
  // grid-rendering.test.js asserts the exact count.
  await expect(page.locator("#grid-container .cell").first()).toBeVisible();
});
