// @ts-check
const { test } = require("@playwright/test");
const {
  expect,
  startBuiltinPuzzle,
  selectCell,
  enterNumber,
  getCellValue,
  getCellPencilMarks,
  solveTiny,
  waitForGrid,
} = require("./helpers");

const SAVE_KEY = "cross-sums:game:builtin:Tiny";

async function readSave(page) {
  return page.evaluate((k) => localStorage.getItem(k), SAVE_KEY);
}

test.beforeEach(async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
});

test("values persist across a page reload (Resume accepted)", async ({ page }) => {
  await enterNumber(page, 1, 1, 5);
  await enterNumber(page, 2, 2, 7);

  // Resume prompt fires after reload — accept it.
  page.on("dialog", (d) => d.accept());
  await page.reload();
  await waitForGrid(page);

  expect(await getCellValue(page, 1, 1)).toBe("5");
  expect(await getCellValue(page, 2, 2)).toBe("7");
});

test("pencil marks persist across a page reload", async ({ page }) => {
  await selectCell(page, 1, 1);
  await page.locator("#btn-notes").click();
  await page.keyboard.press("3");
  await page.keyboard.press("7");

  page.on("dialog", (d) => d.accept());
  await page.reload();
  await waitForGrid(page);

  expect(await getCellPencilMarks(page, 1, 1)).toEqual(["3", "7"]);
});

test("declining the Resume prompt clears the saved state and starts fresh", async ({ page }) => {
  await enterNumber(page, 1, 1, 5);
  // Save exists.
  expect(await readSave(page)).not.toBeNull();

  page.on("dialog", (d) => d.dismiss());
  await page.reload();
  await waitForGrid(page);

  // Save was cleared, cell is empty.
  expect(await readSave(page)).toBeNull();
  expect(await getCellValue(page, 1, 1)).toBeNull();
});

test("solving the puzzle clears the saved state", async ({ page }) => {
  await enterNumber(page, 1, 1, 1);
  expect(await readSave(page)).not.toBeNull();

  // Finish solving — checkWin clears the save.
  await solveTiny(page);
  await expect(page.locator("#win-overlay")).toBeVisible();
  expect(await readSave(page)).toBeNull();
});

test("starting a new game (via the modal) doesn't leave behind a save", async ({ page }) => {
  await solveTiny(page);
  // Save already cleared on win — the modal flow must not re-create one
  // before the player has typed anything.
  await page.locator("#btn-new-game").click(); // win overlay → opens modal
  await page.locator('.quick-play-btn[data-puzzle="Tiny"]').click();
  await waitForGrid(page);
  expect(await readSave(page)).toBeNull();
});
