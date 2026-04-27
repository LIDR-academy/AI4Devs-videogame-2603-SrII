// @ts-check
const { test } = require("@playwright/test");
const {
  expect,
  getCell,
  startBuiltinPuzzle,
  selectCell,
  enterNumber,
  clearCell,
} = require("./helpers");

test.beforeEach(async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
});

test("a duplicate in the same run errors both cells", async ({ page }) => {
  // Tiny row 1: (1,1) and (1,2) share an across run.
  await enterNumber(page, 1, 1, "5");
  await enterNumber(page, 1, 2, "5");
  await expect(getCell(page, 1, 1)).toHaveClass(/\berror\b/);
  await expect(getCell(page, 1, 2)).toHaveClass(/\berror\b/);
});

test("removing a duplicate clears the error from its mate", async ({ page }) => {
  await enterNumber(page, 1, 1, "5");
  await enterNumber(page, 1, 2, "5");
  await clearCell(page, 1, 2);
  await expect(getCell(page, 1, 1)).not.toHaveClass(/\berror\b/);
  await expect(getCell(page, 1, 2)).not.toHaveClass(/\berror\b/);
});

test("changing a duplicate to a unique digit clears the error", async ({ page }) => {
  await enterNumber(page, 1, 1, "5");
  await enterNumber(page, 1, 2, "5");
  await selectCell(page, 1, 2);
  await page.keyboard.press("3");
  await expect(getCell(page, 1, 1)).not.toHaveClass(/\berror\b/);
  await expect(getCell(page, 1, 2)).not.toHaveClass(/\berror\b/);
});

test("an error in one run does not affect cells in unrelated runs", async ({ page }) => {
  // (1,1) and (1,2) duplicate in row 1; (2,2) is in row 2 + col 2 (a different
  // across run and a different down run from (1,1)) — should stay clean.
  await enterNumber(page, 1, 1, "5");
  await enterNumber(page, 1, 2, "5");
  await expect(getCell(page, 2, 2)).not.toHaveClass(/\berror\b/);
});

test("error and selected classes coexist on the same cell", async ({ page }) => {
  await enterNumber(page, 1, 1, "5");
  await enterNumber(page, 1, 2, "5");
  await selectCell(page, 1, 1);
  await expect(getCell(page, 1, 1)).toHaveClass(/\berror\b/);
  await expect(getCell(page, 1, 1)).toHaveClass(/\bselected\b/);
});
