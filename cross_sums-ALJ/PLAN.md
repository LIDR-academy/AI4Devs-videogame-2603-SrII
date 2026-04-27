# Cross Sums — Complete Build & Test Plan

## How to Use This File

This is the master plan for building a Cross Sums puzzle game in vanilla JavaScript with full Playwright test coverage.

**Rules for execution:**
1. Execute prompts ONE AT A TIME in order (1.1, 1.2, 1.3, ...).
2. After completing each prompt, confirm what was built and note any assumptions.
3. STOP and wait for the user to say "continue" before moving to the next prompt.
4. Do NOT skip ahead or combine prompts.
5. If a prompt fails or produces bugs, fix them before moving on.

---

## PROJECT SPECS

- **Framework:** Vanilla JavaScript
- **Grid sizes:** Free input (player types any NxM, min 4, max 15)
- **Input:** Both keyboard (1-9, arrows, tab, backspace) AND on-screen numpad
- **Theme:** Auto light/dark via prefers-color-scheme
- **Structure:** Multi-file (html + css/ + js/ folders)
- **Testing:** Playwright (Chromium)

### File Structure

```
/
├── PLAN.md              # This file
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js          # Entry point, game init
│   ├── grid.js          # Grid data model & cell types
│   ├── renderer.js      # DOM rendering
│   ├── input.js         # Selection, keyboard & numpad handling
│   ├── validator.js     # Solution checking
│   ├── puzzles.js       # Hardcoded starter puzzles
│   ├── generator.js     # Puzzle generator
│   ├── pencil.js        # Pencil/notes mode
│   ├── timer.js         # Timer & tab visibility
│   └── storage.js       # localStorage persistence
├── playwright.config.js
├── package.json
└── tests/
    ├── helpers.js
    ├── smoke.test.js
    ├── grid-rendering.test.js
    ├── cell-selection.test.js
    ├── keyboard-input.test.js
    ├── numpad-input.test.js
    ├── error-highlighting.test.js
    ├── win-condition.test.js
    ├── check-reveal.test.js
    ├── pencil-mode.test.js
    ├── timer.test.js
    ├── persistence.test.js
    ├── generator.test.js
    ├── accessibility.test.js
    └── theme-responsive.test.js
```

---
---

# PHASE 1: Project Setup & Core Data Model

---

## Prompt 1.1 — Project scaffolding

```
Create a vanilla JavaScript project for a Cross Sums puzzle game with this structure:

/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js          # Entry point, game init
│   ├── grid.js          # Grid data model & cell types
│   ├── renderer.js      # DOM rendering
│   ├── input.js         # Selection, keyboard & numpad handling
│   ├── validator.js     # Solution checking
│   ├── puzzles.js       # Hardcoded starter puzzles
│   ├── generator.js     # Puzzle generator (empty for now)
│   ├── pencil.js        # Pencil/notes mode
│   ├── timer.js         # Timer & localStorage persistence
│   └── storage.js       # Save/load game state

For now, just create the files. Each JS file should have a header comment explaining its responsibility. The HTML should load only main.js as the entry point. Add a basic CSS reset in styles.css. Don't implement any logic yet — just the skeleton with empty exported functions.
```

---

## Prompt 1.2 — Grid data model

```
In js/grid.js, implement the Cross Sums grid data model:

1. Define three cell types using plain objects:
   - WALL: { type: 'wall' } — black/inactive cell
   - CLUE: { type: 'clue', across: number|null, down: number|null } — contains sum hints. "across" is the sum for the horizontal run to its right. "down" is the sum for the vertical run below it. Either can be null if only one direction has a clue.
   - BLANK: { type: 'blank', value: null, pencilMarks: [] } — player-fillable cell

2. Export a function createGrid(rows, cols, cellData) that builds a 2D array from a flat definition array.

3. Export a function getRun(grid, row, col, direction) that returns an array of {row, col} coordinates for all BLANK cells in the run that the cell at (row,col) belongs to. A "run" is a consecutive sequence of BLANK cells in a direction (across or down) bounded by CLUE or WALL cells. The direction param is 'across' or 'down'.

4. Export a function getClueForRun(grid, row, col, direction) that finds the CLUE cell that governs the run containing (row, col) in the given direction, and returns its sum value.

5. Add JSDoc comments with clear type annotations on every function.
```

