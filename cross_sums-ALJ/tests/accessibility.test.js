// @ts-check
const { test } = require("@playwright/test");
const {
  expect,
  getCell,
  startBuiltinPuzzle,
  enterNumber,
} = require("./helpers");

test.beforeEach(async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
});

test("grid has role='grid' with an aria-label", async ({ page }) => {
  await expect(page.locator("#grid-container")).toHaveAttribute("role", "grid");
  const label = await page.locator("#grid-container").getAttribute("aria-label");
  expect(label).toMatch(/Cross Sums grid/);
});

test("each row has role='row' (4 rows for Tiny)", async ({ page }) => {
  await expect(page.locator('#grid-container [role="row"]')).toHaveCount(4);
});

test("each cell has role='gridcell' (16 cells for Tiny)", async ({ page }) => {
  await expect(page.locator('#grid-container [role="gridcell"]')).toHaveCount(16);
});

test("blank cells have aria-label with row/col info", async ({ page }) => {
  // (1,1) is a blank cell. Labels are 1-indexed for humans.
  const label = await getCell(page, 1, 1).getAttribute("aria-label");
  expect(label).toContain("Row 2");
  expect(label).toContain("Column 2");
  expect(label).toContain("empty");
});

test("blank cell aria-label updates after typing a value", async ({ page }) => {
  await enterNumber(page, 1, 1, 5);
  const label = await getCell(page, 1, 1).getAttribute("aria-label");
  expect(label).toContain("value 5");
});

test("clue cells have aria-label with sum info", async ({ page }) => {
  // Tiny clue (0,1) has down=4, no across.
  const label = await getCell(page, 0, 1).getAttribute("aria-label");
  expect(label).toContain("Clue");
  expect(label).toContain("4 down");
});

test("numpad buttons have aria-labels", async ({ page }) => {
  for (let d = 1; d <= 9; d++) {
    await expect(
      page.locator(`#numpad-container .numpad-btn[data-digit="${d}"]`),
    ).toHaveAttribute("aria-label", `Enter ${d}`);
  }
  await expect(
    page.locator(`#numpad-container .numpad-btn[data-digit="X"]`),
  ).toHaveAttribute("aria-label", "Clear cell");
});

test("Notes toggle exposes aria-pressed", async ({ page }) => {
  const btn = page.locator("#btn-notes");
  await expect(btn).toHaveAttribute("aria-pressed", "false");
  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "true");
});

test("aria-live region announces a number after input", async ({ page }) => {
  await enterNumber(page, 1, 1, 5);
  await expect(page.locator("#sr-live")).toHaveText(/Number 5 entered/);
});

test("aria-live region announces 'Cell cleared' after Backspace", async ({ page }) => {
  await enterNumber(page, 1, 1, 5);
  await page.keyboard.press("Backspace");
  await expect(page.locator("#sr-live")).toHaveText(/Cell cleared/);
});

test("topbar / grid / toolbar / numpad elements are all keyboard-focusable", async ({ page }) => {
  // Numpad buttons are disabled (and therefore not focusable) until a cell
  // is selected — select one first so the whole interactive set is live.
  await getCell(page, 1, 1).click();
  const selectors = [
    "#btn-open-newgame",
    "#grid-container",
    "#btn-check",
    "#btn-reveal",
    "#btn-notes",
    `#numpad-container .numpad-btn[data-digit="1"]`,
    `#numpad-container .numpad-btn[data-digit="X"]`,
  ];
  for (const sel of selectors) {
    const ok = await page.locator(sel).evaluate((el) => {
      /** @type {HTMLElement} */ (el).focus();
      return document.activeElement === el;
    });
    expect(ok, `${sel} should be focusable`).toBe(true);
  }
});
