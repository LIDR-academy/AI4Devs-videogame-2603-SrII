/**
 * puzzles.js — Hardcoded starter puzzles.
 */
(function() {
  var createGrid = CrossSums.createGrid;
  var wall = CrossSums.wall;
  var clue = CrossSums.clue;
  var blank = CrossSums.blank;

  // Compact cell shorthands
  var W = function() { return wall(); };
  var B = function() { return blank(); };
  var Cd = function(down) { return clue({ down: down }); };
  var Ca = function(across) { return clue({ across: across }); };
  var Cad = function(across, down) { return clue({ across: across, down: down }); };

  // Puzzle 1: "Tiny" — 4×4
  var tinyCells = [
    W(),     Cd(4),   Cd(10),  W(),
    Ca(3),   B(),     B(),     W(),
    Ca(11),  B(),     B(),     W(),
    W(),     W(),     W(),     W(),
  ];
  var tinySolution = [
    [null, null, null, null],
    [null, 1,    2,    null],
    [null, 3,    8,    null],
    [null, null, null, null],
  ];

  // Puzzle 2: "Starter" — 6×6
  var starterCells = [
    W(),     Cd(4),   Cd(11),  W(),     W(),     W(),
    Ca(3),   B(),     B(),     Cd(21),  W(),     W(),
    Ca(10),  B(),     B(),     B(),     Cd(10),  W(),
    W(),     Ca(21),  B(),     B(),     B(),     W(),
    W(),     W(),     Ca(12),  B(),     B(),     W(),
    W(),     W(),     W(),     W(),     W(),     W(),
  ];
  var starterSolution = [
    [null, null, null, null, null, null],
    [null, 1,    2,    null, null, null],
    [null, 3,    1,    6,    null, null],
    [null, null, 8,    7,    6,    null],
    [null, null, null, 8,    4,    null],
    [null, null, null, null, null, null],
  ];

  // Puzzle 3: "Classic" — 8×8
  var classicCells = [
    W(),     Cd(8),   Cd(10),  Cd(12),  W(),     Cd(8),   Cd(10),  Cd(12),
    Ca(6),   B(),     B(),     B(),     Ca(24),  B(),     B(),     B(),
    Ca(24),  B(),     B(),     B(),     Ca(6),   B(),     B(),     B(),
    W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),
    W(),     Cd(8),   Cd(10),  Cd(12),  W(),     Cd(7),   Cd(10),  Cd(12),
    Ca(7),   B(),     B(),     B(),     Ca(6),   B(),     B(),     B(),
    Ca(23),  B(),     B(),     B(),     Ca(23),  B(),     B(),     B(),
    W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),
  ];
  var classicSolution = [
    [null, null, null, null, null, null, null, null],
    [null, 1,    2,    3,    null, 7,    8,    9   ],
    [null, 7,    8,    9,    null, 1,    2,    3   ],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, 2,    1,    4,    null, 1,    2,    3   ],
    [null, 6,    9,    8,    null, 6,    8,    9   ],
    [null, null, null, null, null, null, null, null],
  ];

  // Puzzle 4: "Challenge" — 10×10
  var challengeCells = [
    W(),     Cd(7),   Cd(9),   Cd(11),  Cd(13),  W(),     Cd(7),   Cd(9),   Cd(11),  Cd(13),
    Ca(10),  B(),     B(),     B(),     B(),     Ca(30),  B(),     B(),     B(),     B(),
    Ca(30),  B(),     B(),     B(),     B(),     Ca(10),  B(),     B(),     B(),     B(),
    W(),     Cd(6),   Cd(9),   Cd(11),  Cd(14),  W(),     Cd(7),   Cd(9),   Cd(11),  Cd(14),
    Ca(11),  B(),     B(),     B(),     B(),     Ca(11),  B(),     B(),     B(),     B(),
    Ca(29),  B(),     B(),     B(),     B(),     Ca(30),  B(),     B(),     B(),     B(),
    W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),
    W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),
    W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),
    W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),     W(),
  ];
  var challengeSolution = [
    [null, null, null, null, null, null, null, null, null, null],
    [null, 1,    2,    3,    4,    null, 6,    7,    8,    9   ],
    [null, 6,    7,    8,    9,    null, 1,    2,    3,    4   ],
    [null, null, null, null, null, null, null, null, null, null],
    [null, 1,    2,    3,    5,    null, 1,    2,    3,    5   ],
    [null, 5,    7,    8,    9,    null, 6,    7,    8,    9   ],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
  ];

  var BUILTIN_PUZZLES = [
    {
      name: "Tiny",
      difficulty: "easy",
      rows: 4,
      cols: 4,
      grid: createGrid(4, 4, tinyCells),
      solution: tinySolution,
    },
    {
      name: "Starter",
      difficulty: "easy",
      rows: 6,
      cols: 6,
      grid: createGrid(6, 6, starterCells),
      solution: starterSolution,
    },
    {
      name: "Classic",
      difficulty: "medium",
      rows: 8,
      cols: 8,
      grid: createGrid(8, 8, classicCells),
      solution: classicSolution,
    },
    {
      name: "Challenge",
      difficulty: "hard",
      rows: 10,
      cols: 10,
      grid: createGrid(10, 10, challengeCells),
      solution: challengeSolution,
    },
  ];

  // Export to namespace
  CrossSums.BUILTIN_PUZZLES = BUILTIN_PUZZLES;
})();