---

## Prompt 1.3 — Puzzle validator

```
In js/validator.js, implement solution validation:

1. Export validateRun(grid, clueRow, clueCol, direction):
   - Gets all BLANK cells in the run starting after the clue cell in the given direction.
   - Returns { valid: boolean, complete: boolean, error: string|null }
   - A run is "complete" if all cells have values (no nulls).
   - A complete run is "valid" if: (a) all values are 1-9, (b) no duplicates, (c) values sum to the clue number.
   - An incomplete run is "valid" if no duplicates exist so far and no value exceeds 9 or is less than 1.
   - Error strings: 'duplicate', 'wrong_sum', 'invalid_digit'

2. Export validateGrid(grid):
   - Iterates over every CLUE cell, validates all its runs (across and/or down).
   - Returns { solved: boolean, errors: [{row, col, direction, error}] }
   - solved is true only when ALL runs are complete AND valid.

3. Export getCellErrors(grid, row, col):
   - For a specific BLANK cell, returns which runs it violates (if any).
   - Returns { across: string|null, down: string|null }

Test these with a few inline examples using console.assert.
```

---

## Prompt 1.4 — Hardcoded puzzles

```
In js/puzzles.js, create 4 hardcoded Cross Sums puzzles with their solutions. Each puzzle is an object:

{
  name: "Puzzle Name",
  difficulty: "easy" | "medium" | "hard" | "expert",
  rows: number,
  cols: number,
  grid: [ /* 2D array of cell definitions */ ],
  solution: [ /* 2D array where blank cells have their correct value */ ]
}

Create these 4:
1. "Tiny" — 4x4, easy, 4-5 blank cells
2. "Starter" — 6x6, easy, ~10 blank cells
3. "Classic" — 8x8, medium, ~20 blank cells
4. "Challenge" — 10x10, hard, ~30+ blank cells

Make sure every puzzle is valid: runs sum correctly, no duplicate digits in any run, and each puzzle has a unique solution. Double-check the math manually.

Export them as an array called BUILTIN_PUZZLES.
```

---
---

# PHASE 2: Rendering & UI

---

## Prompt 2.1 — Grid renderer

```
In js/renderer.js, implement the visual grid rendering:

1. Export renderGrid(grid, container):
   - Takes a grid (2D array) and a DOM container element.
   - Renders the grid using CSS Grid (not HTML table).
   - Each cell is a div with a data-row and data-col attribute.

2. Cell rendering rules:
   - WALL cells: solid dark background, no content.
   - CLUE cells: dark background with a diagonal line (use CSS border trick or SVG). Display the "across" sum in the bottom-right triangle and the "down" sum in the top-left triangle. If a clue only has one direction, only show that number. Use a small, clean font for the numbers.
   - BLANK cells: light background, centered large digit when filled, clickable appearance.

3. The grid should auto-size cells based on the grid dimensions. Use CSS custom properties to control cell size. For grids up to 8x8 use ~56px cells, for larger grids scale down proportionally so the grid fits within a max-width of 600px.

4. In css/styles.css, implement these styles. Support both light and dark themes using prefers-color-scheme media query:
   - Light: white blanks, dark gray walls/clues, black text
   - Dark: dark gray blanks (#2a2a2a), near-black walls/clues, white text
   Use CSS variables at :root and override them inside the media query.

Don't handle input yet — just static rendering. Wire it up in main.js to render the first hardcoded puzzle on page load so we can see it.
```

### >>> CHECKPOINT: Open index.html in a browser. You should see the grid rendered with clue numbers and blank cells. Verify before continuing.

---

## Prompt 2.2 — Cell selection and keyboard input

