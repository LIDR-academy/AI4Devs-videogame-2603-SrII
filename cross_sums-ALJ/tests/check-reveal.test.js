// @ts-check
const { test } = require("@playwright/test");
const {
  expect,
  getCell,
  startBuiltinPuzzle,
  enterNumber,
  getCellValue,
} = require("./helpers");

test.beforeEach(async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
});

test("the Check button exists in the toolbar", async ({ page }) => {
  await expect(page.locator("#btn-check")).toBeVisible();
  await expect(page.locator("#btn-check")).toHaveText(/Check/);
});

test("Check flashes green on correct cells", async ({ page }) => {
  // Tiny solution: (1,1)=1.
  await enterNumber(page, 1, 1, 1);
  await page.locator("#btn-check").click();
  await expect(getCell(page, 1, 1)).toHaveClass(/\bflash-correct\b/);
  await expect(getCell(page, 1, 1)).not.toHaveClass(/\bflash-wrong\b/);
});

test("Check flashes red on incorrect cells", async ({ page }) => {
  // Solution at (1,1) is 1; type 9 for a guaranteed mismatch.
  await enterNumber(page, 1, 1, 9);
  await page.locator("#btn-check").click();
  await expect(getCell(page, 1, 1)).toHaveClass(/\bflash-wrong\b/);
  await expect(getCell(page, 1, 1)).not.toHaveClass(/\bflash-correct\b/);
});

test("Check ignores empty cells", async ({ page }) => {
  // No values entered.
  await page.locator("#btn-check").click();
  await expect(page.locator(".cell.flash-correct, .cell.flash-wrong")).toHaveCount(0);
});

test("Reveal fills all cells with the solution", async ({ page }) => {
  page.once("dialog", (d) => d.accept());
  await page.locator("#btn-reveal").click();
  // Tiny solution: (1,1)=1, (1,2)=2, (2,1)=3, (2,2)=8.
  expect(await getCellValue(page, 1, 1)).toBe("1");
  expect(await getCellValue(page, 1, 2)).toBe("2");
  expect(await getCellValue(page, 2, 1)).toBe("3");
  expect(await getCellValue(page, 2, 2)).toBe("8");
});

test("Reveal does NOT trigger the win celebration", async ({ page }) => {
  page.once("dialog", (d) => d.accept());
  await page.locator("#btn-reveal").click();
  await expect(page.locator("#win-overlay")).toBeHidden();
  // No cells should be glowing.
  await expect(page.locator(".cell-blank.win-glow")).toHaveCount(0);
});

test("Reveal does nothing if the user cancels the confirm", async ({ page }) => {
  page.once("dialog", (d) => d.dismiss());
  await page.locator("#btn-reveal").click();
  // Cells stay empty.
  expect(await getCellValue(page, 1, 1)).toBeNull();
});
