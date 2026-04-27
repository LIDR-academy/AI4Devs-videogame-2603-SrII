// @ts-check
const { test } = require("@playwright/test");
const {
  expect,
  getCell,
  startBuiltinPuzzle,
  selectCell,
  enterNumber,
  getCellValue,
  getCellPencilMarks,
} = require("./helpers");

test.beforeEach(async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
});

test("Notes toggle button exists in the toolbar", async ({ page }) => {
  await expect(page.locator("#btn-notes")).toBeVisible();
  await expect(page.locator("#btn-notes")).toHaveText(/Notes/);
});

test("toggling Notes flips aria-pressed (and active class)", async ({ page }) => {
  const btn = page.locator("#btn-notes");
  await expect(btn).toHaveAttribute("aria-pressed", "false");
  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "true");
  await expect(btn).toHaveClass(/\bactive\b/);
  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "false");
});

test("a digit pressed in notes mode adds a pencil mark (small text, no value)", async ({ page }) => {
  await selectCell(page, 1, 1);
  await page.locator("#btn-notes").click();
  await page.keyboard.press("3");
  expect(await getCellValue(page, 1, 1)).toBeNull();
  expect(await getCellPencilMarks(page, 1, 1)).toEqual(["3"]);
});

test("the same digit again removes the pencil mark", async ({ page }) => {
  await selectCell(page, 1, 1);
  await page.locator("#btn-notes").click();
  await page.keyboard.press("3");
  await page.keyboard.press("3");
  expect(await getCellPencilMarks(page, 1, 1)).toEqual([]);
});

test("multiple pencil marks coexist (sorted by digit)", async ({ page }) => {
  await selectCell(page, 1, 1);
  await page.locator("#btn-notes").click();
  await page.keyboard.press("7");
  await page.keyboard.press("3");
  await page.keyboard.press("5");
  expect(await getCellPencilMarks(page, 1, 1)).toEqual(["3", "5", "7"]);
});

test("entering a real value clears that cell's pencil marks", async ({ page }) => {
  await selectCell(page, 1, 1);
  await page.locator("#btn-notes").click();
  await page.keyboard.press("3");
  await page.keyboard.press("5");
  // Notes off.
  await page.locator("#btn-notes").click();
  await page.keyboard.press("7");
  expect(await getCellValue(page, 1, 1)).toBe("7");
  expect(await getCellPencilMarks(page, 1, 1)).toEqual([]);
});

test("auto-clear removes a pencil mark from run-mates when a real value lands", async ({ page }) => {
  // Put pencil mark "9" on (1,2). Then type real "9" at (2,2).
  // (1,2) and (2,2) share the col-2 down run, so (1,2)'s 9 should auto-clear.
  await selectCell(page, 1, 2);
  await page.locator("#btn-notes").click();
  await page.keyboard.press("2");
  await page.keyboard.press("9");
  expect(await getCellPencilMarks(page, 1, 2)).toEqual(["2", "9"]);

  // Notes off and commit a real 9 at (2,2).
  await page.locator("#btn-notes").click();
  await enterNumber(page, 2, 2, 9);
  expect(await getCellValue(page, 2, 2)).toBe("9");
  // 9 stripped from (1,2) marks; 2 still there.
  expect(await getCellPencilMarks(page, 1, 2)).toEqual(["2"]);
});
