// @ts-check
const { test } = require("@playwright/test");
const { expect, getCell, startBuiltinPuzzle, selectCell } = require("./helpers");

test.beforeEach(async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
});

test("clicking a blank cell selects it", async ({ page }) => {
  await getCell(page, 1, 1).click();
  await expect(getCell(page, 1, 1)).toHaveClass(/\bselected\b/);
  await expect(page.locator("#grid-container .cell.selected")).toHaveCount(1);
});

test("clicking another blank deselects the first", async ({ page }) => {
  await getCell(page, 1, 1).click();
  await getCell(page, 2, 2).click();
  await expect(getCell(page, 1, 1)).not.toHaveClass(/\bselected\b/);
  await expect(getCell(page, 2, 2)).toHaveClass(/\bselected\b/);
  await expect(page.locator("#grid-container .cell.selected")).toHaveCount(1);
});

test("clicking a selected cell deselects it", async ({ page }) => {
  await getCell(page, 1, 1).click();
  await getCell(page, 1, 1).click();
  await expect(page.locator("#grid-container .cell.selected")).toHaveCount(0);
});

test("clicking a wall cell deselects", async ({ page }) => {
  await selectCell(page, 1, 1);
  await getCell(page, 0, 0).click(); // wall
  await expect(page.locator("#grid-container .cell.selected")).toHaveCount(0);
});

test("clicking a clue cell deselects", async ({ page }) => {
  await selectCell(page, 1, 1);
  await getCell(page, 0, 1).click(); // clue
  await expect(page.locator("#grid-container .cell.selected")).toHaveCount(0);
});

test("selecting highlights the across and down runs", async ({ page }) => {
  await selectCell(page, 1, 1);
  // Across run mate of (1,1) in Tiny is (1,2); down run mate is (2,1).
  await expect(getCell(page, 1, 2)).toHaveClass(/\bhighlight-across\b/);
  await expect(getCell(page, 2, 1)).toHaveClass(/\bhighlight-down\b/);
  // (2,2) is in neither of (1,1)'s runs.
  await expect(getCell(page, 2, 2)).not.toHaveClass(/\bhighlight-across\b/);
  await expect(getCell(page, 2, 2)).not.toHaveClass(/\bhighlight-down\b/);
});

test("Escape deselects", async ({ page }) => {
  await selectCell(page, 1, 1);
  await page.keyboard.press("Escape");
  await expect(page.locator("#grid-container .cell.selected")).toHaveCount(0);
});