```
In js/input.js, implement cell selection and number input:

1. Export initInput(grid, container, onCellUpdate):
   - Adds click listeners to BLANK cells. Clicking selects the cell (adds a 'selected' CSS class).
   - Only one cell can be selected at a time.
   - Clicking a selected cell deselects it.
   - Clicking outside the grid or on a non-blank cell deselects.

2. Keyboard input (when a cell is selected):
   - Keys 1-9: set the cell's value and call onCellUpdate(row, col, value).
   - Backspace or Delete: clear the cell value to null and call onCellUpdate(row, col, null).
   - Arrow keys: move selection to the next BLANK cell in that direction (skip walls and clues).
   - Tab: move to the next blank cell in reading order (left-to-right, top-to-bottom). Shift+Tab goes backwards.
   - Escape: deselect.

3. On-screen number pad:
   - Render a row of buttons labeled 1-9 plus an "X" (clear) button below the grid.
   - Tapping a number button enters that digit in the selected cell.
   - Tapping "X" clears it.
   - The numpad should be touch-friendly: buttons at least 44px tall with some gap.
   - Disable/gray out the numpad when no cell is selected.

4. When a cell is selected, visually highlight:
   - The selected cell itself (distinct highlight color).
   - All cells in the same across run (subtle highlight).
   - All cells in the same down run (subtle highlight, can overlap with across using a different tint).

5. Add these highlight styles to css/styles.css using the CSS variables system already in place. Make sure highlights look good in both light and dark themes.

Wire this into main.js so the game is now playable (you can enter numbers into the puzzle).
```

### >>> CHECKPOINT: Click cells, type numbers, use arrow keys, try the numpad. All should work. Verify before continuing.

---

## Prompt 2.3 — Real-time error feedback

```
In js/renderer.js, add a function updateCellDisplay(grid, row, col, container) that:

1. Updates the displayed value in a single cell (after the player types a number).
2. Checks for errors using getCellErrors() from validator.js.
3. If the cell's value causes a duplicate in any run, add an 'error' CSS class to ALL cells in that run that have the duplicate value — not just the current cell.
4. If the cell's value is fine, remove any error class from it.

Also add updateAllErrors(grid, container) that rechecks the entire grid and refreshes error highlights. Call this after every cell update.

In css/styles.css, style the error state:
- Light theme: soft red background (#fee), red text
- Dark theme: dark red background (#4a1a1a), light red text
- Add a subtle shake animation (CSS keyframes) when an error first appears — only plays once, not continuously.

Make sure error highlights coexist with selection highlights (a cell can be both selected AND in error).
```

---

## Prompt 2.T — Tests for Phase 2

```
Now set up Playwright and write the tests for everything built so far.

1. Initialize Playwright in the / directory:
   - Run: npm init -y
   - Run: npm install -D @playwright/test
   - Run: npx playwright install chromium

2. Create playwright.config.js with:
   - webServer: { command: 'npx serve . -l 3333 --no-clipboard', port: 3333, reuseExistingServer: true }
   - testDir: './tests'
   - timeout: 30000
   - use: { browserName: 'chromium', headless: true, screenshot: 'only-on-failure' }

3. Install serve: npm install -D serve

4. Add to package.json scripts:
   - "test": "npx playwright test"
   - "test:headed": "npx playwright test --headed"
   - "test:ui": "npx playwright test --ui"

5. Create tests/helpers.js with utilities:
   - getCell(page, row, col) — locator by data-row/data-col
   - selectCell(page, row, col) — click a blank cell
   - enterNumber(page, row, col, digit) — select + press key
   - clearCell(page, row, col) — select + Backspace
   - getCellValue(page, row, col) — read displayed digit
   - getCellClasses(page, row, col) — get class list
   - clickNumpadButton(page, digit) — click numpad
   - startBuiltinPuzzle(page, puzzleName) — start a named puzzle
   - waitForGrid(page) — wait for grid to render

   IMPORTANT: Look at the actual CSS classes and DOM structure in renderer.js, input.js, and index.html to write selectors that match the real implementation. Do NOT guess class names.

6. Create these test files using the actual CSS classes from the codebase:

   tests/smoke.test.js — page loads, title contains "Cross Sums", grid exists.

   tests/grid-rendering.test.js:
   - Correct cell count for Tiny (4x4 = 16 cells)
   - Wall cells have the correct wall class
   - Clue cells display sum numbers
   - Blank cells are initially empty

   tests/cell-selection.test.js:
   - Clicking blank cell selects it
   - Clicking another deselects the first
   - Clicking selected cell deselects it
   - Clicking wall/clue deselects
   - Selecting highlights the run
   - Escape deselects

   tests/keyboard-input.test.js:
   - Typing 1-9 enters digit
   - New digit replaces old
   - Backspace clears
   - Delete clears
   - 0 and letters do nothing
   - Arrow keys move selection
   - Tab moves to next blank

   tests/numpad-input.test.js:
   - Buttons 1-9 and X visible
   - Numpad disabled when nothing selected
   - Tapping numpad enters digit
   - X clears cell

   tests/error-highlighting.test.js:
   - Duplicate in run shows error on both cells
   - Removing duplicate clears error
   - Changing duplicate clears error
   - Errors in one run don't affect other runs
   - Error + selected classes coexist

7. Run all tests and fix any failures.
```

