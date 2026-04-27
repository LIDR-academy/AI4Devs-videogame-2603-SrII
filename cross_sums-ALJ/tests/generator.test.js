// @ts-check
const { test } = require("@playwright/test");
const { expect, loadTestApi } = require("./helpers");

test.beforeEach(async ({ page }) => {
  await loadTestApi(page);
});

test("generates a valid 4x4 puzzle", async ({ page }) => {
  const result = await page.evaluate(() =>
    /** @type {any} */ (window)._cross_sums.generatePuzzle(4, 4),
  );
  expect(result).not.toBeNull();
  expect(result.puzzle.length).toBe(4);
  expect(result.puzzle[0].length).toBe(4);
  // Solution must have a value 1..9 for every BLANK cell in the puzzle.
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const cell = result.puzzle[r][c];
      const sol = result.solution[r][c];
      if (cell.type === "blank") {
        expect(typeof sol).toBe("number");
        expect(sol).toBeGreaterThanOrEqual(1);
        expect(sol).toBeLessThanOrEqual(9);
      } else {
        expect(sol).toBeNull();
      }
    }
  }
});

test("generates a valid 6x6 puzzle", async ({ page }) => {
  const result = await page.evaluate(() =>
    /** @type {any} */ (window)._cross_sums.generatePuzzle(6, 6),
  );
  expect(result).not.toBeNull();
  expect(result.puzzle.length).toBe(6);
  expect(result.puzzle[0].length).toBe(6);
});

test("generates a valid 8x8 puzzle within 5 seconds", async ({ page }) => {
  const result = await page.evaluate(() => {
    const t = Date.now();
    const r = /** @type {any} */ (window)._cross_sums.generatePuzzle(8, 8);
    return { ok: r !== null, ms: Date.now() - t };
  });
  expect(result.ok).toBe(true);
  expect(result.ms).toBeLessThan(5000);
});

test("solution applied to puzzle satisfies validateGrid (no duplicates per run)", async ({ page }) => {
  const solved = await page.evaluate(() => {
    const api = /** @type {any} */ (window)._cross_sums;
    const r = api.generatePuzzle(6, 6);
    if (!r) return false;
    // Build a filled copy and call validateGrid.
    const filled = r.puzzle.map((row, ri) =>
      row.map((cell, ci) => {
        if (cell.type === "blank") {
          return { type: "blank", value: r.solution[ri][ci], pencilMarks: [] };
        }
        if (cell.type === "clue") {
          return { type: "clue", across: cell.across, down: cell.down };
        }
        return { type: "wall" };
      }),
    );
    return api.validateGrid(filled).solved;
  });
  expect(solved).toBe(true);
});

test("clue sums match the sum of solution values along each run", async ({ page }) => {
  const result = await page.evaluate(() => {
    const r = /** @type {any} */ (window)._cross_sums.generatePuzzle(6, 6);
    if (!r) return "no puzzle";
    const grid = r.puzzle;
    const sol = r.solution;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        const cell = grid[row][col];
        if (cell.type !== "clue") continue;
        if (cell.across !== null) {
          let s = 0;
          for (let cc = col + 1; cc < grid[0].length && grid[row][cc].type === "blank"; cc++) {
            s += sol[row][cc];
          }
          if (s !== cell.across) {
            return `across mismatch at (${row},${col}): clue=${cell.across}, sum=${s}`;
          }
        }
        if (cell.down !== null) {
          let s = 0;
          for (let rr = row + 1; rr < grid.length && grid[rr][col].type === "blank"; rr++) {
            s += sol[rr][col];
          }
          if (s !== cell.down) {
            return `down mismatch at (${row},${col}): clue=${cell.down}, sum=${s}`;
          }
        }
      }
    }
    return "ok";
  });
  expect(result).toBe("ok");
});

test("custom 5x7 puzzle renders 35 cells", async ({ page }) => {
  await page.evaluate(() => {
    const api = /** @type {any} */ (window)._cross_sums;
    const r = api.generatePuzzle(5, 7);
    if (!r) throw new Error("generator returned null");
    api.renderInto(r.puzzle);
  });
  await expect(page.locator("#grid-container .cell")).toHaveCount(35);
});

test("12x12 generates and renders 144 cells without crashing", async ({ page }) => {
  test.setTimeout(20_000);
  const result = await page.evaluate(() => {
    const api = /** @type {any} */ (window)._cross_sums;
    const t = Date.now();
    const r = api.generatePuzzle(12, 12);
    if (!r) return { ok: false, ms: Date.now() - t };
    api.renderInto(r.puzzle);
    return { ok: true, ms: Date.now() - t };
  });
  expect(result.ok).toBe(true);
  expect(result.ms).toBeLessThan(15_000);
  await expect(page.locator("#grid-container .cell")).toHaveCount(144);
});
