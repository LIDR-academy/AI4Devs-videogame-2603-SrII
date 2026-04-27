/**
 * validator.js — Cross Sums solution validation.
 */
(function() {
  var getRun = CrossSums.getRun;
  var getClueForRun = CrossSums.getClueForRun;

  function validateRun(grid, clueRow, clueCol, direction) {
    var clueCell = grid[clueRow][clueCol];
    if (!clueCell || clueCell.type !== "clue") {
      throw new Error(
        "validateRun: cell at (" + clueRow + ", " + clueCol + ") is not a clue"
      );
    }
    var targetSum = direction === "across" ? clueCell.across : clueCell.down;
    if (targetSum === null || targetSum === undefined) {
      throw new Error(
        "validateRun: clue at (" + clueRow + ", " + clueCol + ") has no " + direction + " sum"
      );
    }

    var cells = collectRunCellsFromClue(grid, clueRow, clueCol, direction);
    var values = cells.map(function(c) { return c.value; });
    var complete = values.length > 0 && values.every(function(v) { return v !== null; });
    var filled = values.filter(function(v) { return v !== null; });

    for (var i = 0; i < filled.length; i++) {
      var v = filled[i];
      if (!Number.isInteger(v) || v < 1 || v > 9) {
        return { valid: false, complete: complete, error: "invalid_digit" };
      }
    }

    var seen = {};
    for (var j = 0; j < filled.length; j++) {
      var val = filled[j];
      if (seen[val]) {
        return { valid: false, complete: complete, error: "duplicate" };
      }
      seen[val] = true;
    }

    if (complete) {
      var sum = filled.reduce(function(a, b) { return a + b; }, 0);
      if (sum !== targetSum) {
        return { valid: false, complete: true, error: "wrong_sum" };
      }
    }

    return { valid: true, complete: complete, error: null };
  }

  function validateGrid(grid) {
    var errors = [];
    var allComplete = true;
    var hasAnyRun = false;

    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[0].length; c++) {
        var cell = grid[r][c];
        if (!cell || cell.type !== "clue") continue;

        var directions = ["across", "down"];
        for (var d = 0; d < directions.length; d++) {
          var dir = directions[d];
          var sum = dir === "across" ? cell.across : cell.down;
          if (sum === null || sum === undefined) continue;

          hasAnyRun = true;
          var result = validateRun(grid, r, c, dir);
          if (!result.valid && result.error) {
            errors.push({ row: r, col: c, direction: dir, error: result.error });
          }
          if (!result.complete) {
            allComplete = false;
          }
        }
      }
    }

    return { solved: hasAnyRun && allComplete && errors.length === 0, errors: errors };
  }

  function getCellErrors(grid, row, col) {
    var result = { across: null, down: null };
    var cell = grid[row][col];
    if (!cell || cell.type !== "blank") return result;

    var directions = ["across", "down"];
    for (var d = 0; d < directions.length; d++) {
      var dir = directions[d];
      var clueCoord = findGoverningClue(grid, row, col, dir);
      if (!clueCoord) continue;
      if (getClueForRun(grid, row, col, dir) === null) continue;

      var validation = validateRun(grid, clueCoord.row, clueCoord.col, dir);
      if (!validation.valid && validation.error) {
        result[dir] = validation.error;
      }
    }

    return result;
  }

  function collectRunCellsFromClue(grid, clueRow, clueCol, direction) {
    var delta = direction === "across" ? [0, 1] : [1, 0];
    var dr = delta[0], dc = delta[1];
    var cells = [];
    var r = clueRow + dr;
    var c = clueCol + dc;
    while (
      r >= 0 &&
      r < grid.length &&
      c >= 0 &&
      c < grid[0].length &&
      grid[r][c].type === "blank"
    ) {
      cells.push(grid[r][c]);
      r += dr;
      c += dc;
    }
    return cells;
  }

  function findGoverningClue(grid, row, col, direction) {
    var run = getRun(grid, row, col, direction);
    if (run.length === 0) return null;
    var delta = direction === "across" ? [0, 1] : [1, 0];
    var dr = delta[0], dc = delta[1];
    var start = run[0];
    var clueRow = start.row - dr;
    var clueCol = start.col - dc;
    if (
      clueRow < 0 ||
      clueRow >= grid.length ||
      clueCol < 0 ||
      clueCol >= grid[0].length
    ) {
      return null;
    }
    if (grid[clueRow][clueCol].type !== "clue") return null;
    return { row: clueRow, col: clueCol };
  }

  // Export to namespace
  CrossSums.validateRun = validateRun;
  CrossSums.validateGrid = validateGrid;
  CrossSums.getCellErrors = getCellErrors;
})();
