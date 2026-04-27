/**
 * generator.js — Procedural Cross Sums puzzle generator.
 */
(function() {
  var wall = CrossSums.wall;
  var clue = CrossSums.clue;
  var blank = CrossSums.blank;
  var getRun = CrossSums.getRun;

  var MIN_DIM = 4;
  var MAX_DIM = 15;
  var SOLVER_TIME_LIMIT_MS = 1000;
  var PUZZLE_TIME_LIMIT_MS = 5000;
  var PUZZLE_MAX_ATTEMPTS = 10;
  var UNIQUENESS_TIME_LIMIT_MS = 5000;
  var GIVEN_LOOP_TIME_LIMIT_MS = 800;
  var LARGE_GRID_THRESHOLD = 100;
  var MAX_GIVEN_FRACTION = 0.5;
  var MIN_GIVENS_TO_TRY = 8;
  var ALL_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  var NEIGHBORS_4 = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  var _cache = null;

  function generateCombinations() {
    var map = {};
    var digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (var length = 2; length <= 9; length++) {
      var combos = kCombinations(digits, length);
      for (var i = 0; i < combos.length; i++) {
        var combo = combos[i];
        var sum = 0;
        for (var j = 0; j < combo.length; j++) sum += combo[j];
        var key = sum + "-" + length;
        if (!map[key]) map[key] = [];
        map[key].push(combo);
      }
    }
    return map;
  }

  function getCombinations(sum, length) {
    return cache()[sum + "-" + length] || [];
  }

  function isValidClue(sum, length) {
    if (!Number.isInteger(length) || length < 2 || length > 9) return false;
    if (!Number.isInteger(sum)) return false;
    var min = (length * (length + 1)) / 2;
    var max = (length * (19 - length)) / 2;
    if (sum < min || sum > max) return false;
    return getCombinations(sum, length).length > 0;
  }

  function cache() {
    if (!_cache) _cache = generateCombinations();
    return _cache;
  }

  function kCombinations(arr, k) {
    var results = [];
    function helper(start, combo) {
      if (combo.length === k) {
        results.push(combo.slice());
        return;
      }
      for (var i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    }
    helper(0, []);
    return results;
  }

  function solvePuzzle(grid, options) {
    options = options || {};
    var shuffle = options.shuffle !== false;
    var timeLimitMs = options.timeLimitMs || SOLVER_TIME_LIMIT_MS;
    var state = _buildSearchState(grid, false);
    var result = _backtrack(grid, state, {
      mode: "first",
      shuffle: shuffle,
      timeLimitMs: timeLimitMs,
      enforceSums: false
    });
    if (result.found > 0) return grid;
    for (var i = 0; i < state.blanks.length; i++) {
      grid[state.blanks[i].r][state.blanks[i].c].value = state.snapshot[i];
    }
    return null;
  }

  function countSolutions(grid, maxCount, options) {
    maxCount = maxCount || 2;
    options = options || {};
    var timeLimitMs = options.timeLimitMs || UNIQUENESS_TIME_LIMIT_MS;
    var state = _buildSearchState(grid, true);
    var result = _backtrack(grid, state, {
      mode: "count",
      maxCount: maxCount,
      shuffle: false,
      timeLimitMs: timeLimitMs,
      enforceSums: true
    });
    for (var i = 0; i < state.blanks.length; i++) {
      grid[state.blanks[i].r][state.blanks[i].c].value = state.snapshot[i];
    }
    return result.found;
  }

  function generatePuzzle(rows, cols) {
    var start = Date.now();
    var isLarge = rows * cols >= LARGE_GRID_THRESHOLD;

    for (var attempt = 0; attempt < PUZZLE_MAX_ATTEMPTS; attempt++) {
      if (Date.now() - start > PUZZLE_TIME_LIMIT_MS) {
        console.warn("generatePuzzle: budget exceeded (" + (Date.now() - start) + "ms, " + attempt + " attempts)");
        return null;
      }
      var pattern;
      try {
        pattern = generatePattern(rows, cols);
      } catch (e) {
        continue;
      }
      var solved = solvePuzzle(pattern);
      if (!solved) continue;

      deriveClueSums(solved);
      var puzzleGrid = clonePuzzleGrid(solved, true);
      var solutionArr = extractSolution(solved);

      if (isLarge) {
        var t = Date.now();
        var count = countSolutions(puzzleGrid, 2, { timeLimitMs: UNIQUENESS_TIME_LIMIT_MS });
        var elapsed = Date.now() - t;
        var timedOut = elapsed >= UNIQUENESS_TIME_LIMIT_MS && count !== 1;
        var difficulty = timedOut ? "unknown" : estimateDifficulty(solved);
        if (timedOut) {
          console.warn("generatePuzzle: uniqueness check timed out for " + rows + "x" + cols + " (" + elapsed + "ms)");
        }
        return { puzzle: puzzleGrid, solution: solutionArr, difficulty: difficulty };
      }

      var count2 = countSolutions(puzzleGrid, 2, { timeLimitMs: GIVEN_LOOP_TIME_LIMIT_MS });
      if (count2 === 1) {
        return { puzzle: puzzleGrid, solution: solutionArr, difficulty: estimateDifficulty(solved) };
      }

      var blankCoords = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          if (puzzleGrid[r][c].type === "blank" && puzzleGrid[r][c].value === null) {
            blankCoords.push({ r: r, c: c });
          }
        }
      }
      shuffleInPlace(blankCoords);
      var givenCap = Math.min(blankCoords.length, Math.max(MIN_GIVENS_TO_TRY, Math.ceil(blankCoords.length * MAX_GIVEN_FRACTION)));

      var unique = false;
      for (var n = 0; n < givenCap; n++) {
        if (Date.now() - start > PUZZLE_TIME_LIMIT_MS) break;
        var coord = blankCoords[n];
        puzzleGrid[coord.r][coord.c].value = solutionArr[coord.r][coord.c];
        var cnt = countSolutions(puzzleGrid, 2, { timeLimitMs: GIVEN_LOOP_TIME_LIMIT_MS });
        if (cnt === 1) {
          unique = true;
          break;
        }
      }

      if (unique) {
        return { puzzle: puzzleGrid, solution: solutionArr, difficulty: estimateDifficulty(solved) };
      }
    }
    console.warn("generatePuzzle: gave up after " + PUZZLE_MAX_ATTEMPTS + " attempts");
    return null;
  }

  function estimateDifficulty(grid) {
    var rows = grid.length;
    var cols = grid[0].length;
    var size = rows * cols;
    var totalRuns = 0;
    var totalCombinations = 0;
    var singleComboRuns = 0;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = grid[r][c];
        if (cell.type !== "clue") continue;
        var dirs = ["across", "down"];
        for (var d = 0; d < dirs.length; d++) {
          var dir = dirs[d];
          var sum = dir === "across" ? cell.across : cell.down;
          if (sum === null || sum === undefined) continue;
          var len = runLengthFromClue(grid, r, c, dir);
          if (len < 2) continue;
          totalRuns++;
          var combos = getCombinations(sum, len).length;
          totalCombinations += combos;
          if (combos === 1) singleComboRuns++;
        }
      }
    }

    var avgCombos = totalRuns > 0 ? totalCombinations / totalRuns : 0;
    var singleRatio = totalRuns > 0 ? singleComboRuns / totalRuns : 0;
    var score = 0;
    if (size > 100) score += 3;
    else if (size > 64) score += 2;
    else if (size > 36) score += 1;
    if (avgCombos > 6) score += 2;
    else if (avgCombos > 3) score += 1;
    if (singleRatio < 0.05) score += 2;
    else if (singleRatio < 0.2) score += 1;

    if (score <= 1) return "easy";
    if (score <= 3) return "medium";
    if (score <= 5) return "hard";
    return "expert";
  }

  function shuffleInPlace(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }

  function runLengthFromClue(grid, r, c, direction) {
    var delta = direction === "across" ? [0, 1] : [1, 0];
    var dr = delta[0], dc = delta[1];
    var len = 0;
    var rr = r + dr;
    var cc = c + dc;
    while (rr >= 0 && rr < grid.length && cc >= 0 && cc < grid[0].length && grid[rr][cc].type === "blank") {
      len++;
      rr += dr;
      cc += dc;
    }
    return len;
  }

  function deriveClueSums(grid) {
    var rows = grid.length;
    var cols = grid[0].length;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c].type !== "clue") continue;
        var acrossSum = 0, acrossLen = 0;
        for (var cc = c + 1; cc < cols && grid[r][cc].type === "blank"; cc++) {
          acrossLen++;
          acrossSum += grid[r][cc].value || 0;
        }
        grid[r][c].across = acrossLen >= 2 ? acrossSum : null;
        var downSum = 0, downLen = 0;
        for (var rr = r + 1; rr < rows && grid[rr][c].type === "blank"; rr++) {
          downLen++;
          downSum += grid[rr][c].value || 0;
        }
        grid[r][c].down = downLen >= 2 ? downSum : null;
      }
    }
  }

  function clonePuzzleGrid(grid, clearValues) {
    var rows = grid.length;
    var cols = grid[0].length;
    var out = new Array(rows);
    for (var r = 0; r < rows; r++) {
      out[r] = new Array(cols);
      for (var c = 0; c < cols; c++) {
        var cell = grid[r][c];
        if (cell.type === "wall") {
          out[r][c] = wall();
        } else if (cell.type === "clue") {
          out[r][c] = clue({ across: cell.across, down: cell.down });
        } else {
          out[r][c] = blank();
          if (!clearValues && cell.value !== null) out[r][c].value = cell.value;
        }
      }
    }
    return out;
  }

  function extractSolution(grid) {
    var result = [];
    for (var r = 0; r < grid.length; r++) {
      var row = [];
      for (var c = 0; c < grid[r].length; c++) {
        row.push(grid[r][c].type === "blank" ? grid[r][c].value : null);
      }
      result.push(row);
    }
    return result;
  }

  function _buildSearchState(grid, enforceSums) {
    var rows = grid.length;
    var cols = grid[0].length;
    var blanks = [];
    var indexOf = {};
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c].type === "blank") {
          indexOf[r + "," + c] = blanks.length;
          blanks.push({ r: r, c: c });
        }
      }
    }

    var runs = [];
    var blankRuns = [];
    for (var i = 0; i < blanks.length; i++) blankRuns.push([]);
    var runSums = [];

    function recordRun(members, clueR, clueC, dir) {
      if (members.length < 2) return;
      var idx = runs.length;
      runs.push(members);
      for (var m = 0; m < members.length; m++) blankRuns[members[m]].push(idx);
      if (enforceSums && clueR >= 0 && clueR < rows && clueC >= 0 && clueC < cols && grid[clueR][clueC].type === "clue") {
        var sum = dir === "across" ? grid[clueR][clueC].across : grid[clueR][clueC].down;
        runSums.push(sum !== undefined ? sum : null);
      } else {
        runSums.push(null);
      }
    }

    // Across runs
    for (var r2 = 0; r2 < rows; r2++) {
      var acc = [];
      var runStart = -1;
      for (var c2 = 0; c2 < cols; c2++) {
        if (grid[r2][c2].type === "blank") {
          if (acc.length === 0) runStart = c2;
          acc.push(indexOf[r2 + "," + c2]);
        } else if (acc.length > 0) {
          recordRun(acc, r2, runStart - 1, "across");
          acc = [];
        }
      }
      if (acc.length > 0) recordRun(acc, r2, runStart - 1, "across");
    }

    // Down runs
    for (var c3 = 0; c3 < cols; c3++) {
      var acc2 = [];
      var runStart2 = -1;
      for (var r3 = 0; r3 < rows; r3++) {
        if (grid[r3][c3].type === "blank") {
          if (acc2.length === 0) runStart2 = r3;
          acc2.push(indexOf[r3 + "," + c3]);
        } else if (acc2.length > 0) {
          recordRun(acc2, runStart2 - 1, c3, "down");
          acc2 = [];
        }
      }
      if (acc2.length > 0) recordRun(acc2, runStart2 - 1, c3, "down");
    }

    var domains = [];
    for (var b = 0; b < blanks.length; b++) {
      var cell = grid[blanks[b].r][blanks[b].c];
      if (cell.value !== null) {
        var s = {};
        s[cell.value] = true;
        domains.push(s);
      } else {
        var d = {};
        for (var x = 1; x <= 9; x++) d[x] = true;
        domains.push(d);
      }
    }

    if (enforceSums) {
      for (var runIdx = 0; runIdx < runs.length; runIdx++) {
        var sum = runSums[runIdx];
        if (sum === null) continue;
        var possible = {};
        var combos = getCombinations(sum, runs[runIdx].length);
        for (var ci = 0; ci < combos.length; ci++) {
          for (var di = 0; di < combos[ci].length; di++) {
            possible[combos[ci][di]] = true;
          }
        }
        for (var mi = 0; mi < runs[runIdx].length; mi++) {
          var dom = domains[runs[runIdx][mi]];
          for (var v in dom) {
            if (!possible[v]) delete dom[v];
          }
        }
      }
    }

    for (var bi = 0; bi < blanks.length; bi++) {
      var cellV = grid[blanks[bi].r][blanks[bi].c];
      if (cellV.value === null) continue;
      var val = cellV.value;
      for (var ri = 0; ri < blankRuns[bi].length; ri++) {
        var runMembers = runs[blankRuns[bi][ri]];
        for (var mi2 = 0; mi2 < runMembers.length; mi2++) {
          if (runMembers[mi2] === bi) continue;
          delete domains[runMembers[mi2]][val];
        }
      }
    }

    var snapshot = [];
    for (var si = 0; si < blanks.length; si++) {
      snapshot.push(grid[blanks[si].r][blanks[si].c].value);
    }

    return { blanks: blanks, runs: runs, blankRuns: blankRuns, runSums: runSums, domains: domains, snapshot: snapshot };
  }

  function _backtrack(grid, state, options) {
    var mode = options.mode;
    var maxCount = options.maxCount || Infinity;
    var shuffle = options.shuffle;
    var timeLimitMs = options.timeLimitMs;
    var enforceSums = options.enforceSums;
    var blanks = state.blanks;
    var runs = state.runs;
    var blankRuns = state.blankRuns;
    var runSums = state.runSums;
    var domains = state.domains;
    var start = Date.now();
    var found = 0;
    var timedOut = false;

    function domainSize(dom) {
      var count = 0;
      for (var k in dom) count++;
      return count;
    }

    function domainToArray(dom) {
      var arr = [];
      for (var k in dom) arr.push(parseInt(k, 10));
      return arr;
    }

    function step() {
      if (found >= maxCount) return mode === "first";
      if (Date.now() - start > timeLimitMs) {
        timedOut = true;
        return false;
      }

      var pick = -1;
      var minSize = 10;
      for (var i = 0; i < blanks.length; i++) {
        if (grid[blanks[i].r][blanks[i].c].value !== null) continue;
        var size = domainSize(domains[i]);
        if (size === 0) return false;
        if (size < minSize) {
          minSize = size;
          pick = i;
          if (size === 1) break;
        }
      }
      if (pick === -1) {
        found++;
        return mode === "first";
      }

      var cell = grid[blanks[pick].r][blanks[pick].c];
      var values = domainToArray(domains[pick]);
      if (shuffle) shuffleInPlace(values);

      for (var vi = 0; vi < values.length; vi++) {
        var v = values[vi];
        cell.value = v;
        var undo = [];
        var dead = false;

        for (var ri = 0; ri < blankRuns[pick].length; ri++) {
          if (dead) break;
          var runMembers = runs[blankRuns[pick][ri]];
          for (var mi = 0; mi < runMembers.length; mi++) {
            var m = runMembers[mi];
            if (m === pick) continue;
            if (!domains[m][v]) continue;
            delete domains[m][v];
            undo.push(m);
            if (domainSize(domains[m]) === 0 && grid[blanks[m].r][blanks[m].c].value === null) {
              dead = true;
              break;
            }
          }
        }

        if (!dead && enforceSums) {
          for (var ri2 = 0; ri2 < blankRuns[pick].length; ri2++) {
            var runIdx = blankRuns[pick][ri2];
            var target = runSums[runIdx];
            if (target === null) continue;
            var total = 0;
            var complete = true;
            var runMembers2 = runs[runIdx];
            for (var mi2 = 0; mi2 < runMembers2.length; mi2++) {
              var cv = grid[blanks[runMembers2[mi2]].r][blanks[runMembers2[mi2]].c].value;
              if (cv === null) {
                complete = false;
                break;
              }
              total += cv;
            }
            if (complete && total !== target) {
              dead = true;
              break;
            }
          }
        }

        var childReturn = !dead && step();
        if (childReturn && mode === "first") return true;

        cell.value = null;
        for (var ui = 0; ui < undo.length; ui++) {
          domains[undo[ui]][v] = true;
        }

        if (found >= maxCount && mode === "count") break;
        if (timedOut) break;
      }
      return false;
    }

    step();
    return { found: found, timedOut: timedOut };
  }

  function generatePattern(rows, cols) {
    if (!Number.isInteger(rows) || rows < MIN_DIM || rows > MAX_DIM) {
      throw new Error("generatePattern: rows must be an integer in [" + MIN_DIM + ", " + MAX_DIM + "], got " + rows);
    }
    if (!Number.isInteger(cols) || cols < MIN_DIM || cols > MAX_DIM) {
      throw new Error("generatePattern: cols must be an integer in [" + MIN_DIM + ", " + MAX_DIM + "], got " + cols);
    }
    var MAX_PATTERN_ATTEMPTS = 50;
    for (var attempt = 0; attempt < MAX_PATTERN_ATTEMPTS; attempt++) {
      var g = tryPattern(rows, cols);
      if (g) return g;
    }
    throw new Error("generatePattern: failed to produce a valid " + rows + "x" + cols + " pattern after " + MAX_PATTERN_ATTEMPTS + " attempts");
  }

  function validatePattern(grid) {
    var issues = [];
    if (!Array.isArray(grid) || grid.length === 0) {
      return { valid: false, issues: ["empty grid"] };
    }
    var rows = grid.length;
    var cols = grid[0].length;

    for (var c = 0; c < cols; c++) {
      if (grid[0][c].type === "blank") issues.push("top-row blank at (0," + c + ")");
    }
    for (var r = 0; r < rows; r++) {
      if (grid[r][0].type === "blank") issues.push("left-col blank at (" + r + ",0)");
    }

    for (var r2 = 0; r2 < rows; r2++) {
      for (var c2 = 0; c2 < cols; c2++) {
        if (grid[r2][c2].type !== "blank") continue;

        var acrossRun = getRun(grid, r2, c2, "across");
        if (acrossRun.length < 2) {
          issues.push("(" + r2 + "," + c2 + ") across run length " + acrossRun.length + " < 2");
        } else if (acrossRun.length > 9) {
          issues.push("(" + r2 + "," + c2 + ") across run length " + acrossRun.length + " > 9");
        } else {
          var start = acrossRun[0];
          var ar = start.row;
          var ac = start.col - 1;
          if (ac < 0 || grid[ar][ac].type !== "clue") {
            issues.push("(" + r2 + "," + c2 + ") across run has no governing clue");
          }
        }

        var downRun = getRun(grid, r2, c2, "down");
        if (downRun.length < 2) {
          issues.push("(" + r2 + "," + c2 + ") down run length " + downRun.length + " < 2");
        } else if (downRun.length > 9) {
          issues.push("(" + r2 + "," + c2 + ") down run length " + downRun.length + " > 9");
        } else {
          var startD = downRun[0];
          var dr = startD.row - 1;
          var dc = startD.col;
          if (dr < 0 || grid[dr][dc].type !== "clue") {
            issues.push("(" + r2 + "," + c2 + ") down run has no governing clue");
          }
        }
      }
    }

    var blanks = [];
    for (var r3 = 0; r3 < rows; r3++) {
      for (var c3 = 0; c3 < cols; c3++) {
        if (grid[r3][c3].type === "blank") blanks.push([r3, c3]);
      }
    }
    if (blanks.length === 0) {
      issues.push("no blank cells");
    } else {
      var seen = {};
      var stack = [blanks[0]];
      seen[blanks[0][0] + "," + blanks[0][1]] = true;
      while (stack.length) {
        var coord = stack.pop();
        for (var n = 0; n < NEIGHBORS_4.length; n++) {
          var nr = coord[0] + NEIGHBORS_4[n][0];
          var nc = coord[1] + NEIGHBORS_4[n][1];
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (grid[nr][nc].type !== "blank") continue;
          var k = nr + "," + nc;
          if (seen[k]) continue;
          seen[k] = true;
          stack.push([nr, nc]);
        }
      }
      var seenCount = 0;
      for (var sk in seen) seenCount++;
      if (seenCount !== blanks.length) {
        issues.push("disconnected blanks: " + seenCount + " reachable / " + blanks.length + " total");
      }
    }

    return { valid: issues.length === 0, issues: issues };
  }

  function tryPattern(rows, cols) {
    var grid = makeWallGrid(rows, cols);
    var targetMin = Math.floor(0.4 * rows * cols);
    var targetMax = Math.ceil(0.55 * rows * cols);

    applyRect(grid, 1, 1, 2, 2);

    var attempts = 0;
    while (countBlanks(grid) < targetMin && attempts < 300) {
      attempts++;
      var r = randInt(1, rows - 2);
      var c = randInt(1, cols - 2);
      var maxH = Math.min(4, rows - r);
      var maxW = Math.min(4, cols - c);
      if (maxH < 2 || maxW < 2) continue;
      var h = randInt(2, maxH);
      var w = randInt(2, maxW);
      if (!rectOverlapsOrAdjacent(grid, r, c, h, w)) continue;
      if (rectWouldExceedMaxRun(grid, r, c, h, w)) continue;
      applyRect(grid, r, c, h, w);
    }

    if (countBlanks(grid) < targetMin) return null;
    if (countBlanks(grid) > targetMax + Math.ceil(0.1 * rows * cols)) return null;

    if (!deriveClues(grid)) return null;
    return validatePattern(grid).valid ? grid : null;
  }

  function makeWallGrid(rows, cols) {
    var grid = new Array(rows);
    for (var r = 0; r < rows; r++) {
      grid[r] = new Array(cols);
      for (var c = 0; c < cols; c++) grid[r][c] = wall();
    }
    return grid;
  }

  function applyRect(grid, r, c, h, w) {
    var rows = grid.length;
    var cols = grid[0].length;
    for (var i = r; i < r + h && i < rows; i++) {
      for (var j = c; j < c + w && j < cols; j++) {
        if (grid[i][j].type !== "blank") grid[i][j] = blank();
      }
    }
  }

  function rectOverlapsOrAdjacent(grid, r, c, h, w) {
    var rows = grid.length;
    var cols = grid[0].length;
    for (var i = r; i < r + h; i++) {
      for (var j = c; j < c + w; j++) {
        if (i < 0 || i >= rows || j < 0 || j >= cols) continue;
        if (grid[i][j].type === "blank") return true;
        for (var n = 0; n < NEIGHBORS_4.length; n++) {
          var ni = i + NEIGHBORS_4[n][0];
          var nj = j + NEIGHBORS_4[n][1];
          if (ni < 0 || ni >= rows || nj < 0 || nj >= cols) continue;
          if (grid[ni][nj].type === "blank") return true;
        }
      }
    }
    return false;
  }

  function rectWouldExceedMaxRun(grid, r, c, h, w) {
    var rows = grid.length;
    var cols = grid[0].length;
    var undo = [];
    for (var i = r; i < r + h && i < rows; i++) {
      for (var j = c; j < c + w && j < cols; j++) {
        if (grid[i][j].type !== "blank") {
          grid[i][j] = blank();
          undo.push([i, j]);
        }
      }
    }
    var bad = false;
    outer: for (var i2 = r; i2 < r + h && i2 < rows; i2++) {
      for (var j2 = c; j2 < c + w && j2 < cols; j2++) {
        if (getRun(grid, i2, j2, "across").length > 9 || getRun(grid, i2, j2, "down").length > 9) {
          bad = true;
          break outer;
        }
      }
    }
    for (var u = 0; u < undo.length; u++) grid[undo[u][0]][undo[u][1]] = wall();
    return bad;
  }

  function countBlanks(grid) {
    var n = 0;
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (grid[r][c].type === "blank") n++;
      }
    }
    return n;
  }

  function deriveClues(grid) {
    var rows = grid.length;
    var cols = grid[0].length;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c].type !== "blank") continue;
        if (r === 0 || c === 0) return false;
        if (grid[r - 1][c].type === "wall") grid[r - 1][c] = clue();
        if (grid[r][c - 1].type === "wall") grid[r][c - 1] = clue();
      }
    }
    return true;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Export to namespace
  CrossSums.generateCombinations = generateCombinations;
  CrossSums.getCombinations = getCombinations;
  CrossSums.isValidClue = isValidClue;
  CrossSums.solvePuzzle = solvePuzzle;
  CrossSums.countSolutions = countSolutions;
  CrossSums.generatePuzzle = generatePuzzle;
  CrossSums.generatePattern = generatePattern;
  CrossSums.validatePattern = validatePattern;
  CrossSums.estimateDifficulty = estimateDifficulty;
})();
