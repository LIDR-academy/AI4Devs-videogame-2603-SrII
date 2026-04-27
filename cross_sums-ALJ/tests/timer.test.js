// @ts-check
const { test } = require("@playwright/test");
const {
  expect,
  startBuiltinPuzzle,
  solveTiny,
  parseTimerText,
  waitForGrid,
} = require("./helpers");

test.beforeEach(async ({ page }) => {
  await startBuiltinPuzzle(page, "Tiny");
});

test("timer starts when the puzzle loads (not stuck at 0:00 after 2s)", async ({ page }) => {
  await page.waitForTimeout(2000);
  const text = (await page.locator("#timer").textContent()) || "";
  expect(text).not.toBe("00:00");
  expect(parseTimerText(text)).toBeGreaterThan(0);
});

test("timer resets when a new game starts (via the modal)", async ({ page }) => {
  // Let the timer accumulate a bit.
  await page.waitForTimeout(2200);
  const before = parseTimerText((await page.locator("#timer").textContent()) || "");
  expect(before).toBeGreaterThan(1);

  // Solve, then go through the win-overlay → modal → quick-play flow that
  // starts a fresh Tiny puzzle. Timer should reset to ~0.
  await solveTiny(page);
  await page.locator("#btn-new-game").click(); // win overlay → opens modal
  await page.locator('.quick-play-btn[data-puzzle="Tiny"]').click();
  await waitForGrid(page);

  const after = parseTimerText((await page.locator("#timer").textContent()) || "");
  expect(after).toBeLessThan(before);
  // Generous upper bound — the new game flow is in-page (no reload), so
  // this should be near 0 in practice.
  expect(after).toBeLessThan(10);
});