### >>> CHECKPOINT: Run "npm test". All tests should pass. Fix any failures before continuing.

---
---

# PHASE 3: Game Logic & UX

---

## Prompt 3.1 — Win condition & check button

```
Add game completion logic:

1. In js/main.js, after every cell update, call validateGrid(). If solved === true:
   - Show a congratulations overlay on top of the grid.
   - Display "Puzzle Complete!" text.
   - Add a "New Game" button on the overlay.
   - Add a celebration animation: cells light up in a wave pattern (stagger animation-delay based on row+col) with a gold/green glow.
   - Disable further input on the grid.

2. Add a "Check" button in the UI (near the numpad):
   - When clicked, validate the entire grid.
   - For each cell: if filled AND matches the solution, briefly flash green. If filled AND wrong, briefly flash red. If empty, do nothing.
   - The flash should last ~1 second then fade back to normal.
   - This does NOT permanently mark cells — it's a momentary hint.

3. Add a "Reveal" button (with a confirmation dialog "Are you sure? This will show the answer."):
   - Fills all blank cells with the solution values.
   - Marks the puzzle as not "legitimately" solved (don't trigger the win celebration).

Add these buttons to a toolbar area between the grid and the numpad.
```

### >>> CHECKPOINT: Solve the Tiny puzzle manually. Verify the win overlay appears. Test Check and Reveal buttons.

---

## Prompt 3.2 — Pencil/notes mode

```
In js/pencil.js, implement pencil marks (candidate notes):

1. Export initPencilMode(container):
   - Add a toggle button labeled "Notes" (with a pencil icon using a simple SVG or Unicode pencil emoji) in the toolbar.
   - When active, the button should look pressed/highlighted.
   - When toggled ON, number inputs (keyboard or numpad) add/remove pencil marks instead of setting the cell value.

2. Pencil mark behavior:
   - A cell can have pencil marks OR a value, never both.
   - Entering a pencil mark: if the digit is already in pencilMarks, remove it (toggle). If not, add it.
   - Setting a real value (notes mode OFF) on a cell that has pencil marks: clear the pencil marks and set the value.
   - Clearing a cell (Backspace): if cell has a value, clear the value. If cell has pencil marks, clear ALL pencil marks.

3. Pencil mark display:
   - Show as a 3x3 mini-grid of small digits inside the cell (1-9 positioned in their natural numpad layout: 1 top-left, 2 top-center... 9 bottom-right).
   - Only show digits that are in the pencilMarks array. Empty positions are blank.
   - Use a smaller, lighter font (50-60% opacity) to distinguish from real values.

4. Auto-clear pencil marks: when a player enters a real value in any cell, automatically remove that digit from the pencil marks of all other cells in the same across and down runs.

Make sure pencil marks render correctly in both themes.
```

---

## Prompt 3.3 — Timer & save/load

