// @ts-check
const { test } = require("@playwright/test");
const {
  expect,
  startBuiltinPuzzle,
  selectCell,
  enterNumber,
  clickNumpadButton,
  getCellValue,
} = require("./helpers");

test.beforeEach(async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
});

test("digits 1-9 and the X clear button are all visible", async ({ page }) => {
  for (let d = 1; d <= 9; d++) {
    await expect(
      page.locator(`#numpad-container .numpad-btn[data-digit="${d}"]`),
    ).toBeVisible();
  }
  await expect(
    page.locator(`#numpad-container .numpad-btn[data-digit="X"]`),
  ).toBeVisible();
});

test("numpad buttons are disabled when no cell is selected", async ({ page }) => {
  for (let d = 1; d <= 9; d++) {
    await expect(
      page.locator(`#numpad-container .numpad-btn[data-digit="${d}"]`),
    ).toBeDisabled();
  }
  await expect(
    page.locator(`#numpad-container .numpad-btn[data-digit="X"]`),
  ).toBeDisabled();
});

test("numpad buttons enable when a cell is selected", async ({ page }) => {
  await selectCell(page, 1, 1);
  await expect(
    page.locator(`#numpad-container .numpad-btn[data-digit="5"]`),
  ).toBeEnabled();
  await expect(
    page.locator(`#numpad-container .numpad-btn[data-digit="X"]`),
  ).toBeEnabled();
});

test("tapping a numpad digit enters that digit into the selected cell", async ({ page }) => {
  await selectCell(page, 1, 1);
  await clickNumpadButton(page, "7");
  expect(await getCellValue(page, 1, 1)).toBe("7");
});

test("X clears the selected cell", async ({ page }) => {
  await enterNumber(page, 1, 1, "5");
  await clickNumpadButton(page, "X");
  expect(await getCellValue(page, 1, 1)).toBeNull();
});
