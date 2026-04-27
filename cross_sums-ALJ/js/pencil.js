/**
 * pencil.js — Pencil/notes mode for candidate digits.
 */
(function() {
  var getRun = CrossSums.getRun;

  var pencilMode = false;
  var listeners = [];

  function initPencilMode(button) {
    if (!button) return;
    button.onclick = function() { setPencilMode(!pencilMode); };
    syncButton(button);
  }

  function isPencilMode() {
    return pencilMode;
  }

  function setPencilMode(enabled) {
    var next = Boolean(enabled);
    if (next === pencilMode) return;
    pencilMode = next;
    var btn = document.getElementById("btn-notes");
    if (btn) syncButton(btn);
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](pencilMode);
    }
  }

  function onPencilModeChange(fn) {
    listeners.push(fn);
    return function() {
      var idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  function togglePencilMark(cell, digit) {
    if (!cell || cell.type !== "blank") return;
    if (!Array.isArray(cell.pencilMarks)) cell.pencilMarks = [];
    var idx = cell.pencilMarks.indexOf(digit);
    if (idx >= 0) {
      cell.pencilMarks.splice(idx, 1);
    } else {
      cell.pencilMarks.push(digit);
      cell.pencilMarks.sort(function(a, b) { return a - b; });
    }
  }

  function clearPencilMarks(cell) {
    if (!cell || cell.type !== "blank") return;
    cell.pencilMarks = [];
  }

  function clearPencilMarksFromRunMates(grid, row, col, value) {
    var modified = [];
    if (value === null || value === undefined) return modified;
    var dirs = ["across", "down"];
    for (var d = 0; d < dirs.length; d++) {
      var dir = dirs[d];
      var run = getRun(grid, row, col, dir);
      for (var i = 0; i < run.length; i++) {
        var coord = run[i];
        if (coord.row === row && coord.col === col) continue;
        var cell = grid[coord.row][coord.col];
        if (
          cell.type === "blank" &&
          Array.isArray(cell.pencilMarks) &&
          cell.pencilMarks.indexOf(value) >= 0
        ) {
          cell.pencilMarks = cell.pencilMarks.filter(function(d) { return d !== value; });
          modified.push({ row: coord.row, col: coord.col });
        }
      }
    }
    return modified;
  }

  function syncButton(btn) {
    btn.setAttribute("aria-pressed", String(pencilMode));
    if (pencilMode) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  }

  // Export to namespace
  CrossSums.initPencilMode = initPencilMode;
  CrossSums.isPencilMode = isPencilMode;
  CrossSums.setPencilMode = setPencilMode;
  CrossSums.onPencilModeChange = onPencilModeChange;
  CrossSums.togglePencilMark = togglePencilMark;
  CrossSums.clearPencilMarks = clearPencilMarks;
  CrossSums.clearPencilMarksFromRunMates = clearPencilMarksFromRunMates;
})();