```
In js/timer.js:

1. Export a Timer class or module:
   - start(), pause(), resume(), reset(), getElapsed() methods.
   - Displays as MM:SS in a timer element above the grid.
   - Auto-starts when a new puzzle begins.
   - Auto-pauses if the browser tab loses focus (visibilitychange event).
   - Auto-resumes when the tab regains focus.

In js/storage.js:

2. Export save/load functions using localStorage:
   - saveGame(puzzleId, gameState): saves current cell values, pencil marks, elapsed time, and puzzle identifier.
   - loadGame(puzzleId): returns saved state or null.
   - clearGame(puzzleId): removes saved state.
   - hasSavedGame(puzzleId): returns boolean.

3. Auto-save: after every cell update, save the current game state. Also save on beforeunload.

4. On page load in main.js: check if there's a saved game for the current puzzle. If yes, show a prompt "Resume saved game?" with Yes/No buttons. If yes, restore all values, pencil marks, and timer.

5. When a puzzle is solved, clear its saved state.

6. Update the win overlay from Prompt 3.1 to show the actual completion time from the timer.
```

---

## Prompt 3.T — Tests for Phase 3

```
Write Playwright tests for everything built in Phase 3. Look at the actual DOM structure, CSS classes, and button text in the current codebase before writing selectors.

Create these test files:

tests/win-condition.test.js:
- Solving the Tiny puzzle shows congratulations overlay (hardcode the Tiny solution values in the test)
- Grid input is disabled after winning
- Incomplete puzzle does not trigger win
- Wrong values do not trigger win

tests/check-reveal.test.js:
- Check button exists
- Check flashes green on correct cells
- Check flashes red on incorrect cells
- Check ignores empty cells
- Reveal fills all cells with solution
- Reveal does NOT trigger win celebration

tests/pencil-mode.test.js:
- Notes toggle button exists
- Toggling changes button appearance (active class or aria-pressed)
- Digit in notes mode adds pencil mark (small text, not full value)
- Same digit again removes pencil mark
- Multiple pencil marks coexist
- Real value clears pencil marks
- Auto-clear removes pencil mark from run neighbors when real value entered

tests/timer.test.js:
- Timer starts when puzzle loads (not stuck at 0:00 after 2s)
- Timer resets on new game

tests/persistence.test.js:
- Values persist after page reload
- Pencil marks persist after reload
- Solved puzzle clears saved state
- Starting new game clears old save

Run all tests (including the Phase 2 tests) and fix any failures.
```

### >>> CHECKPOINT: Run "npm test". ALL tests (Phase 2 + Phase 3) should pass.

---
---

# PHASE 4: Puzzle Generator

---

## Prompt 4.1 — Combination lookup table

```
In js/generator.js, start building the puzzle generator.

First, implement the combination engine:

1. Export generateCombinations():
   - Precompute ALL valid digit combinations for every possible (sum, length) pair in Cross Sums.
   - Sum ranges from 1 to 45. Length ranges from 2 to 9.
   - Each combination uses digits 1-9 with no repeats.
   - Store as a Map where the key is "sum-length" (e.g., "10-3") and the value is an array of arrays (each inner array is a valid combination sorted ascending).
   - Example: "6-2" gives [[1,5], [2,4]] (not [3,3] because no duplicates).

2. Export getCombinations(sum, length):
   - Looks up and returns the valid combinations for a given sum and run length.
   - Returns an empty array for impossible combinations.

3. Export isValidClue(sum, length):
   - Returns true if at least one valid combination exists for this sum and run length.
   - Quick sanity check: min possible sum for length N is 1+2+...+N. Max is (10-N)+(10-N+1)+...+9.

Add some console.assert tests at the bottom of the file:
- "3-2" should give [[1,2]]
- "24-3" should give [[7,8,9]]
- "15-2" should give [[6,9],[7,8]]
- "1-2" should give [] (impossible)
```

---

## Prompt 4.2 — Grid pattern generator

