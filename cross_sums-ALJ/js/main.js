/**
 * main.js — Entry point for the Cross Sums game.
 */
(function() {
  var renderGrid = CrossSums.renderGrid;
  var updateCellDisplay = CrossSums.updateCellDisplay;
  var updateAllErrors = CrossSums.updateAllErrors;
  var initInput = CrossSums.initInput;
  var setInputEnabled = CrossSums.setInputEnabled;
  var validateGrid = CrossSums.validateGrid;
  var BUILTIN_PUZZLES = CrossSums.BUILTIN_PUZZLES;
  var initPencilMode = CrossSums.initPencilMode;
  var isPencilMode = CrossSums.isPencilMode;
  var setPencilMode = CrossSums.setPencilMode;
  var togglePencilMark = CrossSums.togglePencilMark;
  var clearPencilMarks = CrossSums.clearPencilMarks;
  var clearPencilMarksFromRunMates = CrossSums.clearPencilMarksFromRunMates;
  var Timer = CrossSums.Timer;
  var formatTime = CrossSums.formatTime;
  var saveGame = CrossSums.saveGame;
  var loadGame = CrossSums.loadGame;
  var clearGame = CrossSums.clearGame;
  var hasSavedGame = CrossSums.hasSavedGame;
  var generatePuzzle = CrossSums.generatePuzzle;

  var CURRENT_PUZZLE_KEY = "cross-sums:current";
  var CUSTOM_PUZZLE_PREFIX = "cross-sums:puzzle:";

  var game = {
    puzzle: null,
    puzzleId: null,
    container: null,
    timer: null,
    revealed: false,
    won: false,
    dirty: false,
  };

  var FLASH_MS = 1000;
  var WIN_STAGGER_MS = 30;
  var CONFETTI_COUNT = 20;
  var CONFETTI_COLORS = [
    "#ffd54f", "#66bb6a", "#42a5f5", "#ef5350",
    "#ab47bc", "#ffa726", "#26c6da", "#ec407a",
  ];

  function init() {
    var container = document.getElementById("grid-container");
    if (!container) return;
    game.container = container;

    if (game.timer) game.timer.dispose();
    game.timer = new Timer({ display: document.getElementById("timer") });

    var btnCheck = document.getElementById("btn-check");
    if (btnCheck) btnCheck.addEventListener("click", handleCheck);
    var btnReveal = document.getElementById("btn-reveal");
    if (btnReveal) btnReveal.addEventListener("click", handleReveal);
    var btnNewGame = document.getElementById("btn-new-game");
    if (btnNewGame) btnNewGame.addEventListener("click", openModal);
    var btnOpenNewGame = document.getElementById("btn-open-newgame");
    if (btnOpenNewGame) btnOpenNewGame.addEventListener("click", openModal);
    var btnModalClose = document.getElementById("btn-modal-close");
    if (btnModalClose) btnModalClose.addEventListener("click", closeModal);
    var btnGenerate = document.getElementById("btn-generate");
    if (btnGenerate) btnGenerate.addEventListener("click", onGenerateClicked);
    initPencilMode(document.getElementById("btn-notes"));
    buildBuiltinButtons();
    window.addEventListener("beforeunload", autoSave);

    var queryPuzzle = new URLSearchParams(location.search).get("puzzle");
    if (queryPuzzle) {
      var p = null;
      for (var i = 0; i < BUILTIN_PUZZLES.length; i++) {
        if (BUILTIN_PUZZLES[i].name === queryPuzzle) {
          p = BUILTIN_PUZZLES[i];
          break;
        }
      }
      if (p) {
        loadPuzzle("builtin:" + queryPuzzle, p, { allowResume: true });
        return;
      }
    }

    var currentId = localStorage.getItem(CURRENT_PUZZLE_KEY);
    if (currentId) {
      var pr = resolvePuzzle(currentId);
      if (pr) {
        loadPuzzle(currentId, pr, { allowResume: true });
        return;
      }
    }

    loadPuzzle("builtin:" + BUILTIN_PUZZLES[0].name, BUILTIN_PUZZLES[0], {
      allowResume: false,
      persist: false,
    });
    openModal({ skipAbandonCheck: true });
  }

  function loadPuzzle(id, puzzle, options) {
    options = options || {};
    var allowResume = options.allowResume || false;
    var persist = options.persist !== false;

    game.puzzle = puzzle;
    game.puzzleId = id;
    game.revealed = false;
    game.won = false;
    game.dirty = false;
    hideWinOverlay();
    setPencilMode(false);

    renderGrid(puzzle.grid, game.container);
    initInput(puzzle.grid, game.container, {
      onDigit: handleDigit,
      onClear: handleClear,
    });
    setInputEnabled(true);
    updateAllErrors(puzzle.grid, game.container);

    if (persist) {
      localStorage.setItem(CURRENT_PUZZLE_KEY, id);
      if (id.indexOf("custom:") === 0) saveCustomPuzzleDef(id, puzzle);
    }

    if (allowResume) maybeRestoreSavedGame(id);

    game.timer.reset();
    game.timer.resume();
  }

  function resolvePuzzle(id) {
    if (id.indexOf("builtin:") === 0) {
      var name = id.slice("builtin:".length);
      for (var i = 0; i < BUILTIN_PUZZLES.length; i++) {
        if (BUILTIN_PUZZLES[i].name === name) return BUILTIN_PUZZLES[i];
      }
      return null;
    }
    if (id.indexOf("custom:") === 0) {
      try {
        var raw = localStorage.getItem(CUSTOM_PUZZLE_PREFIX + id);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function saveCustomPuzzleDef(id, puzzle) {
    try {
      localStorage.setItem(CUSTOM_PUZZLE_PREFIX + id, JSON.stringify(puzzle));
    } catch (err) {
      console.warn("[main] failed to persist custom puzzle:", err);
    }
  }

  function maybeRestoreSavedGame(puzzleId) {
    if (!hasSavedGame(puzzleId)) return;
    var saved = loadGame(puzzleId);
    if (!saved) return;
    if (!confirm("Resume saved game?")) {
      clearGame(puzzleId);
      return;
    }
    applyGameState(game.puzzle.grid, saved);
    for (var r = 0; r < game.puzzle.grid.length; r++) {
      for (var c = 0; c < game.puzzle.grid[0].length; c++) {
        if (game.puzzle.grid[r][c].type === "blank") {
          updateCellDisplay(game.puzzle.grid, r, c, game.container);
        }
      }
    }
    updateAllErrors(game.puzzle.grid, game.container);
    if (typeof saved.elapsed === "number") game.timer.setElapsed(saved.elapsed);
    game.dirty = true;
  }

  function serializeGame() {
    var grid = game.puzzle.grid;
    var rows = grid.length;
    var cols = grid[0].length;
    var values = [];
    var marks = [];
    for (var r = 0; r < rows; r++) {
      var valRow = [];
      var markRow = [];
      for (var c = 0; c < cols; c++) {
        var cell = grid[r][c];
        if (cell.type === "blank") {
          valRow.push(cell.value);
          markRow.push(Array.isArray(cell.pencilMarks) ? cell.pencilMarks.slice() : []);
        } else {
          valRow.push(null);
          markRow.push([]);
        }
      }
      values.push(valRow);
      marks.push(markRow);
    }
    return {
      puzzleId: game.puzzleId,
      values: values,
      marks: marks,
      elapsed: game.timer ? game.timer.getElapsed() : 0,
      savedAt: Date.now(),
    };
  }

  function applyGameState(grid, state) {
    if (!state) return;
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[0].length; c++) {
        var cell = grid[r][c];
        if (cell.type !== "blank") continue;
        cell.value = (state.values && state.values[r] && state.values[r][c] !== undefined) ? state.values[r][c] : null;
        cell.pencilMarks = (state.marks && state.marks[r] && Array.isArray(state.marks[r][c])) ? state.marks[r][c].slice() : [];
      }
    }
  }

  function autoSave() {
    if (!game.puzzle || !game.puzzleId) return;
    if (game.won || game.revealed) {
      clearGame(game.puzzleId);
      return;
    }
    saveGame(game.puzzleId, serializeGame());
  }

  function buildBuiltinButtons() {
    var host = document.getElementById("builtin-buttons");
    if (!host) return;
    host.innerHTML = "";
    for (var i = 0; i < BUILTIN_PUZZLES.length; i++) {
      (function(puzzle) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.classList.add("quick-play-btn");
        btn.dataset.puzzle = puzzle.name;
        var name = document.createElement("span");
        name.classList.add("puzzle-name");
        name.textContent = puzzle.name;
        var diff = document.createElement("span");
        diff.classList.add("puzzle-difficulty");
        diff.textContent = puzzle.difficulty;
        btn.appendChild(name);
        btn.appendChild(diff);
        btn.addEventListener("click", function() {
          if (!askAbandonIfDirty()) return;
          loadPuzzle("builtin:" + puzzle.name, puzzle, { allowResume: false });
          closeModal();
        });
        host.appendChild(btn);
      })(BUILTIN_PUZZLES[i]);
    }
  }

  function openModal(opts) {
    var skipAbandonCheck = opts && opts.skipAbandonCheck === true;
    hideSpinner();
    hideCustomError();
    var modal = document.getElementById("newgame-modal");
    if (modal) modal.removeAttribute("hidden");
  }

  function closeModal() {
    var modal = document.getElementById("newgame-modal");
    if (modal) modal.setAttribute("hidden", "");
  }

  function showSpinner() {
    var el = document.getElementById("loading-spinner");
    if (el) el.removeAttribute("hidden");
  }

  function hideSpinner() {
    var el = document.getElementById("loading-spinner");
    if (el) el.setAttribute("hidden", "");
  }

  function showCustomError(msg) {
    var el = document.getElementById("custom-error");
    if (!el) return;
    el.textContent = msg;
    el.removeAttribute("hidden");
  }

  function hideCustomError() {
    var el = document.getElementById("custom-error");
    if (el) el.setAttribute("hidden", "");
  }

  function onGenerateClicked() {
    hideCustomError();
    var rowsInput = document.getElementById("custom-rows");
    var colsInput = document.getElementById("custom-cols");
    if (!rowsInput || !colsInput) return;
    var rows = parseInt(rowsInput.value, 10);
    var cols = parseInt(colsInput.value, 10);
    if (!Number.isInteger(rows) || rows < 4 || rows > 15) {
      showCustomError("Rows must be an integer between 4 and 15.");
      return;
    }
    if (!Number.isInteger(cols) || cols < 4 || cols > 15) {
      showCustomError("Cols must be an integer between 4 and 15.");
      return;
    }
    if (!askAbandonIfDirty()) return;
    showSpinner();

    setTimeout(function() {
      var result;
      try {
        result = generatePuzzle(rows, cols);
      } catch (err) {
        console.error("[main] generatePuzzle threw:", err);
        result = null;
      }
      hideSpinner();
      if (!result) {
        showCustomError("Couldn't generate a puzzle for that size. Try different dimensions.");
        return;
      }
      var id = "custom:" + Date.now();
      var puzzle = {
        name: "Custom " + rows + "x" + cols,
        difficulty: result.difficulty,
        rows: rows,
        cols: cols,
        grid: result.puzzle,
        solution: result.solution,
      };
      loadPuzzle(id, puzzle, { allowResume: false });
      closeModal();
    }, 16);
  }

  function askAbandonIfDirty() {
    if (!game.puzzle || game.won || !game.dirty) return true;
    return confirm("Abandon current game?");
  }

  function handleDigit(row, col, digit) {
    var cell = game.puzzle.grid[row][col];
    if (cell.type !== "blank") return;
    game.dirty = true;

    if (isPencilMode()) {
      var had = Array.isArray(cell.pencilMarks) && cell.pencilMarks.indexOf(digit) >= 0;
      togglePencilMark(cell, digit);
      updateCellDisplay(game.puzzle.grid, row, col, game.container);
      announce(had ? "Note " + digit + " removed" : "Note " + digit + " added");
      autoSave();
      return;
    }

    if (cell.value === digit) return;
    cell.value = digit;
    clearPencilMarks(cell);
    updateCellDisplay(game.puzzle.grid, row, col, game.container);

    var modified = clearPencilMarksFromRunMates(game.puzzle.grid, row, col, digit);
    for (var i = 0; i < modified.length; i++) {
      updateCellDisplay(game.puzzle.grid, modified[i].row, modified[i].col, game.container);
    }

    updateAllErrors(game.puzzle.grid, game.container);
    if (gridHasError()) {
      announce("Number " + digit + " entered. Error: duplicate in run.");
    } else {
      announce("Number " + digit + " entered");
    }
    checkWin();
    autoSave();
  }

  function handleClear(row, col) {
    var cell = game.puzzle.grid[row][col];
    if (cell.type !== "blank") return;
    if (cell.value !== null && cell.value !== undefined) {
      cell.value = null;
    } else if (Array.isArray(cell.pencilMarks) && cell.pencilMarks.length > 0) {
      clearPencilMarks(cell);
    } else {
      return;
    }
    game.dirty = true;
    updateCellDisplay(game.puzzle.grid, row, col, game.container);
    updateAllErrors(game.puzzle.grid, game.container);
    announce("Cell cleared");
    autoSave();
  }

  function checkWin() {
    if (game.revealed || game.won) return;
    if (validateGrid(game.puzzle.grid).solved) {
      game.won = true;
      game.timer.pause();
      clearGame(game.puzzleId);
      setInputEnabled(false);
      runCelebration();
      showWinOverlay();
      announce("Puzzle complete! Time " + formatTime(game.timer.getElapsed()) + ".");
    }
  }

  function runCelebration() {
    var grid = game.puzzle.grid;
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[0].length; c++) {
        if (grid[r][c].type !== "blank") continue;
        var el = cellEl(r, c);
        if (!el) continue;
        el.style.setProperty("--win-delay", ((r + c) * WIN_STAGGER_MS) + "ms");
        el.classList.add("win-glow");
      }
    }
    spawnConfetti();
  }

  function spawnConfetti() {
    var old = document.querySelector(".confetti-container");
    if (old) old.remove();
    var container = document.createElement("div");
    container.classList.add("confetti-container");
    container.setAttribute("aria-hidden", "true");
    for (var i = 0; i < CONFETTI_COUNT; i++) {
      var piece = document.createElement("div");
      piece.classList.add("confetti");
      piece.style.left = (Math.random() * 100) + "vw";
      piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      piece.style.setProperty("--rise", (50 + Math.random() * 30) + "vh");
      piece.style.setProperty("--spin", ((Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360)) + "deg");
      piece.style.animationDelay = (Math.random() * 200) + "ms";
      container.appendChild(piece);
    }
    document.body.appendChild(container);
    setTimeout(function() { container.remove(); }, 2200);
  }

  function showWinOverlay() {
    var overlay = document.getElementById("win-overlay");
    var timeEl = document.getElementById("win-time");
    if (timeEl && game.timer) {
      timeEl.textContent = "Time: " + formatTime(game.timer.getElapsed());
    }
    if (overlay) overlay.removeAttribute("hidden");
  }

  function hideWinOverlay() {
    var overlay = document.getElementById("win-overlay");
    if (overlay) overlay.setAttribute("hidden", "");
  }

  function handleCheck() {
    var grid = game.puzzle.grid;
    var solution = game.puzzle.solution;
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[0].length; c++) {
        var cell = grid[r][c];
        if (cell.type !== "blank" || cell.value === null) continue;
        var el = cellEl(r, c);
        if (!el) continue;
        var flash = cell.value === solution[r][c] ? "flash-correct" : "flash-wrong";
        el.classList.remove("flash-correct", "flash-wrong");
        void el.offsetWidth;
        el.classList.add(flash);
        (function(elem, cls) {
          setTimeout(function() { elem.classList.remove(cls); }, FLASH_MS);
        })(el, flash);
      }
    }
  }

  function handleReveal() {
    if (!confirm("Are you sure? This will show the answer.")) return;
    game.revealed = true;
    if (game.puzzleId) clearGame(game.puzzleId);
    var grid = game.puzzle.grid;
    var solution = game.puzzle.solution;
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[0].length; c++) {
        var cell = grid[r][c];
        if (cell.type !== "blank") continue;
        cell.value = solution[r][c];
        clearPencilMarks(cell);
        updateCellDisplay(grid, r, c, game.container);
      }
    }
    updateAllErrors(grid, game.container);
  }

  function cellEl(row, col) {
    return game.container.querySelector('.cell[data-row="' + row + '"][data-col="' + col + '"]');
  }

  function announce(message) {
    var el = document.getElementById("sr-live");
    if (!el) return;
    el.textContent = "";
    requestAnimationFrame(function() {
      el.textContent = message;
    });
  }

  function gridHasError() {
    return Boolean(game.container && game.container.querySelector(".cell.error"));
  }

  // Initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Test bootstrap
  if (new URLSearchParams(location.search).get("test") === "true") {
    window._cross_sums = {
      generatePuzzle: CrossSums.generatePuzzle,
      generatePattern: CrossSums.generatePattern,
      validatePattern: CrossSums.validatePattern,
      solvePuzzle: CrossSums.solvePuzzle,
      countSolutions: CrossSums.countSolutions,
      getCombinations: CrossSums.getCombinations,
      isValidClue: CrossSums.isValidClue,
      estimateDifficulty: CrossSums.estimateDifficulty,
      validateGrid: CrossSums.validateGrid,
      validateRun: CrossSums.validateRun,
      getCellErrors: CrossSums.getCellErrors,
      wall: CrossSums.wall,
      clue: CrossSums.clue,
      blank: CrossSums.blank,
      renderInto: function(grid, containerId) {
        var container = document.getElementById(containerId || "grid-container");
        renderGrid(grid, container);
      },
    };
  }
})();
