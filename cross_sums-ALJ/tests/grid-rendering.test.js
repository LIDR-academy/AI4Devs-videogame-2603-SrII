// @ts-check
const { test } = require("@playwright/test");
const { expect, getCell, startBuiltinPuzzle } = require("./helpers");

test.describe("Tiny (4x4)", () => {
  test.beforeEach(async ({ page }) => {
    await startBuiltinPuzzle(page, "Tiny");
  });

  test("renders 16 cells", async ({ page }) => {
    await expect(page.locator("#grid-container .cell")).toHaveCount(16);
  });

  test("wall cells use the cell-wall class", async ({ page }) => {
    // Tiny's top-left and entire bottom row are walls.
    await expect(getCell(page, 0, 0)).toHaveClass(/\bcell-wall\b/);
    await expect(getCell(page, 3, 0)).toHaveClass(/\bcell-wall\b/);
    await expect(getCell(page, 3, 3)).toHaveClass(/\bcell-wall\b/);
  });

  test("clue cells display their sum numbers", async ({ page }) => {
    // (0,1) is a down-clue with sum 4, (0,2) is down-clue with sum 10.
    await expect(getCell(page, 0, 1).locator(".clue-down")).toHaveText("4");
    await expect(getCell(page, 0, 2).locator(".clue-down")).toHaveText("10");
    // (1,0) is an across-clue with sum 3, (2,0) is across-clue with sum 11.
    await expect(getCell(page, 1, 0).locator(".clue-across")).toHaveText("3");
    await expect(getCell(page, 2, 0).locator(".clue-across")).toHaveText("11");
  });

  test("blank cells are initially empty", async ({ page }) => {
    // The four interior blanks should have no .cell-value child.
    for (const [r, c] of [[1, 1], [1, 2], [2, 1], [2, 2]]) {
      const cell = getCell(page, r, c);
      await expect(cell).toHaveClass(/\bcell-blank\b/);
      await expect(cell.locator(".cell-value")).toHaveCount(0);
    }
  });
});
