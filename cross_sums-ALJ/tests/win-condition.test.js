// @ts-check
const { test } = require("@playwright/test");
const {
  expect,
  getCell,
  startBuiltinPuzzle,
  enterNumber,
  solveTiny,
} = require("./helpers");

test.beforeEach(async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
});

test("solving the Tiny puzzle shows the congratulations overlay", async ({ page }) => {
  await solveTiny(page);
  await expect(page.locator("#win-overlay")).toBeVisible();
  await expect(page.locator("#win-title")).toHaveText("Puzzle Complete!");
});

test("grid input is disabled after winning", async ({ page }) => {
  await solveTiny(page);
  // Numpad goes disabled.
  await expect(page.locator(`.numpad-btn[data-digit="1"]`)).toBeDisabled();
  // Cells stop responding to clicks (overlay covers grid; force-click to make
  // sure the blocker isn't just the overlay's pointer-events).
  await getCell(page, 1, 1).click({ force: true });
  await expect(page.locator("#grid-container .cell.selected")).toHaveCount(0);
});

test("incomplete puzzle does not trigger win", async ({ page }) => {
  await enterNumber(page, 1, 1, 1);
  await enterNumber(page, 1, 2, 2);
  // (2,1) and (2,2) intentionally left blank.
  await expect(page.locator("#win-overlay")).toBeHidden();
});

test("wrong values do not trigger win", async ({ page }) => {
  await enterNumber(page, 1, 1, 1);
  await enterNumber(page, 1, 2, 2);
  await enterNumber(page, 2, 1, 3);
  await enterNumber(page, 2, 2, 9); // correct is 8
  await expect(page.locator("#win-overlay")).toBeHidden();
});