```
Continue in js/generator.js. Add grid pattern generation — this creates the SHAPE of the puzzle (where clues, blanks, and walls go) without filling in numbers yet.

1. Export generatePattern(rows, cols):
   - Generate a valid Cross Sums grid layout for the given dimensions.
   - Rules for a valid pattern:
     a. Every BLANK cell must be part of exactly one horizontal run AND one vertical run.
     b. Every run must have at least 2 BLANK cells (a single isolated blank is invalid).
     c. Clue cells border the start of each run.
     d. The top row and left column are always WALL or CLUE cells (never BLANK).
     e. All BLANK cells must be connected (no isolated groups).

2. Algorithm approach:
   - Start with all WALLs.
   - Randomly place rectangular "openings" of BLANK cells (like crossword white regions).
   - Ensure connectivity using flood fill.
   - Place CLUE cells at the start of every horizontal and vertical run.
   - Validate all runs have length >= 2.
   - Retry or adjust if constraints are violated.
   - Target roughly 40-55% blank cells for a good puzzle density.

3. Export validatePattern(grid):
   - Checks all the structural rules above and returns { valid: boolean, issues: string[] }.

The output should be a grid with WALL, CLUE (sums set to null initially), and BLANK cells in correct positions. Don't fill in numbers yet.
```

---

## Prompt 4.3 — Puzzle solver & filler

```
Continue in js/generator.js. Add the solver that fills a grid pattern with valid numbers and derives the clue sums.

1. Export solvePuzzle(grid):
   - Uses constraint propagation + backtracking to fill all BLANK cells with digits 1-9.
   - Constraints: no duplicate digits in any run, each run's values must sum to a valid Cross Sums clue number.
   - Returns the filled grid or null if unsolvable.
   - Algorithm:
     a. For each run, track possible values for each cell (domain: initially 1-9).
     b. Propagate constraints: if a cell in a run has a fixed value, remove it from all other cells' domains in the same across and down runs.
     c. Pick the cell with the smallest remaining domain (MRV heuristic).
     d. Try each value, recurse. Backtrack on contradiction.

2. Export generatePuzzle(rows, cols):
   - Calls generatePattern(rows, cols) to get a layout.
   - Calls solvePuzzle() to fill it with a valid solution.
   - Derives clue sums from the filled solution (sum of each run's values).
   - Clears all BLANK cell values to create the player-facing puzzle.
   - Returns { puzzle: grid, solution: grid, difficulty: string }.
   - If pattern generation or solving fails, retry up to 10 times with a new pattern.

3. Export estimateDifficulty(grid):
   - Score based on: grid size, number of runs, average combinations per clue, percentage of clues with only 1 possible combination (more = easier).
   - Return "easy", "medium", "hard", or "expert".

Add a performance guard: if generation takes more than 3 seconds (for very large grids), abort and retry. Log generation time to console.
```

---

## Prompt 4.4 — Unique solution check

```
Continue in js/generator.js. Add unique solution verification:

1. Export countSolutions(grid, maxCount):
   - Same as solvePuzzle but counts how many distinct solutions exist (up to maxCount).
   - Uses the same backtracking solver but doesn't stop at the first solution — continues to find a second one.
   - If maxCount is 2 and it finds 2, return 2 immediately (we just need to know if it's unique).

2. Modify generatePuzzle():
   - After generating a puzzle, verify it has exactly 1 solution using countSolutions(puzzle, 2).
   - If multiple solutions exist, try removing fewer cell values (keep some as "given" hints) and recheck.
   - If still not unique after a few attempts, regenerate entirely.

3. For large grids (10x10+), add a timeout of 5 seconds for the uniqueness check. If it times out, accept the puzzle but flag difficulty as "unknown". Log a warning.
```

---

## Prompt 4.T — Tests for Phase 4

