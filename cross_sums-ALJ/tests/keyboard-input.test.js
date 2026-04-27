// @ts-check
const { test } = require("@playwright/test");
const {
  expect,
  getCell,
  startBuiltinPuzzle,
  selectCell,
  enterNumber,
  getCellValue,
} = require("./helpers");

test.beforeEach(async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
});

test("typing 1-9 enters the digit", async ({ page }) => {
  for (const d of ["1", "2", "5", "9"]) {
    await enterNumber(page, 1, 1, d);
    expect(await getCellValue(page, 1, 1)).toBe(d);
  }
});

test("a new digit replaces the previous value", async ({ page }) => {
  await enterNumber(page, 1, 1, "5");
  await page.keyboard.press("7");
  expect(await getCellValue(page, 1, 1)).toBe("7");
});

test("Backspace clears the cell", async ({ page }) => {
  await enterNumber(page, 1, 1, "5");
  await page.keyboard.press("Backspace");
  expect(await getCellValue(page, 1, 1)).toBeNull();
});

test("Delete clears the cell", async ({ page }) => {
  await enterNumber(page, 1, 1, "5");
  await page.keyboard.press("Delete");
  expect(await getCellValue(page, 1, 1)).toBeNull();
});

test("0 and letters do nothing", async ({ page }) => {
  await selectCell(page, 1, 1);
  await page.keyboard.press("0");
  await page.keyboard.press("a");
  await page.keyboard.press("Z");
  expect(await getCellValue(page, 1, 1)).toBeNull();
});

test("Arrow keys move selection between blanks", async ({ page }) => {
  await selectCell(page, 1, 1);
  await page.keyboard.press("ArrowRight");
  await expect(getCell(page, 1, 2)).toHaveClass(/\bselected\b/);
  await page.keyboard.press("ArrowDown");
  await expect(getCell(page, 2, 2)).toHaveClass(/\bselected\b/);
  await page.keyboard.press("ArrowLeft");
  await expect(getCell(page, 2, 1)).toHaveClass(/\bselected\b/);
  await page.keyboard.press("ArrowUp");
  await expect(getCell(page, 1, 1)).toHaveClass(/\bselected\b/);
});

test("Arrow keys wrap around grid edges", async ({ page }) => {
  await selectCell(page, 1, 1);
  // Up from (1,1) wraps — the only blank above (after wrap) lives in the
  // bottom row of the inner block, which for Tiny is (2,1).
  await page.keyboard.press("ArrowUp");
  await expect(getCell(page, 2, 1)).toHaveClass(/\bselected\b/);
});

test("Tab moves to the next blank in reading order", async ({ page }) => {
  await selectCell(page, 1, 1);
  await page.keyboard.press("Tab");
  await expect(getCell(page, 1, 2)).toHaveClass(/\bselected\b/);
  await page.keyboard.press("Tab");
  await expect(getCell(page, 2, 1)).toHaveClass(/\bselected\b/);
});

test("Shift+Tab moves to the previous blank", async ({ page }) => {
  await selectCell(page, 2, 2);
  await page.keyboard.press("Shift+Tab");
  await expect(getCell(page, 2, 1)).toHaveClass(/\bselected\b/);
});
