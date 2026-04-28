/* ============================================================
   Buscaminas — Game logic (Vanilla JS)
   ------------------------------------------------------------
   Architecture overview:
   - DIFFICULTIES: static config for each difficulty preset.
   - state:        single object holding the entire game state.
   - Board representation: each cell is an object
       { row, col, isMine, isRevealed, isFlagged, neighborMines }
   - Rendering:    DOM cells are kept in a parallel matrix `cellEls`
                   so we don't have to query the DOM during play.
   ============================================================ */

(() => {
  "use strict";

  /* -------------------- Difficulty presets -------------------- */
  const DIFFICULTIES = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
  };

  /* -------------------- DOM references -------------------- */
  const boardEl = document.getElementById("board");
  const mineCounterEl = document.getElementById("mineCounter");
  const timerEl = document.getElementById("timer");
  const statusFaceIconEl = document.getElementById("statusFaceIcon");
  const statusFaceEl = document.getElementById("statusFace");
  const restartBtn = document.getElementById("restartBtn");
  const modalRestartBtn = document.getElementById("modalRestartBtn");
  const modalEl = document.getElementById("modal");
  const modalIconEl = document.getElementById("modalIcon");
  const modalTitleEl = document.getElementById("modalTitle");
  const modalMessageEl = document.getElementById("modalMessage");
  const difficultyButtons = document.querySelectorAll("[data-difficulty]");

  /* -------------------- Game state -------------------- */
  const state = {
    rows: 9,
    cols: 9,
    totalMines: 10,
    board: [],          // 2D array of cell data
    cellEls: [],        // 2D array of DOM elements (parallel to board)
    flagsPlaced: 0,
    revealedCount: 0,
    isFirstClick: true,
    isGameOver: false,
    hasWon: false,
    timerHandle: null,
    elapsedSeconds: 0,
    difficulty: "beginner",
  };

  /* -------------------- Utilities -------------------- */
  const NEIGHBOR_OFFSETS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  const isInside = (r, c) =>
    r >= 0 && r < state.rows && c >= 0 && c < state.cols;

  const formatNumber = (n) => String(Math.max(0, Math.min(999, n))).padStart(3, "0");

  const eachNeighbor = (r, c, fn) => {
    for (const [dr, dc] of NEIGHBOR_OFFSETS) {
      const nr = r + dr;
      const nc = c + dc;
      if (isInside(nr, nc)) fn(state.board[nr][nc], nr, nc);
    }
  };

  /* -------------------- Initialization -------------------- */
  function initGame(difficulty = state.difficulty) {
    const cfg = DIFFICULTIES[difficulty];
    state.rows = cfg.rows;
    state.cols = cfg.cols;
    state.totalMines = cfg.mines;
    state.difficulty = difficulty;
    state.flagsPlaced = 0;
    state.revealedCount = 0;
    state.isFirstClick = true;
    state.isGameOver = false;
    state.hasWon = false;
    state.elapsedSeconds = 0;

    stopTimer();

    // Build a clean board: no mines yet, they are placed AFTER first click.
    state.board = Array.from({ length: state.rows }, (_, r) =>
      Array.from({ length: state.cols }, (_, c) => ({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      })),
    );

    renderBoard();
    updateHUD();
    setFace("🙂");
    boardEl.classList.remove("is-locked");
    hideModal();
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    boardEl.style.setProperty("--rows", state.rows);
    boardEl.style.setProperty("--cols", state.cols);

    state.cellEls = Array.from({ length: state.rows }, () =>
      new Array(state.cols),
    );

    const fragment = document.createDocumentFragment();

    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cellEl = document.createElement("button");
        cellEl.type = "button";
        cellEl.className = "cell";
        cellEl.setAttribute("role", "gridcell");
        cellEl.setAttribute("aria-label", `Casilla fila ${r + 1}, columna ${c + 1}`);
        cellEl.dataset.row = r;
        cellEl.dataset.col = c;

        cellEl.addEventListener("click", onCellClick);
        cellEl.addEventListener("contextmenu", onCellRightClick);
        cellEl.addEventListener("mousedown", onCellMouseDown);
        cellEl.addEventListener("mouseup", onCellMouseUp);
        cellEl.addEventListener("mouseleave", onCellMouseUp);

        state.cellEls[r][c] = cellEl;
        fragment.appendChild(cellEl);
      }
    }

    boardEl.appendChild(fragment);
  }

  /* -------------------- Mine placement (after first click) -------------------- */
  /**
   * Places mines on the board, guaranteeing that the cell at (safeRow, safeCol)
   * AND its 8 neighbors are NEVER mines. This guarantees the first click is a
   * "0" cell, triggering a generous flood-fill opening.
   */
  function placeMines(safeRow, safeCol) {
    // Build a set of forbidden coordinates (the safe zone).
    const forbidden = new Set();
    forbidden.add(`${safeRow},${safeCol}`);
    eachNeighbor(safeRow, safeCol, (_cell, nr, nc) => {
      forbidden.add(`${nr},${nc}`);
    });

    // Build a list of every candidate coordinate not in the safe zone.
    const candidates = [];
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        if (!forbidden.has(`${r},${c}`)) candidates.push([r, c]);
      }
    }

    // If, on a tiny board, there aren't enough candidates, relax the safe zone
    // down to just the clicked cell (still guarantees first click is safe).
    let pool = candidates;
    if (pool.length < state.totalMines) {
      pool = [];
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          if (!(r === safeRow && c === safeCol)) pool.push([r, c]);
        }
      }
    }

    // Fisher–Yates shuffle, then take the first N.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    for (let i = 0; i < state.totalMines; i++) {
      const [r, c] = pool[i];
      state.board[r][c].isMine = true;
    }

    // Pre-compute neighborMines for all non-mine cells.
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.board[r][c];
        if (cell.isMine) continue;
        let count = 0;
        eachNeighbor(r, c, (n) => {
          if (n.isMine) count++;
        });
        cell.neighborMines = count;
      }
    }
  }

  /* -------------------- Reveal & Flood Fill -------------------- */
  /**
   * Iterative flood-fill (BFS). Starting from (r, c):
   *   - Reveal the cell.
   *   - If neighborMines === 0, enqueue all 8 neighbors.
   *   - Numbered borders are revealed (they enter the queue) but
   *     do not propagate further.
   * Iterative is preferred over recursive to avoid stack overflows
   * on very large boards.
   */
  function floodReveal(startR, startC) {
    const queue = [[startR, startC]];

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const cell = state.board[r][c];

      if (cell.isRevealed || cell.isFlagged || cell.isMine) continue;

      cell.isRevealed = true;
      state.revealedCount++;
      paintRevealedCell(cell);

      // Empty cell: spread to all neighbors.
      if (cell.neighborMines === 0) {
        eachNeighbor(r, c, (neighbor, nr, nc) => {
          if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
            queue.push([nr, nc]);
          }
        });
      }
    }
  }

  function paintRevealedCell(cell) {
    const el = state.cellEls[cell.row][cell.col];
    el.classList.add("is-revealed");
    el.classList.remove("is-flagged");
    if (cell.neighborMines > 0) {
      el.dataset.value = cell.neighborMines;
      el.textContent = cell.neighborMines;
    }
  }

  /* -------------------- Event handlers -------------------- */
  function onCellClick(event) {
    if (state.isGameOver) return;

    const { row, col } = event.currentTarget.dataset;
    const r = Number(row);
    const c = Number(col);
    const cell = state.board[r][c];

    if (cell.isFlagged || cell.isRevealed) return;

    // First click: lazily place mines AFTER the user picks a cell.
    if (state.isFirstClick) {
      placeMines(r, c);
      state.isFirstClick = false;
      startTimer();
    }

    if (cell.isMine) {
      triggerLoss(r, c);
      return;
    }

    floodReveal(r, c);
    checkVictory();
  }

  function onCellRightClick(event) {
    event.preventDefault(); // Prevents the default browser context menu.
    if (state.isGameOver) return;

    const { row, col } = event.currentTarget.dataset;
    const r = Number(row);
    const c = Number(col);
    const cell = state.board[r][c];

    if (cell.isRevealed) return;

    cell.isFlagged = !cell.isFlagged;
    const el = state.cellEls[r][c];
    el.classList.toggle("is-flagged", cell.isFlagged);
    state.flagsPlaced += cell.isFlagged ? 1 : -1;
    updateHUD();
  }

  function onCellMouseDown(event) {
    if (state.isGameOver) return;
    if (event.button === 0) setFace("😮");
  }

  function onCellMouseUp() {
    if (state.isGameOver) return;
    setFace("🙂");
  }

  /* -------------------- Loss / Victory -------------------- */
  function triggerLoss(explodedRow, explodedCol) {
    state.isGameOver = true;
    stopTimer();
    boardEl.classList.add("is-locked");
    setFace("😵");

    // Reveal every mine; mark wrong flags.
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.board[r][c];
        const el = state.cellEls[r][c];

        if (cell.isMine && !cell.isFlagged) {
          el.classList.add("is-revealed", "is-mine");
        } else if (!cell.isMine && cell.isFlagged) {
          el.classList.remove("is-flagged");
          el.classList.add("is-wrong-flag");
        }
      }
    }

    const explodedEl = state.cellEls[explodedRow][explodedCol];
    explodedEl.classList.add("is-revealed", "is-mine", "is-exploded");

    // Show modal after the shake animation has had a moment to play.
    setTimeout(() => {
      showModal({
        kind: "lose",
        icon: "💥",
        title: "¡BOOM! Has perdido",
        message: `Detonaste una mina tras ${state.elapsedSeconds} segundos. ¿Otra ronda?`,
      });
    }, 700);
  }

  function checkVictory() {
    const totalCells = state.rows * state.cols;
    // Victory: every non-mine cell is revealed.
    if (state.revealedCount === totalCells - state.totalMines) {
      triggerWin();
    }
  }

  function triggerWin() {
    state.isGameOver = true;
    state.hasWon = true;
    stopTimer();
    boardEl.classList.add("is-locked");
    setFace("😎");

    // Auto-flag all remaining mines and highlight as correct.
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.board[r][c];
        const el = state.cellEls[r][c];
        if (cell.isMine) {
          if (!cell.isFlagged) {
            cell.isFlagged = true;
            state.flagsPlaced++;
          }
          el.classList.add("is-flagged", "is-correct-flag");
        }
      }
    }
    updateHUD();

    setTimeout(() => {
      showModal({
        kind: "win",
        icon: "🏆",
        title: "¡Victoria!",
        message: `Despejaste el campo en ${state.elapsedSeconds} segundos. ¡Excelente!`,
      });
    }, 200);
  }

  /* -------------------- HUD & Timer -------------------- */
  function updateHUD() {
    mineCounterEl.textContent = formatNumber(state.totalMines - state.flagsPlaced);
    timerEl.textContent = formatNumber(state.elapsedSeconds);
  }

  function startTimer() {
    stopTimer();
    state.timerHandle = setInterval(() => {
      state.elapsedSeconds++;
      timerEl.textContent = formatNumber(state.elapsedSeconds);
    }, 1000);
  }

  function stopTimer() {
    if (state.timerHandle !== null) {
      clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
  }

  function setFace(icon) {
    statusFaceIconEl.textContent = icon;
  }

  /* -------------------- Modal -------------------- */
  function showModal({ kind, icon, title, message }) {
    modalIconEl.textContent = icon;
    modalTitleEl.textContent = title;
    modalMessageEl.textContent = message;
    modalEl.classList.toggle("modal--lose", kind === "lose");
    modalEl.hidden = false;
  }

  function hideModal() {
    modalEl.hidden = true;
  }

  /* -------------------- Wire up controls -------------------- */
  restartBtn.addEventListener("click", () => initGame(state.difficulty));
  modalRestartBtn.addEventListener("click", () => initGame(state.difficulty));

  modalEl.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) hideModal();
  });

  difficultyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      difficultyButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      initGame(btn.dataset.difficulty);
    });
  });

  // Keyboard shortcut: R restarts.
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey) {
      initGame(state.difficulty);
    }
    if (e.key === "Escape" && !modalEl.hidden) hideModal();
  });

  // Boot.
  initGame("beginner");
})();
