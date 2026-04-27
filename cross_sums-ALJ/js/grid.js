/**
 * grid.js — Cross Sums grid data model.
 */
(function() {
  window.CrossSums = window.CrossSums || {};

  function wall() {
    return { type: "wall" };
  }

  function clue(opts) {
    opts = opts || {};
    return { type: "clue", across: opts.across !== undefined ? opts.across : null, down: opts.down !== undefined ? opts.down : null };
  }

  function blank() {
    return { type: "blank", value: null, pencilMarks: [] };
  }

  function createGrid(rows, cols, cellData) {
    if (!Number.isInteger(rows) || rows <= 0) {
      throw new Error("createGrid: invalid rows " + rows);
    }
    if (!Number.isInteger(cols) || cols <= 0) {
      throw new Error("createGrid: invalid cols " + cols);
    }
    if (!Array.isArray(cellData) || cellData.length !== rows * cols) {
      throw new Error(
        "createGrid: cellData length " + (cellData ? cellData.length : 'undefined') + " does not match " + rows + "x" + cols
      );
    }

    var grid = new Array(rows);
    for (var r = 0; r < rows; r++) {
      var row = new Array(cols);
      for (var c = 0; c < cols; c++) {
        row[c] = cloneCell(cellData[r * cols + c]);
      }
      grid[r] = row;
    }
    return grid;
  }

  function getRun(grid, row, col, direction) {
    if (!isInBounds(grid, row, col)) return [];
    var cell = grid[row][col];
    if (!cell || cell.type !== "blank") return [];

    var delta = directionDelta(direction);
    var dr = delta[0], dc = delta[1];
    var coords = [{ row: row, col: col }];

    // Walk backward.
    var r = row - dr;
    var c = col - dc;
    while (isInBounds(grid, r, c) && grid[r][c].type === "blank") {
      coords.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    // Walk forward.
    r = row + dr;
    c = col + dc;
    while (isInBounds(grid, r, c) && grid[r][c].type === "blank") {
      coords.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    return coords;
  }

  function getClueForRun(grid, row, col, direction) {
    var run = getRun(grid, row, col, direction);
    if (run.length === 0) return null;

    var delta = directionDelta(direction);
    var dr = delta[0], dc = delta[1];
    var start = run[0];
    var clueRow = start.row - dr;
    var clueCol = start.col - dc;

    if (!isInBounds(grid, clueRow, clueCol)) return null;
    var cell = grid[clueRow][clueCol];
    if (!cell || cell.type !== "clue") return null;

    return direction === "across" ? cell.across : cell.down;
  }

  function isInBounds(grid, row, col) {
    return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
  }

  function directionDelta(direction) {
    if (direction === "across") return [0, 1];
    if (direction === "down") return [1, 0];
    throw new Error("Unknown direction: " + direction);
  }

  function cloneCell(cell) {
    if (!cell || typeof cell !== "object") {
      throw new Error("cloneCell: invalid cell " + cell);
    }
    switch (cell.type) {
      case "wall":
        return { type: "wall" };
      case "clue":
        return { type: "clue", across: cell.across !== undefined ? cell.across : null, down: cell.down !== undefined ? cell.down : null };
      case "blank":
        return {
          type: "blank",
          value: cell.value !== undefined ? cell.value : null,
          pencilMarks: Array.isArray(cell.pencilMarks) ? cell.pencilMarks.slice() : [],
        };
      default:
        throw new Error("cloneCell: unknown cell type " + cell.type);
    }
  }

  // Export to namespace
  CrossSums.wall = wall;
  CrossSums.clue = clue;
  CrossSums.blank = blank;
  CrossSums.createGrid = createGrid;
  CrossSums.getRun = getRun;
  CrossSums.getClueForRun = getClueForRun;
})();
