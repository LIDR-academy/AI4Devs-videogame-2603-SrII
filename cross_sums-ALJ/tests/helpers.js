// @ts-check
/**
 * Shared Playwright helpers for the Cross Sums tests.
 *
 * Selectors here mirror the actual class names used by the codebase:
 *   - #grid-container, #numpad-container
 *   - .cell, .cell-wall, .cell-clue, .cell-blank
 *   - .clue-down, .clue-across, .cell-value
 *   - .selected, .highlight-across, .highlight-down
 *   - .error, .error-shake
 *   - .numpad-btn (with data-digit "1".."9" or "X" for clear)
 */
const { expect } = require("@playwright/test");

/**
 * Locator for a single cell by its data-row/data-col attributes.
 * @param {import('@playwright/test').Page} page
 */
function getCell(page, row, col) {
  return page.locator(`#grid-container .cell[data-row="${row}"][data-col="${col}"]`);
}

async function waitForGrid(page) {
  await page.locator("#grid-container .cell").first().waitFor({ state: "visible" });
}

/**
 * Navigate to the page and load the named builtin puzzle. The page reads
 * `?puzzle=<name>` and matches against BUILTIN_PUZZLES.name.
 */
async function startBuiltinPuzzle(page, puzzleName) {
  const url = puzzleName
    ? `/?puzzle=${encodeURIComponent(puzzleName)}`
    : "/";
  await page.goto(url);
  await waitForGrid(page);
}

/**
 * Ensure a blank cell is selected. If it's already selected, do nothing
 * (clicking again would deselect it).
 */
async function selectCell(page, row, col) {
  const cell = getCell(page, row, col);
  const cls = (await cell.getAttribute("class")) || "";
  if (cls.split(/\s+/).includes("selected")) return;
  await cell.click();
}

/**
 * Select a blank cell and press a digit key on the keyboard.
 * @param {string|number} digit  '1'..'9'
 */
async function enterNumber(page, row, col, digit) {
  await selectCell(page, row, col);
  await page.keyboard.press(String(digit));
}

/**
 * Select a blank cell and press Backspace to clear it.
 */
async function clearCell(page, row, col) {
  await selectCell(page, row, col);
  await page.keyboard.press("Backspace");
}

/**
 * Read the displayed digit in a blank cell. Returns null if empty.
 * @returns {Promise<string|null>}
 */
async function getCellValue(page, row, col) {
  const valEl = getCell(page, row, col).locator(".cell-value");
  if ((await valEl.count()) === 0) return null;
  return (await valEl.textContent())?.trim() ?? null;
}

/**
 * Read the class list of a cell as an array of strings.
 * @returns {Promise<string[]>}
 */
async function getCellClasses(page, row, col) {
  const cls = (await getCell(page, row, col).getAttribute("class")) || "";
  return cls.split(/\s+/).filter(Boolean);
}

/**
 * Click a numpad button. Pass '1'..'9' for digits or 'X' for clear.
 */
async function clickNumpadButton(page, label) {
  await page.locator(`#numpad-container .numpad-btn[data-digit="${label}"]`).click();
}

/**
 * Read the visible pencil marks for a cell as an array of digit strings.
 * @returns {Promise<string[]>}
 */
async function getCellPencilMarks(page, row, col) {
  const marks = getCell(page, row, col).locator(".pencil-mark");
  const count = await marks.count();
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = (await marks.nth(i).textContent())?.trim();
    if (t) out.push(t);
  }
  return out;
}

/**
 * Parse a "MM:SS" timer string into total seconds.
 * @param {string} s
 * @returns {number}
 */
function parseTimerText(s) {
  const [m, sec] = s.trim().split(":").map(Number);
  return m * 60 + sec;
}

/**
 * Solve the Tiny puzzle (4x4 builtin) by entering its known solution.
 */
async function solveTiny(page) {
  await enterNumber(page, 1, 1, 1);
  await enterNumber(page, 1, 2, 2);
  await enterNumber(page, 2, 1, 3);
  await enterNumber(page, 2, 2, 8);
}

/**
 * Load the page with ?test=true and wait for the generator/validator test API
 * to be attached to `window._cross_sums`.
 */
async function loadTestApi(page) {
  await page.goto("/?test=true");
  await page.waitForFunction(() => Boolean(window._cross_sums && window._cross_sums.generatePuzzle));
}

module.exports = {
  expect,
  getCell,
  waitForGrid,
  startBuiltinPuzzle,
  selectCell,
  enterNumber,
  clearCell,
  getCellValue,
  getCellClasses,
  clickNumpadButton,
  getCellPencilMarks,
  parseTimerText,
  solveTiny,
  loadTestApi,
};
