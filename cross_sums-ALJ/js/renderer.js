/**
 * renderer.js — DOM rendering for the Cross Sums grid.
 */
(function() {
  var getRun = CrossSums.getRun;
  var getCellErrors = CrossSums.getCellErrors;

  var MAX_GRID_PX = 600;
  var TARGET_CELL_PX = 56;

  function renderGrid(grid, container) {
    if (!container) throw new Error("renderGrid: container is required");
    if (!Array.isArray(grid) || grid.length === 0) {
      throw new Error("renderGrid: grid must be a non-empty 2D array");
    }
    var rows = grid.length;
    var cols = grid[0].length;

    container.innerHTML = "";
    container.classList.add("grid");
    container.setAttribute("role", "grid");
    container.setAttribute("aria-label", "Cross Sums grid, " + rows + " by " + cols);
    if (!container.hasAttribute("tabindex")) container.setAttribute("tabindex", "0");
    container.style.setProperty("--rows", String(rows));
    container.style.setProperty("--cols", String(cols));
    container.style.setProperty("--cell-size", computeCellSize(rows, cols) + "px");

    for (var r = 0; r < rows; r++) {
      var rowEl = document.createElement("div");
      rowEl.setAttribute("role", "row");
      rowEl.style.display = "contents";
      for (var c = 0; c < cols; c++) {
        rowEl.appendChild(buildCellElement(grid[r][c], r, c));
      }
      container.appendChild(rowEl);
    }
  }

  function updateCellDisplay(grid, row, col, container) {
    var cell = grid[row][col];
    if (!cell || cell.type !== "blank") return;
    var el = findCellEl(container, row, col);
    if (!el) return;

    var valEl = el.querySelector(".cell-value");
    if (valEl) valEl.remove();
    var pencilEl = el.querySelector(".cell-pencil");
    if (pencilEl) pencilEl.remove();

    if (cell.value !== null && cell.value !== undefined) {
      var newValEl = document.createElement("span");
      newValEl.classList.add("cell-value");
      newValEl.setAttribute("aria-hidden", "true");
      newValEl.textContent = String(cell.value);
      el.appendChild(newValEl);
    } else if (Array.isArray(cell.pencilMarks) && cell.pencilMarks.length > 0) {
      el.appendChild(buildPencilGrid(cell.pencilMarks));
    }
    el.setAttribute("aria-label", blankAriaLabel(row, col, cell));

    var errs = cell.value === null ? { across: null, down: null } : getCellErrors(grid, row, col);
    var wasError = el.classList.contains("error");
    var isError = false;

    var dirs = ["across", "down"];
    for (var d = 0; d < dirs.length; d++) {
      var dir = dirs[d];
      if (errs[dir] !== "duplicate") continue;
      isError = true;
      var run = getRun(grid, row, col, dir);
      for (var i = 0; i < run.length; i++) {
        var coord = run[i];
        if (grid[coord.row][coord.col].value === cell.value) {
          var mate = findCellEl(container, coord.row, coord.col);
          if (mate) markError(mate, !mate.classList.contains("error"));
        }
      }
    }

    if (!isError && wasError) {
      el.classList.remove("error", "error-shake");
    }
  }

  function updateAllErrors(grid, container) {
    var previouslyErrored = {};
    var errorEls = container.querySelectorAll(".cell.error");
    for (var i = 0; i < errorEls.length; i++) {
      var el = errorEls[i];
      previouslyErrored[el.dataset.row + "," + el.dataset.col] = true;
    }

    var erroredNow = {};
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[0].length; c++) {
        var cell = grid[r][c];
        if (cell.type !== "blank" || cell.value === null) continue;
        var errs = getCellErrors(grid, r, c);
        var dirs = ["across", "down"];
        for (var d = 0; d < dirs.length; d++) {
          var dir = dirs[d];
          if (errs[dir] !== "duplicate") continue;
          var run = getRun(grid, r, c, dir);
          for (var j = 0; j < run.length; j++) {
            var coord = run[j];
            if (grid[coord.row][coord.col].value === cell.value) {
              erroredNow[coord.row + "," + coord.col] = true;
            }
          }
        }
      }
    }

    var currentErrors = container.querySelectorAll(".cell.error");
    for (var k = 0; k < currentErrors.length; k++) {
      var errEl = currentErrors[k];
      var key = errEl.dataset.row + "," + errEl.dataset.col;
      if (!erroredNow[key]) errEl.classList.remove("error", "error-shake");
    }
    for (var errKey in erroredNow) {
      var parts = errKey.split(",");
      var rr = parseInt(parts[0], 10);
      var cc = parseInt(parts[1], 10);
      var cellEl = findCellEl(container, rr, cc);
      if (!cellEl) continue;
      markError(cellEl, !previouslyErrored[errKey]);
    }
  }

  function markError(el, fresh) {
    el.classList.add("error");
    if (!fresh) return;
    el.classList.remove("error-shake");
    void el.offsetWidth;
    el.classList.add("error-shake");
  }

  function findCellEl(container, row, col) {
    return container.querySelector('.cell[data-row="' + row + '"][data-col="' + col + '"]');
  }

  function buildPencilGrid(marks) {
    var wrap = document.createElement("div");
    wrap.classList.add("cell-pencil");
    var set = {};
    for (var i = 0; i < marks.length; i++) set[marks[i]] = true;
    for (var d = 1; d <= 9; d++) {
      var slot = document.createElement("span");
      slot.classList.add("pencil-mark");
      slot.dataset.digit = String(d);
      if (set[d]) slot.textContent = String(d);
      wrap.appendChild(slot);
    }
    return wrap;
  }

  function computeCellSize(rows, cols) {
    var maxDim = Math.max(rows, cols);
    var viewport = typeof window !== "undefined" ? window.innerWidth - 24 : MAX_GRID_PX;
    var limit = Math.min(MAX_GRID_PX, Math.max(240, viewport));
    var fitted = Math.floor(limit / maxDim);
    return Math.max(20, Math.min(TARGET_CELL_PX, fitted));
  }

  function buildCellElement(cell, row, col) {
    var el = document.createElement("div");
    el.classList.add("cell");
    el.dataset.row = String(row);
    el.dataset.col = String(col);
    el.setAttribute("role", "gridcell");

    switch (cell.type) {
      case "wall":
        el.classList.add("cell-wall");
        el.setAttribute("aria-label", "Wall");
        break;
      case "clue":
        el.classList.add("cell-clue");
        el.setAttribute("aria-label", clueAriaLabel(cell));
        el.appendChild(buildClueDiagonal());
        if (cell.down !== null && cell.down !== undefined) {
          var downEl = document.createElement("span");
          downEl.classList.add("clue-down");
          downEl.setAttribute("aria-hidden", "true");
          downEl.textContent = String(cell.down);
          el.appendChild(downEl);
        }
        if (cell.across !== null && cell.across !== undefined) {
          var acrossEl = document.createElement("span");
          acrossEl.classList.add("clue-across");
          acrossEl.setAttribute("aria-hidden", "true");
          acrossEl.textContent = String(cell.across);
          el.appendChild(acrossEl);
        }
        break;
      case "blank":
        el.classList.add("cell-blank");
        el.setAttribute("aria-label", blankAriaLabel(row, col, cell));
        if (cell.value !== null && cell.value !== undefined) {
          var valEl = document.createElement("span");
          valEl.classList.add("cell-value");
          valEl.setAttribute("aria-hidden", "true");
          valEl.textContent = String(cell.value);
          el.appendChild(valEl);
        }
        break;
      default:
        el.classList.add("cell-wall");
    }
    return el;
  }

  function clueAriaLabel(cell) {
    var parts = [];
    if (cell.across !== null && cell.across !== undefined) {
      parts.push(cell.across + " across");
    }
    if (cell.down !== null && cell.down !== undefined) {
      parts.push(cell.down + " down");
    }
    return parts.length > 0 ? "Clue: " + parts.join(", ") : "Clue";
  }

  function blankAriaLabel(row, col, cell) {
    var v;
    if (cell.value !== null && cell.value !== undefined) {
      v = "value " + cell.value;
    } else if (Array.isArray(cell.pencilMarks) && cell.pencilMarks.length > 0) {
      v = "notes " + cell.pencilMarks.join(", ");
    } else {
      v = "empty";
    }
    return "Row " + (row + 1) + ", Column " + (col + 1) + ", " + v;
  }

  function buildClueDiagonal() {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.classList.add("clue-diag");
    svg.setAttribute("viewBox", "0 0 10 10");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    var line = document.createElementNS(NS, "line");
    line.setAttribute("x1", "10");
    line.setAttribute("y1", "0");
    line.setAttribute("x2", "0");
    line.setAttribute("y2", "10");
    line.setAttribute("vector-effect", "non-scaling-stroke");
    svg.appendChild(line);
    return svg;
  }

  // Export to namespace
  CrossSums.renderGrid = renderGrid;
  CrossSums.updateCellDisplay = updateCellDisplay;
  CrossSums.updateAllErrors = updateAllErrors;
})();