```
Write Playwright tests for the puzzle generator. These tests use page.evaluate() to call generator functions directly in the browser context.

IMPORTANT: You may need to expose the functions on window in a test-friendly way. If the functions aren't accessible via page.evaluate, add a small block in main.js (or a test-bootstrap file) that attaches them to window when a query param like ?test=true is present:
  if (new URLSearchParams(location.search).get('test')) {
    window._cross_sums = { generatePuzzle, validateGrid, ... };
  }
Then navigate to /?test=true in the tests.

Create tests/generator.test.js:

- Generates a valid 4x4 puzzle (result not null, correct dimensions, blanks have values 1-9 in solution)
- Generates a valid 6x6 puzzle
- Generates a valid 8x8 puzzle within 5 seconds
- Generated puzzle has no duplicate digits in any run (validateGrid on solution returns solved: true)
- Clue sums match solution values
- Custom size via UI (enter 5 rows, 7 cols, click Generate, assert 35 cells rendered)
- Large grid 12x12 doesn't crash (15s timeout, assert 144 cells rendered)

Run all tests and fix any failures.
```

### >>> CHECKPOINT: Run "npm test". ALL tests (Phase 2 + 3 + 4) should pass. Also manually test: open New Game, enter custom size, generate a puzzle, play it.

---
---

# PHASE 5: New Game Flow & Menu

---

## Prompt 5.1 — Game menu & new game flow

```
Update the UI to support starting new games:

1. Add a top menu bar with:
   - Game title "Cross Sums" on the left (clean, bold font).
   - "New Game" button that opens a modal dialog.
   - The timer display on the right.

2. New Game modal:
   - "Quick Play" section: 4 buttons for the builtin puzzles (Tiny, Starter, Classic, Challenge) showing their name and difficulty.
   - "Custom" section: two number inputs for Rows and Cols (min 4, max 15 each) with a "Generate" button.
   - Show a loading spinner with the text "Generating puzzle..." when the generator is running.
   - Run the generator in a setTimeout(fn, 0) or requestAnimationFrame so the UI doesn't freeze.

3. When a new game starts:
   - If there's an in-progress game, ask "Abandon current game?" with confirm/cancel.
   - Clear the grid, reset the timer, load the new puzzle.
   - Auto-save the new puzzle ID so we know which puzzle to restore on reload.

4. On first page load (no saved game), auto-show the New Game modal.
```

### >>> CHECKPOINT: Open the app, see the New Game modal, pick a puzzle, play it, click New Game again, pick a different one.

---
---

# PHASE 6: Animations & Polish

---

## Prompt 6.1 — Micro-interactions and transitions

```
Add polished animations throughout the game. All animations should respect prefers-reduced-motion (disable or simplify if the user prefers reduced motion).

1. Cell input animation:
   - When a number is entered, the digit should scale up from 0.5 to 1.0 with a quick ease-out (150ms).
   - When a number is cleared, it should fade out and scale down (100ms).

2. Selection transitions:
   - Selected cell highlight should fade in (not snap).
   - Run highlights should have a staggered fade-in: cells closer to the selected cell appear first (20ms delay per cell distance).

3. Number pad:
   - Buttons should have a press effect (scale down to 0.95 on active).
   - When a button is tapped, add a brief ripple effect (CSS radial gradient animation).

4. Error animation:
   - Smooth shake animation (transform: translateX with 3 keyframes).
   - Error cells should pulse their red background once.

5. Win celebration:
   - Cells do a wave animation: each cell briefly lifts (translateY -4px) and glows, staggered by position (row + col * 30ms delay).
   - After the wave, the congratulations overlay fades in with a scale transform.
   - Add a confetti-like effect using CSS-only particles (small colored divs that animate upward and fade out) — 20 particles max.

6. Modal transitions:
   - Modals fade in with a slight scale (0.95 to 1.0).
   - Background overlay fades in.

Use CSS transitions and @keyframes exclusively — no JS animation libraries.
```

---

## Prompt 6.2 — Visual polish and typography

```
Refine the overall visual design:

1. Typography:
   - Use "Outfit" from Google Fonts for the UI (title, buttons, labels).
   - Use "JetBrains Mono" or "DM Mono" from Google Fonts for grid numbers.
   - Title "Cross Sums" should be bold, slightly letter-spaced.
   - Clue numbers: crisp, small (11-12px).
   - Player digits: larger, bolder (20-24px).

2. Clue cell diagonal:
   - Use a clean SVG diagonal line inside each clue cell (top-right to bottom-left).
   - Sum numbers positioned clearly in each triangle.

3. Grid borders:
   - Outer: 2px solid, slightly rounded (4px).
   - Inner: 1px solid, subtle.
   - Selected cell: 2px solid accent color.

4. Number pad:
   - Rounded buttons with subtle shadows.
   - "X" button in muted red.
   - Notes toggle with pencil icon that rotates when toggled on.

5. Responsive layout:
   - Center everything.
   - Narrow screens (<480px): shrink cells and numpad.
   - Wide screens: max 600px grid width.
   - Use CSS clamp() for cell sizes.

6. Large grids (12x12+): allow grid area to scroll independently.
```

---

## Prompt 6.3 — Accessibility pass

```
Do an accessibility audit and fix issues:

1. Keyboard navigation:
   - Grid is focusable (tabindex).
   - Arrow keys wrap around edges.
   - All buttons keyboard-accessible.
   - Selected cell has visible focus ring (dashed outline).

2. ARIA labels:
   - Grid: role="grid", rows: role="row", cells: role="gridcell".
   - Blank cells: aria-label="Row {r}, Column {c}, value: {v or empty}".
   - Clue cells: aria-label="Clue: {across sum} across, {down sum} down".
   - Numpad: aria-label="Enter {digit}" / "Clear cell".
   - Notes toggle: aria-pressed="true/false".

3. Screen reader live region:
   - aria-live="polite" region announces: "Number {n} entered", "Cell cleared", "Error: duplicate in row", "Puzzle complete!"

4. Color contrast:
   - Error states: add "!" icon or underline, don't rely only on color.
   - All text meets WCAG AA in both themes.

5. prefers-reduced-motion:
   - Wrap animations in media query. Reduced = instant state changes only, max 200ms transitions.
```

---

## Prompt 6.T — Final tests

```
Write the remaining Playwright tests for polish, accessibility, and themes. Look at the actual DOM and classes before writing selectors.

Create tests/accessibility.test.js:
- Grid has role="grid"
- Rows have role="row"
- Cells have role="gridcell"
- Blank cells have aria-label with row/col info
- Clue cells have aria-label with sum info
- Numpad buttons have aria-labels
- Notes toggle has aria-pressed
- aria-live region updates on input
- All interactive elements are keyboard focusable (Tab through them)

Create tests/theme-responsive.test.js:
- Dark mode: emulate dark, blank cell has dark background
- Light mode: emulate light, blank cell has light background
- Error highlighting works in dark mode
- Grid fits at 375px width (no horizontal scroll)
- Grid fits at 768px width (centered, max 600px)
- Numpad buttons >= 44px tall on mobile
- prefers-reduced-motion: animations are disabled or very short

Run the FULL test suite (all test files) and fix any failures.
```

### >>> CHECKPOINT: Run "npm test". ALL tests across all phases should pass.

---
---

# PHASE 7: Final Review

---

## Prompt 7.1 — Full review & bug fixes

```
Do a thorough final review of the entire codebase:

1. Play through each builtin puzzle and verify:
   - All clues display correctly with proper sums.
   - Input works via both keyboard and numpad.
   - Error highlighting triggers on duplicates.
   - Pencil mode works (toggle, add/remove marks, auto-clear on value entry).
   - Win condition triggers correctly with timer.
   - Check and Reveal buttons work.
   - Timer runs and pauses on tab switch.
   - Save/load works (refresh page mid-puzzle, resume).

2. Test the generator:
   - Generate 4x4, 6x6, 8x8, 12x12 — all solvable.
   - Large grids complete within reasonable time.

3. Code quality:
   - Remove all console.log except errors.
   - Remove debug code and test asserts from production files.
   - All functions have JSDoc comments.
   - Consistent code style.

4. Visual check:
   - Diagonal line in clue cells renders cleanly at all sizes.
   - Dark/light theme switching.
   - Mobile layout at 375px.
   - New Game modal scrolls on small screens.

5. Run the full Playwright test suite one final time. Fix any remaining failures.
```

### >>> FINAL CHECKPOINT: Run "npm test". Everything green. Open the app on desktop and mobile. Play a full game. Ship it.