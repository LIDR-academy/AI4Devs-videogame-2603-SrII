(() => {
  'use strict';

  // ===========================
  // CONSTANTS
  // ===========================
  const COLS = 6;
  const ROWS = 12;
  const CELL = 36;
  const NUM_COLORS = 4;

  const COLORS = [
    { name: 'red',    fill: '#e74c3c', light: '#ff6b6b', dark: '#c0392b', glow: 'rgba(231,76,60,0.4)' },
    { name: 'blue',   fill: '#3498db', light: '#5dade2', dark: '#2471a3', glow: 'rgba(52,152,219,0.4)' },
    { name: 'green',  fill: '#2ecc71', light: '#58d68d', dark: '#239b56', glow: 'rgba(46,204,113,0.4)' },
    { name: 'yellow', fill: '#f1c40f', light: '#f4d03f', dark: '#d4ac0f', glow: 'rgba(241,196,15,0.4)' },
  ];

  const COUNTER_COLOR = { fill: '#7f8c8d', light: '#95a5a6', dark: '#5d6d7e' };
  const RAINBOW_COLORS = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

  // Gem types
  const EMPTY = 0, NORMAL = 1, CRASH = 2, COUNTER = 3, RAINBOW = 4;

  // Orientation offsets (dx, dy) for secondary gem relative to primary
  const ORI = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // UP, RIGHT, DOWN, LEFT

  // Timing
  const BASE_FALL_INTERVAL = 800;
  const SOFT_DROP_INTERVAL = 40;
  const LOCK_DELAY = 350;
  const PROCESS_STEP_DELAY = 150;
  // AI difficulty tiers: [moveInterval, randomness, mistakeChance, adjacencyWeight, crashWeight]
  // moveInterval = ms between AI actions (higher = slower)
  // randomness   = added random noise to placement scores
  // mistakeChance = probability AI ignores best move and picks randomly
  // adjacencyWeight / crashWeight = heuristic multipliers
  const AI_DIFFICULTY = [
    { moveInterval: 400, randomness: 25, mistakeChance: 0.25, adjWeight: 2, crashWeight: 5 },  // Easy (default)
    { moveInterval: 300, randomness: 15, mistakeChance: 0.15, adjWeight: 4, crashWeight: 10 }, // After 1 win streak
    { moveInterval: 200, randomness: 8,  mistakeChance: 0.08, adjWeight: 5, crashWeight: 13 }, // After 2 win streak
    { moveInterval: 130, randomness: 4,  mistakeChance: 0.02, adjWeight: 5, crashWeight: 15 }, // After 3+ win streak
  ];
  const COUNTER_TIMER_MAX = 8;
  const CRASH_GEM_CHANCE = 0.30;
  const RAINBOW_INTERVAL = 25;

  // ===========================
  // UTILITY
  // ===========================
  function randInt(max) { return Math.floor(Math.random() * max); }
  function randColor() { return randInt(NUM_COLORS); }

  // ===========================
  // SOUND MANAGER
  // ===========================
  const SFX = {
    drop:       new Audio('assets/sounds/DROP.wav'),
    explosion:  new Audio('assets/sounds/EXPLOSION.wav'),
    pause:      new Audio('assets/sounds/PAUSE.wav'),
    ready:      new Audio('assets/sounds/READY.wav'),
    fight:      new Audio('assets/sounds/FIGHT.wav'),
    hitFloor:   new Audio('assets/sounds/HIT_FLOOR.wav'),
    rotate:     new Audio('assets/sounds/ROTATE_.wav'),
    youWin:     new Audio('assets/sounds/YOU_WIN.wav'),
    youLose:    new Audio('assets/sounds/YOU_LOSE.wav'),
    ko:         new Audio('assets/sounds/KO.wav'),
    soundtrack: new Audio('assets/sounds/KEN_SOUNDTRACK.flac'),
  };

  SFX.soundtrack.loop = true;
  SFX.soundtrack.volume = 0.4;

  function playSound(sfx) {
    sfx.currentTime = 0;
    sfx.play().catch(() => {});
  }

  function stopSound(sfx) {
    sfx.pause();
    sfx.currentTime = 0;
  }

  // ===========================
  // BOARD
  // ===========================
  class Board {
    constructor() {
      this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      this.powerGems = [];
      this.nextPowerId = 1;
    }

    cell(x, y) {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return undefined;
      return this.grid[y][x];
    }

    setCell(x, y, cell) {
      if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
        this.grid[y][x] = cell;
      }
    }

    isEmpty(x, y) {
      return x >= 0 && x < COLS && y >= 0 && y < ROWS && this.grid[y][x] === null;
    }

    inBounds(x, y) {
      return x >= 0 && x < COLS && y >= 0 && y < ROWS;
    }

    canPlace(x, y) {
      return this.inBounds(x, y) && this.grid[y][x] === null;
    }

    // Returns true if the lose column is blocked (column 2, row 0)
    isGameOver() {
      return this.grid[0][2] !== null || this.grid[0][3] !== null;
    }

    // Apply gravity — gems fall to fill empty spaces below
    applyGravity() {
      let moved = false;
      // First, break up power gems that have gaps
      this.breakIncompletePowerGems();

      for (let x = 0; x < COLS; x++) {
        let writeY = ROWS - 1;
        for (let y = ROWS - 1; y >= 0; y--) {
          if (this.grid[y][x] !== null) {
            if (y !== writeY) {
              this.grid[writeY][x] = this.grid[y][x];
              this.grid[y][x] = null;
              moved = true;
            }
            writeY--;
          }
        }
      }
      return moved;
    }

    breakIncompletePowerGems() {
      // Remove power gem references for any power gem that has missing cells
      const pgCells = new Map();
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const c = this.grid[y][x];
          if (c && c.powerGemId) {
            if (!pgCells.has(c.powerGemId)) pgCells.set(c.powerGemId, []);
            pgCells.get(c.powerGemId).push({ x, y });
          }
        }
      }
      for (const pg of this.powerGems) {
        const cells = pgCells.get(pg.id);
        if (!cells || cells.length !== pg.w * pg.h) {
          // Power gem is incomplete, dissolve it
          if (cells) {
            for (const { x, y } of cells) {
              if (this.grid[y][x]) this.grid[y][x].powerGemId = null;
            }
          }
        }
      }
      this.powerGems = this.powerGems.filter(pg => {
        const cells = pgCells.get(pg.id);
        return cells && cells.length === pg.w * pg.h;
      });
    }

    // Tick counter gem timers. Returns positions of converted gems.
    tickCounters() {
      const converted = [];
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const c = this.grid[y][x];
          if (c && c.type === COUNTER) {
            c.timer--;
            if (c.timer <= 0) {
              this.grid[y][x] = { type: NORMAL, color: c.color, powerGemId: null };
              converted.push({ x, y });
            }
          }
        }
      }
      return converted;
    }

    // Detect and form power gems
    detectPowerGems() {
      // Clear existing power gem marks
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const c = this.grid[y][x];
          if (c && c.type === NORMAL) c.powerGemId = null;
        }
      }
      this.powerGems = [];

      for (let color = 0; color < NUM_COLORS; color++) {
        const avail = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            const c = this.grid[y][x];
            if (c && c.type === NORMAL && c.color === color && !c.powerGemId) {
              avail[y][x] = true;
            }
          }
        }

        while (true) {
          const rect = this.findLargestRect(avail);
          if (!rect || rect.area < 4) break;

          const pg = { id: this.nextPowerId++, color, x: rect.x, y: rect.y, w: rect.w, h: rect.h };
          this.powerGems.push(pg);

          for (let py = rect.y; py < rect.y + rect.h; py++) {
            for (let px = rect.x; px < rect.x + rect.w; px++) {
              avail[py][px] = false;
              if (this.grid[py][px]) this.grid[py][px].powerGemId = pg.id;
            }
          }
        }
      }
    }

    findLargestRect(grid) {
      let best = null;
      let bestArea = 0;

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (!grid[y][x]) continue;
          let minW = COLS;
          for (let y2 = y; y2 < ROWS; y2++) {
            if (!grid[y2][x]) break;
            let w = 0;
            while (x + w < COLS && w < minW && grid[y2][x + w]) w++;
            minW = w;
            if (minW < 2) break;
            const h = y2 - y + 1;
            if (h >= 2) {
              const area = h * minW;
              if (area > bestArea) {
                bestArea = area;
                best = { x, y, w: minW, h, area };
              }
            }
          }
        }
      }
      return best;
    }

    // Activate crash gem at (cx, cy). Returns number of gems destroyed.
    activateCrashGem(cx, cy) {
      const crashCell = this.grid[cy][cx];
      if (!crashCell || crashCell.type !== CRASH) return { count: 0, positions: [] };

      const color = crashCell.color;
      let destroyed = 0;

      // Find adjacent same-color gems
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      let hasTarget = false;
      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        const nc = this.cell(nx, ny);
        if (nc && (nc.type === NORMAL || nc.type === CRASH) && nc.color === color) {
          hasTarget = true;
          break;
        }
      }

      if (!hasTarget) return { count: 0, positions: [] };

      // Flood-fill to find all connected same-color gems
      const toDestroy = new Set();
      const stack = [];

      // Start from adjacent same-color cells
      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        const nc = this.cell(nx, ny);
        if (nc && nc.color === color && (nc.type === NORMAL || nc.type === CRASH)) {
          stack.push(`${nx},${ny}`);
        }
      }

      const visited = new Set();
      while (stack.length) {
        const key = stack.pop();
        if (visited.has(key)) continue;
        visited.add(key);
        const [sx, sy] = key.split(',').map(Number);
        const sc = this.cell(sx, sy);
        if (!sc) continue;
        if (sc.color !== color) continue;
        if (sc.type !== NORMAL && sc.type !== CRASH) continue;

        // If part of a power gem, add entire power gem
        if (sc.powerGemId) {
          const pg = this.powerGems.find(p => p.id === sc.powerGemId);
          if (pg) {
            for (let py = pg.y; py < pg.y + pg.h; py++) {
              for (let px = pg.x; px < pg.x + pg.w; px++) {
                const k = `${px},${py}`;
                toDestroy.add(k);
                if (!visited.has(k)) stack.push(k);
              }
            }
          }
        }
        toDestroy.add(key);

        // Expand to adjacent same-color
        for (const [dx, dy] of dirs) {
          const nx2 = sx + dx, ny2 = sy + dy;
          const k2 = `${nx2},${ny2}`;
          if (!visited.has(k2) && this.inBounds(nx2, ny2)) {
            stack.push(k2);
          }
        }
      }

      // Also add the crash gem itself
      toDestroy.add(`${cx},${cy}`);

      // Destroy all found gems + adjacent counter gems
      const counterToDestroy = new Set();
      for (const key of toDestroy) {
        const [dx, dy] = key.split(',').map(Number);
        for (const [ddx, ddy] of dirs) {
          const nx = dx + ddx, ny = dy + ddy;
          const nc = this.cell(nx, ny);
          if (nc && nc.type === COUNTER) {
            counterToDestroy.add(`${nx},${ny}`);
          }
        }
      }

      const destroyedPositions = [];
      for (const key of toDestroy) {
        const [dx, dy] = key.split(',').map(Number);
        destroyedPositions.push({ x: dx, y: dy, color });
        this.grid[dy][dx] = null;
        destroyed++;
      }
      for (const key of counterToDestroy) {
        const [dx, dy] = key.split(',').map(Number);
        destroyedPositions.push({ x: dx, y: dy, color: -1 });
        this.grid[dy][dx] = null;
        destroyed++;
      }

      // Clean up power gems
      this.powerGems = this.powerGems.filter(pg => {
        for (let py = pg.y; py < pg.y + pg.h; py++) {
          for (let px = pg.x; px < pg.x + pg.w; px++) {
            if (!this.grid[py][px]) return false;
          }
        }
        return true;
      });

      return { count: destroyed, positions: destroyedPositions };
    }

    // Activate rainbow gem at (rx, ry)
    activateRainbow(rx, ry) {
      const below = this.cell(rx, ry + 1);
      if (!below || below.type === COUNTER) {
        this.grid[ry][rx] = null;
        return 0;
      }

      const targetColor = below.color;
      this.grid[ry][rx] = null;
      let destroyed = 0;

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const c = this.grid[y][x];
          if (c && c.color === targetColor && (c.type === NORMAL || c.type === CRASH)) {
            this.grid[y][x] = null;
            destroyed++;
          }
        }
      }

      // Also remove counter gems adjacent to destroyed cells
      // (simplified — re-scan)
      this.powerGems = this.powerGems.filter(pg => {
        for (let py = pg.y; py < pg.y + pg.h; py++) {
          for (let px = pg.x; px < pg.x + pg.w; px++) {
            if (!this.grid[py][px]) return false;
          }
        }
        return true;
      });

      return destroyed;
    }

    // Add counter gems to this board
    addCounterGems(count, senderColor) {
      const gems = [];
      // Place from top, spread across columns
      for (let i = 0; i < count; i++) {
        const x = i % COLS;
        // Find the topmost empty cell in this column... actually place from top
        for (let y = 0; y < ROWS; y++) {
          if (this.grid[y][x] === null) {
            const gem = {
              type: COUNTER,
              color: randColor(),
              timer: COUNTER_TIMER_MAX + randInt(4),
              powerGemId: null
            };
            this.grid[y][x] = gem;
            gems.push({ x, y });
            break;
          }
        }
      }
      return gems;
    }

    // Find all crash gems and check if they should activate
    findActiveCrashGems() {
      const active = [];
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
          const c = this.grid[y][x];
          if (c && c.type === CRASH) {
            for (const [dx, dy] of dirs) {
              const nc = this.cell(x + dx, y + dy);
              if (nc && nc.color === c.color && (nc.type === NORMAL || nc.type === CRASH)) {
                active.push({ x, y });
                break;
              }
            }
          }
        }
      }
      return active;
    }

    columnHeight(x) {
      for (let y = 0; y < ROWS; y++) {
        if (this.grid[y][x] !== null) return ROWS - y;
      }
      return 0;
    }

    // Count gems of a specific type
    countGems(type) {
      let count = 0;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (this.grid[y][x] && this.grid[y][x].type === type) count++;
        }
      }
      return count;
    }
  }

  // ===========================
  // GEM PAIR (Falling piece)
  // ===========================
  class GemPair {
    constructor(board, color1, type1, color2, type2) {
      this.board = board;
      this.x = 2; // Primary gem column
      this.y = 0; // Primary gem row
      this.ori = 2; // Start with secondary DOWN (vertical, primary on top)
      this.gem1 = { color: color1, type: type1 }; // Primary (pivot)
      this.gem2 = { color: color2, type: type2 }; // Secondary
    }

    secondaryPos() {
      return {
        x: this.x + ORI[this.ori][0],
        y: this.y + ORI[this.ori][1]
      };
    }

    positions() {
      const s = this.secondaryPos();
      return [
        { x: this.x, y: this.y, gem: this.gem1 },
        { x: s.x, y: s.y, gem: this.gem2 }
      ];
    }

    canMoveTo(nx, ny, nori) {
      const sx = nx + ORI[nori][0];
      const sy = ny + ORI[nori][1];
      return this.board.canPlace(nx, ny) && this.board.canPlace(sx, sy);
    }

    move(dx) {
      if (this.canMoveTo(this.x + dx, this.y, this.ori)) {
        this.x += dx;
        return true;
      }
      return false;
    }

    moveDown() {
      if (this.canMoveTo(this.x, this.y + 1, this.ori)) {
        this.y++;
        return true;
      }
      return false;
    }

    rotate(dir) {
      // dir: 1 = CW, -1 = CCW
      const newOri = (this.ori + dir + 4) % 4;
      if (this.canMoveTo(this.x, this.y, newOri)) {
        this.ori = newOri;
        return true;
      }
      // Wall kick: try shifting left, right
      if (this.canMoveTo(this.x - 1, this.y, newOri)) {
        this.x--;
        this.ori = newOri;
        return true;
      }
      if (this.canMoveTo(this.x + 1, this.y, newOri)) {
        this.x++;
        this.ori = newOri;
        return true;
      }
      // Kick up
      if (this.canMoveTo(this.x, this.y - 1, newOri)) {
        this.y--;
        this.ori = newOri;
        return true;
      }
      return false;
    }

    hardDrop() {
      while (this.moveDown()) { /* keep falling */ }
    }

    // Lock gems into board
    lock() {
      const pos = this.positions();
      for (const p of pos) {
        if (this.board.inBounds(p.x, p.y)) {
          this.board.setCell(p.x, p.y, {
            type: p.gem.type,
            color: p.gem.color,
            timer: p.gem.type === COUNTER ? COUNTER_TIMER_MAX : 0,
            powerGemId: null
          });
        }
      }
    }

    // Get ghost position (where piece would land)
    ghostY() {
      let gy = this.y;
      while (this.canMoveTo(this.x, gy + 1, this.ori)) {
        gy++;
      }
      return gy;
    }
  }

  // ===========================
  // PLAYER
  // ===========================
  class Player {
    constructor(isAI, name) {
      this.board = new Board();
      this.isAI = isAI;
      this.name = name;
      this.score = 0;
      this.wins = 0;
      this.dropCount = 0;
      this.pair = null;
      this.nextPair = null;
      this.state = 'idle'; // idle, falling, processing, gameover
      this.fallTimer = 0;
      this.lockTimer = 0;
      this.processTimer = 0;
      this.chainCount = 0;
      this.totalDestroyed = 0;
      this.pendingCounter = 0;
      this.softDropping = false;
      this.opponent = null;
      this.processStep = 0;
      this.explosions = [];

      // AI state
      this.aiTarget = null;
      this.aiMoveTimer = 0;
      this.aiDecided = false;
      this.aiDifficulty = 0; // index into AI_DIFFICULTY
    }

    reset() {
      this.board = new Board();
      this.score = 0;
      this.dropCount = 0;
      this.pair = null;
      this.nextPair = null;
      this.state = 'idle';
      this.chainCount = 0;
      this.totalDestroyed = 0;
      this.pendingCounter = 0;
      this.processStep = 0;
      this.explosions = [];
      this.aiTarget = null;
      this.aiDecided = false;
    }

    generatePair() {
      const c1 = randColor();
      const c2 = randColor();
      // Determine types
      let t1 = NORMAL, t2 = NORMAL;

      // Rainbow gem every RAINBOW_INTERVAL drops
      if (this.dropCount > 0 && this.dropCount % RAINBOW_INTERVAL === 0) {
        t1 = RAINBOW;
      } else if (Math.random() < CRASH_GEM_CHANCE) {
        // Randomly assign crash gem to one of the pair
        if (Math.random() < 0.5) t1 = CRASH; else t2 = CRASH;
      }

      return { c1, t1, c2, t2 };
    }

    spawn() {
      if (!this.nextPair) {
        const np = this.generatePair();
        this.nextPair = np;
      }

      const np = this.nextPair;
      this.pair = new GemPair(this.board, np.c1, np.t1, np.c2, np.t2);

      // Generate next
      const nn = this.generatePair();
      this.nextPair = nn;

      // Check if spawn position is blocked
      const pos = this.pair.positions();
      for (const p of pos) {
        if (!this.board.canPlace(p.x, p.y)) {
          this.state = 'gameover';
          return false;
        }
      }

      this.state = 'falling';
      this.fallTimer = 0;
      this.lockTimer = 0;
      this.softDropping = false;
      this.aiDecided = false;
      this.aiTarget = null;
      return true;
    }

    update(dt) {
      if (this.state === 'falling') {
        this.updateFalling(dt);
      } else if (this.state === 'processing') {
        this.updateProcessing(dt);
      }

      if (this.isAI && this.state === 'falling') {
        this.updateAI(dt);
      }

      this.updateExplosions(dt);
    }

    updateFalling(dt) {
      const interval = this.softDropping ? SOFT_DROP_INTERVAL : BASE_FALL_INTERVAL;
      this.fallTimer += dt;

      if (this.fallTimer >= interval) {
        this.fallTimer = 0;
        if (!this.pair.moveDown()) {
          // Can't move down — start lock timer
          this.lockTimer += interval;
          if (this.lockTimer >= LOCK_DELAY) {
            this.lockPiece();
          }
        } else {
          this.lockTimer = 0;
        }
      }
    }

    lockPiece() {
      if (!this.pair) return;
      this.pair.lock();
      if (!this.isAI) playSound(SFX.hitFloor);
      this.dropCount++;
      this.pair = null;
      this.state = 'processing';
      this.processTimer = 0;
      this.processStep = 0;
      this.chainCount = 0;
      this.totalDestroyed = 0;
    }

    updateProcessing(dt) {
      this.processTimer += dt;
      if (this.processTimer < PROCESS_STEP_DELAY) return;
      this.processTimer = 0;

      // Processing pipeline
      switch (this.processStep) {
        case 0:
          // Apply gravity
          this.board.applyGravity();
          this.processStep = 1;
          break;

        case 1:
          // Tick counter gems
          this.board.tickCounters();
          this.processStep = 2;
          break;

        case 2:
          // Detect power gems
          this.board.detectPowerGems();
          this.processStep = 3;
          break;

        case 3: {
          // Check for crash gem activations
          const crashGems = this.board.findActiveCrashGems();
          if (crashGems.length > 0) {
            let destroyed = 0;
            const allDestroyed = [];
            for (const cg of crashGems) {
              const result = this.board.activateCrashGem(cg.x, cg.y);
              destroyed += result.count;
              allDestroyed.push(...result.positions);
            }
            if (destroyed > 0) {
              // Spawn explosion particles
              playSound(SFX.explosion);
              for (const pos of allDestroyed) {
                this.spawnExplosion(pos.x, pos.y, pos.color);
              }
              this.chainCount++;
              const chainBonus = Math.pow(2, this.chainCount - 1);
              const points = destroyed * 10 * chainBonus;
              this.score += points;
              this.totalDestroyed += destroyed;
              // Loop back to gravity
              this.processStep = 0;
              break;
            }
          }

          // Check for rainbow gems on top of other gems
          let rainbowDestroyed = 0;
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              const c = this.board.cell(x, y);
              if (c && c.type === RAINBOW) {
                rainbowDestroyed += this.board.activateRainbow(x, y);
              }
            }
          }
          if (rainbowDestroyed > 0) {
            this.score += rainbowDestroyed * 20;
            this.totalDestroyed += rainbowDestroyed;
            this.processStep = 0;
            break;
          }

          this.processStep = 4;
          break;
        }

        case 4:
          // Send counter gems to opponent
          if (this.totalDestroyed > 0 && this.opponent) {
            // First, subtract from pending counter gems aimed at us
            let counterToSend = Math.floor(this.totalDestroyed * 0.7);
            if (this.pendingCounter > 0) {
              const offset = Math.min(this.pendingCounter, counterToSend);
              this.pendingCounter -= offset;
              counterToSend -= offset;
            }
            if (counterToSend > 0) {
              this.opponent.pendingCounter += counterToSend;
            }
          }
          this.processStep = 5;
          break;

        case 5:
          // Receive pending counter gems
          if (this.pendingCounter > 0) {
            const count = Math.min(this.pendingCounter, COLS * 2);
            this.board.addCounterGems(count, 0);
            this.pendingCounter -= count;
            this.board.applyGravity();
          }
          this.processStep = 6;
          break;

        case 6:
          // Final power gem detection after all processing
          this.board.applyGravity();
          this.board.detectPowerGems();
          // Check game over
          if (this.board.isGameOver()) {
            this.state = 'gameover';
          } else {
            this.spawn();
          }
          break;
      }
    }

    // ---- Explosions ----
    spawnExplosion(gx, gy, colorIdx) {
      const cx = gx * CELL + CELL / 2;
      const cy = gy * CELL + CELL / 2;
      const col = colorIdx >= 0 && colorIdx < COLORS.length ? COLORS[colorIdx] : COUNTER_COLOR;
      const count = 6 + randInt(4);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 40 + Math.random() * 80;
        const lifespan = 0.4 + Math.random() * 0.3;
        this.explosions.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 30,
          life: lifespan,
          maxLife: lifespan,
          size: 3 + Math.random() * 4,
          color: col.fill || col.light,
          bright: col.light || '#fff',
        });
      }
    }

    updateExplosions(dt) {
      const sec = dt / 1000;
      for (let i = this.explosions.length - 1; i >= 0; i--) {
        const p = this.explosions[i];
        p.x += p.vx * sec;
        p.y += p.vy * sec;
        p.vy += 120 * sec; // gravity
        p.life -= sec;
        if (p.life <= 0) {
          this.explosions.splice(i, 1);
        }
      }
    }

    // ---- AI ----
    getAIDifficulty() {
      return AI_DIFFICULTY[Math.min(this.aiDifficulty, AI_DIFFICULTY.length - 1)];
    }

    updateAI(dt) {
      if (!this.pair) return;
      const diff = this.getAIDifficulty();
      this.aiMoveTimer += dt;
      if (this.aiMoveTimer < diff.moveInterval) return;
      this.aiMoveTimer = 0;

      if (!this.aiDecided) {
        // Chance of making a mistake (random placement)
        if (Math.random() < diff.mistakeChance) {
          this.aiTarget = { targetX: randInt(COLS), targetOri: randInt(4) };
        } else {
          this.aiTarget = this.computeAITarget();
        }
        this.aiDecided = true;
      }

      if (!this.aiTarget) {
        // No target, just drop
        this.pair.hardDrop();
        this.lockPiece();
        return;
      }

      // Move towards target
      const { targetX, targetOri } = this.aiTarget;

      // First rotate
      if (this.pair.ori !== targetOri) {
        const diff = (targetOri - this.pair.ori + 4) % 4;
        if (diff <= 2) {
          this.pair.rotate(1);
        } else {
          this.pair.rotate(-1);
        }
        return;
      }

      // Then move horizontally
      if (this.pair.x < targetX) {
        this.pair.move(1);
        return;
      } else if (this.pair.x > targetX) {
        this.pair.move(-1);
        return;
      }

      // In position — drop
      this.pair.hardDrop();
      this.lockPiece();
    }

    computeAITarget() {
      if (!this.pair) return null;

      let bestScore = -Infinity;
      let bestTarget = null;

      for (let ori = 0; ori < 4; ori++) {
        for (let x = 0; x < COLS; x++) {
          // Check if position is valid
          const sx = x + ORI[ori][0];
          const sy = 0 + ORI[ori][1];
          if (sx < 0 || sx >= COLS || sy < 0) continue;

          // Simulate placement
          const score = this.evaluatePlacement(x, ori);
          if (score > bestScore) {
            bestScore = score;
            bestTarget = { targetX: x, targetOri: ori };
          }
        }
      }

      return bestTarget;
    }

    evaluatePlacement(x, ori) {
      const board = this.board;
      const pair = this.pair;
      const sx = x + ORI[ori][0];

      if (sx < 0 || sx >= COLS) return -1000;

      // Find landing Y for primary
      let py = 0;
      while (py + 1 < ROWS && board.isEmpty(x, py + 1)) py++;
      if (!board.isEmpty(x, py)) return -1000;

      const sy = py + ORI[ori][1];
      if (sy < 0 || sy >= ROWS || !board.isEmpty(sx, sy)) {
        // Adjust: find where secondary would land
        if (ori === 2) { // DOWN
          // Secondary below primary — find column height
          return -1000;
        }
      }

      // Simple heuristics
      let score = 0;
      const c1 = pair.gem1.color;
      const c2 = pair.gem2.color;

      // Landing heights (lower is better for keeping board low)
      const h1 = board.columnHeight(x);
      const h2 = board.columnHeight(sx);
      score -= h1 * 2;
      score -= h2 * 2;

      // Avoid stacking too high
      if (h1 > 8) score -= 20;
      if (h2 > 8) score -= 20;

      // Adjacency bonus — prefer placing next to same color
      const diff = this.getAIDifficulty();
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      const landY1 = ROWS - 1 - h1;
      const landY2 = ROWS - 1 - h2;

      for (const [dx, dy] of dirs) {
        const nc1 = board.cell(x + dx, landY1 + dy);
        if (nc1 && nc1.color === c1 && nc1.type === NORMAL) score += diff.adjWeight;
        if (sx !== x || ori === 0 || ori === 2) {
          const nc2 = board.cell(sx + dx, landY2 + dy);
          if (nc2 && nc2.color === c2 && nc2.type === NORMAL) score += diff.adjWeight;
        }
      }

      // Same color pair bonus (can form larger groups)
      if (c1 === c2) score += 3;

      // Crash gem bonus: if crash gem is adjacent to same color
      if (pair.gem1.type === CRASH) {
        for (const [dx, dy] of dirs) {
          const nc = board.cell(x + dx, landY1 + dy);
          if (nc && nc.color === c1 && nc.type === NORMAL) score += diff.crashWeight;
        }
      }
      if (pair.gem2.type === CRASH) {
        for (const [dx, dy] of dirs) {
          const nc = board.cell(sx + dx, landY2 + dy);
          if (nc && nc.color === c2 && nc.type === NORMAL) score += diff.crashWeight;
        }
      }

      // Randomness inversely proportional to difficulty
      score += Math.random() * diff.randomness;

      return score;
    }
  }

  // ===========================
  // RENDERER
  // ===========================
  class Renderer {
    constructor() {
      this.boardCanvas1 = document.getElementById('board-p1');
      this.boardCanvas2 = document.getElementById('board-p2');
      this.nextCanvas1 = document.getElementById('next-p1');
      this.nextCanvas2 = document.getElementById('next-p2');
      this.ctx1 = this.boardCanvas1.getContext('2d');
      this.ctx2 = this.boardCanvas2.getContext('2d');
      this.nctx1 = this.nextCanvas1.getContext('2d');
      this.nctx2 = this.nextCanvas2.getContext('2d');

      // Sprite images
      this.sprites = {};
      this.spritesLoaded = false;
      this._loadSprites();
    }

    _loadSprites() {
      const colorNames = ['red', 'blue', 'green', 'yellow'];
      const types = ['normal', 'crash', 'power'];
      const toLoad = [];

      for (const color of colorNames) {
        for (const type of types) {
          const key = `${type}-${color}`;
          toLoad.push(key);
        }
      }
      toLoad.push('counter', 'rainbow');

      let loaded = 0;
      const total = toLoad.length;

      for (const key of toLoad) {
        const img = new Image();
        img.onload = () => {
          loaded++;
          if (loaded >= total) this.spritesLoaded = true;
        };
        img.onerror = () => {
          loaded++;
          if (loaded >= total) this.spritesLoaded = true;
        };
        img.src = `assets/gem-${key}.png`;
        this.sprites[key] = img;
      }
    }

    clear() {
      this.clearCanvas(this.ctx1, this.boardCanvas1);
      this.clearCanvas(this.ctx2, this.boardCanvas2);
      this.clearCanvas(this.nctx1, this.nextCanvas1);
      this.clearCanvas(this.nctx2, this.nextCanvas2);
    }

    clearCanvas(ctx, canvas) {
      ctx.fillStyle = '#0d1b2a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawBoard(ctx, board) {
      // Grid lines
      ctx.strokeStyle = '#1a2744';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, ROWS * CELL);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(COLS * CELL, y * CELL);
        ctx.stroke();
      }

      // Gems
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = board.grid[y][x];
          if (cell) {
            this.drawGem(ctx, x, y, cell, board);
          }
        }
      }

      // Power gem borders
      for (const pg of board.powerGems) {
        this.drawPowerGemBorder(ctx, pg);
      }
    }

    drawGem(ctx, x, y, cell, board) {
      const px = x * CELL;
      const py = y * CELL;
      const size = CELL - 2;
      const offset = 1;
      const colorName = cell.color !== undefined ? COLORS[cell.color].name : null;

      if (cell.type === NORMAL) {
        if (cell.powerGemId) {
          const sprite = this.sprites[`power-${colorName}`];
          if (this.spritesLoaded && sprite && sprite.complete) {
            ctx.drawImage(sprite, px, py, CELL, CELL);
          } else {
            const col = COLORS[cell.color];
            ctx.fillStyle = col.fill;
            ctx.fillRect(px + offset, py + offset, size, size);
            ctx.fillStyle = col.light;
            ctx.fillRect(px + offset + 2, py + offset + 2, size - 10, size - 10);
            ctx.fillStyle = col.fill;
            ctx.fillRect(px + offset + 4, py + offset + 4, size - 14, size - 14);
          }
        } else {
          const sprite = this.sprites[`normal-${colorName}`];
          if (this.spritesLoaded && sprite && sprite.complete) {
            ctx.drawImage(sprite, px, py, CELL, CELL);
          } else {
            const col = COLORS[cell.color];
            ctx.fillStyle = col.dark;
            ctx.fillRect(px + offset, py + offset, size, size);
            ctx.fillStyle = col.fill;
            ctx.fillRect(px + offset, py + offset, size - 3, size - 3);
            ctx.fillStyle = col.light;
            ctx.fillRect(px + offset + 3, py + offset + 3, size - 9, size - 9);
            ctx.fillStyle = col.fill;
            ctx.fillRect(px + offset + 5, py + offset + 5, size - 13, size - 13);
          }
        }
      } else if (cell.type === CRASH) {
        const sprite = this.sprites[`crash-${colorName}`];
        if (this.spritesLoaded && sprite && sprite.complete) {
          ctx.drawImage(sprite, px, py, CELL, CELL);
          // Sparkle overlay
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✦', px + CELL / 2, py + CELL / 2);
        } else {
          const col = COLORS[cell.color];
          const cx = px + CELL / 2;
          const cy = py + CELL / 2;
          const r = size / 2 - 2;
          ctx.fillStyle = col.dark;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r);
          ctx.lineTo(cx + r, cy);
          ctx.lineTo(cx, cy + r);
          ctx.lineTo(cx - r, cy);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = col.fill;
          const r2 = r - 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy - r2);
          ctx.lineTo(cx + r2, cy);
          ctx.lineTo(cx, cy + r2);
          ctx.lineTo(cx - r2, cy);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✦', cx, cy);
        }
      } else if (cell.type === COUNTER) {
        const sprite = this.sprites['counter'];
        if (this.spritesLoaded && sprite && sprite.complete) {
          ctx.drawImage(sprite, px, py, CELL, CELL);
        } else {
          ctx.fillStyle = COUNTER_COLOR.dark;
          ctx.fillRect(px + offset, py + offset, size, size);
          ctx.fillStyle = COUNTER_COLOR.fill;
          ctx.fillRect(px + offset + 2, py + offset + 2, size - 4, size - 4);
          ctx.fillStyle = COUNTER_COLOR.light;
          ctx.fillRect(px + offset + 4, py + offset + 4, size - 10, size - 10);
          ctx.fillStyle = COUNTER_COLOR.fill;
          ctx.fillRect(px + offset + 6, py + offset + 6, size - 14, size - 14);
        }
        // Timer number always drawn
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.timer, px + CELL / 2, py + CELL / 2);
      } else if (cell.type === RAINBOW) {
        const sprite = this.sprites['rainbow'];
        if (this.spritesLoaded && sprite && sprite.complete) {
          ctx.drawImage(sprite, px, py, CELL, CELL);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', px + CELL / 2, py + CELL / 2);
        } else {
          const segW = size / RAINBOW_COLORS.length;
          for (let i = 0; i < RAINBOW_COLORS.length; i++) {
            ctx.fillStyle = RAINBOW_COLORS[i];
            ctx.fillRect(px + offset + i * segW, py + offset, segW + 0.5, size);
          }
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + offset, py + offset, size, size);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', px + CELL / 2, py + CELL / 2);
        }
      }
    }

    drawPowerGemBorder(ctx, pg) {
      const col = COLORS[pg.color];
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        pg.x * CELL + 1,
        pg.y * CELL + 1,
        pg.w * CELL - 2,
        pg.h * CELL - 2
      );
      // Glow
      ctx.shadowColor = col.glow;
      ctx.shadowBlur = 6;
      ctx.strokeStyle = col.light;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        pg.x * CELL + 3,
        pg.y * CELL + 3,
        pg.w * CELL - 6,
        pg.h * CELL - 6
      );
      ctx.shadowBlur = 0;
    }

    drawFallingPair(ctx, pair) {
      if (!pair) return;

      // Ghost piece
      const ghostY = pair.ghostY();
      if (ghostY !== pair.y) {
        const ghostPositions = [
          { x: pair.x, y: ghostY },
          { x: pair.x + ORI[pair.ori][0], y: ghostY + ORI[pair.ori][1] }
        ];
        ctx.globalAlpha = 0.25;
        for (let i = 0; i < 2; i++) {
          const p = ghostPositions[i];
          const gem = i === 0 ? pair.gem1 : pair.gem2;
          this.drawGem(ctx, p.x, p.y, { type: gem.type, color: gem.color }, null);
        }
        ctx.globalAlpha = 1.0;
      }

      // Actual pair
      const positions = pair.positions();
      for (const p of positions) {
        this.drawGem(ctx, p.x, p.y, { type: p.gem.type, color: p.gem.color }, null);
      }
    }

    drawNextPiece(ctx, canvas, nextPair) {
      this.clearCanvas(ctx, canvas);
      if (!nextPair) return;

      const offsetX = (canvas.width - 2 * CELL) / 2;
      const offsetY = 4;

      // Draw the two gems vertically
      const gem1 = { type: nextPair.t1, color: nextPair.c1 };
      const gem2 = { type: nextPair.t2, color: nextPair.c2 };

      ctx.save();
      ctx.translate(offsetX, offsetY);
      this.drawGem(ctx, 0, 0, gem1, null);
      this.drawGem(ctx, 0, 1, gem2, null);
      ctx.restore();
    }

    drawGameOver(ctx, canvas, isWinner) {
      ctx.fillStyle = isWinner ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        isWinner ? 'WIN!' : 'LOSE',
        canvas.width / 2,
        canvas.height / 2
      );
    }

    drawPause(ctx, canvas) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f39c12';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }

    drawExplosions(ctx, explosions) {
      for (const p of explosions) {
        const alpha = Math.max(0, p.life / p.maxLife);
        const size = p.size * (0.5 + alpha * 0.5);
        ctx.globalAlpha = alpha;
        // Bright core
        ctx.fillStyle = p.bright;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Colored outer
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    render(game) {
      this.clear();

      // Board 1
      this.drawBoard(this.ctx1, game.player1.board);
      if (game.player1.state === 'falling') {
        this.drawFallingPair(this.ctx1, game.player1.pair);
      }
      this.drawExplosions(this.ctx1, game.player1.explosions);

      // Board 2
      this.drawBoard(this.ctx2, game.player2.board);
      if (game.player2.state === 'falling') {
        this.drawFallingPair(this.ctx2, game.player2.pair);
      }
      this.drawExplosions(this.ctx2, game.player2.explosions);

      // Next pieces
      this.drawNextPiece(this.nctx1, this.nextCanvas1, game.player1.nextPair);
      this.drawNextPiece(this.nctx2, this.nextCanvas2, game.player2.nextPair);

      // Game over overlays
      if (game.player1.state === 'gameover' || game.player2.state === 'gameover') {
        const p1Lost = game.player1.state === 'gameover';
        const p2Lost = game.player2.state === 'gameover';
        if (p1Lost) this.drawGameOver(this.ctx1, this.boardCanvas1, false);
        if (p2Lost) this.drawGameOver(this.ctx2, this.boardCanvas2, false);
        if (p1Lost && !p2Lost) this.drawGameOver(this.ctx2, this.boardCanvas2, true);
        if (p2Lost && !p1Lost) this.drawGameOver(this.ctx1, this.boardCanvas1, true);
      }

      // Pause
      if (game.paused) {
        this.drawPause(this.ctx1, this.boardCanvas1);
        this.drawPause(this.ctx2, this.boardCanvas2);
      }

      // Update DOM
      document.getElementById('score-p1').textContent = game.player1.score;
      document.getElementById('score-p2').textContent = game.player2.score;
      document.getElementById('wins-p1').textContent = game.player1.wins;
      document.getElementById('wins-p2').textContent = game.player2.wins;
      document.getElementById('drops-p1').textContent = game.player1.dropCount;
      document.getElementById('drops-p2').textContent = game.player2.dropCount;

      // Counter warnings
      const cw1 = document.getElementById('counter-warning-p1');
      const cw2 = document.getElementById('counter-warning-p2');
      cw1.textContent = game.player1.pendingCounter > 0
        ? `⚠ ${game.player1.pendingCounter} incoming` : '';
      cw2.textContent = game.player2.pendingCounter > 0
        ? `⚠ ${game.player2.pendingCounter} incoming` : '';

      // Difficulty label
      const diffEl = document.getElementById('ai-difficulty');
      if (diffEl) diffEl.textContent = game.getDifficultyLabel();
    }
  }

  // ===========================
  // GAME
  // ===========================
  class Game {
    constructor() {
      this.player1 = new Player(false, 'Player 1');
      this.player2 = new Player(true, 'CPU');
      this.player1.opponent = this.player2;
      this.player2.opponent = this.player1;
      this.renderer = new Renderer();
      this.running = false;
      this.paused = false;
      this.lastTime = 0;
      this.gameOverTimer = 0;
      this.roundOver = false;
      this.p1WinStreak = 0;
    }

    start() {
      this.player1.reset();
      this.player2.reset();
      this.player1.opponent = this.player2;
      this.player2.opponent = this.player1;
      this.running = true;
      this.paused = false;
      this.roundOver = false;
      this.gameOverTimer = 0;
      this.p1WinStreak = 0;
      this.player2.aiDifficulty = 0;
      this.player1.spawn();
      this.player2.spawn();

      document.getElementById('overlay').classList.add('hidden');
      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    }

    loop(time) {
      if (!this.running) return;

      const dt = time - this.lastTime;
      this.lastTime = time;

      if (!this.paused) {
        this.update(dt);
      }

      this.renderer.render(this);
      requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
      if (this.roundOver) {
        this.gameOverTimer += dt;
        if (this.gameOverTimer > 2500) {
          // Auto-restart round
          this.startNewRound();
        }
        return;
      }

      this.player1.update(dt);
      this.player2.update(dt);

      // Check game over
      if (this.player1.state === 'gameover' || this.player2.state === 'gameover') {
        if (!this.roundOver) {
          this.roundOver = true;
          this.gameOverTimer = 0;
          stopSound(SFX.soundtrack);
          playSound(SFX.ko);
          if (this.player1.state === 'gameover' && this.player2.state !== 'gameover') {
            this.player2.wins++;
            this.p1WinStreak = 0; // Player lost, reset streak
            playSound(SFX.youLose);
          } else if (this.player2.state === 'gameover' && this.player1.state !== 'gameover') {
            this.player1.wins++;
            this.p1WinStreak++;
            playSound(SFX.youWin);
          }
          // Adjust AI difficulty based on player win streak
          this.player2.aiDifficulty = Math.min(this.p1WinStreak, AI_DIFFICULTY.length - 1);
        }
      }
    }

    startNewRound() {
      const p1Wins = this.player1.wins;
      const p2Wins = this.player2.wins;
      this.player1.reset();
      this.player2.reset();
      this.player1.wins = p1Wins;
      this.player2.wins = p2Wins;
      this.player1.opponent = this.player2;
      this.player2.opponent = this.player1;
      this.roundOver = false;
      this.gameOverTimer = 0;
      this.player1.spawn();
      this.player2.spawn();
      // Resume soundtrack for new round
      SFX.soundtrack.currentTime = 0;
      SFX.soundtrack.play().catch(() => {});
    }

    getDifficultyLabel() {
      const labels = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];
      return labels[Math.min(this.player2.aiDifficulty, labels.length - 1)];
    }

    togglePause() {
      this.paused = !this.paused;
      if (!this.paused) {
        this.lastTime = performance.now();
      }
    }
  }

  // ===========================
  // INPUT HANDLING
  // ===========================
  class InputHandler {
    constructor(game) {
      this.game = game;
      this.keys = {};

      document.addEventListener('keydown', (e) => this.onKeyDown(e));
      document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(e) {
      if (this.keys[e.code]) return; // Prevent repeat
      this.keys[e.code] = true;

      const player = this.game.player1;

      if (e.code === 'KeyP') {
        if (this.game.running && !this.game.roundOver) {
          this.game.togglePause();
          playSound(SFX.pause);
          if (this.game.paused) {
            SFX.soundtrack.pause();
          } else {
            SFX.soundtrack.play().catch(() => {});
          }
        }
        return;
      }

      if (this.game.paused || !this.game.running) return;
      if (player.state !== 'falling' || !player.pair) return;

      switch (e.code) {
        case 'ArrowLeft':
          player.pair.move(-1);
          break;
        case 'ArrowRight':
          player.pair.move(1);
          break;
        case 'ArrowDown':
          player.softDropping = true;
          playSound(SFX.drop);
          break;
        case 'ArrowUp':
          playSound(SFX.drop);
          player.pair.hardDrop();
          player.lockPiece();
          break;
        case 'KeyZ':
          player.pair.rotate(-1);
          playSound(SFX.rotate);
          break;
        case 'KeyX':
          player.pair.rotate(1);
          playSound(SFX.rotate);
          break;
      }

      e.preventDefault();
    }

    onKeyUp(e) {
      this.keys[e.code] = false;

      if (e.code === 'ArrowDown') {
        this.game.player1.softDropping = false;
      }
    }
  }

  // ===========================
  // INITIALIZATION
  // ===========================
  const game = new Game();
  const input = new InputHandler(game);

  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('start-btn');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMessage = document.getElementById('overlay-message');

  // Play READY sound on first mouse enter (browsers need user gesture for audio)
  document.addEventListener('mouseenter', () => {
    playSound(SFX.ready);
  }, { once: true });

  startBtn.addEventListener('click', () => {
    playSound(SFX.fight);
    // Start the soundtrack after the FIGHT voice clip (~1s)
    setTimeout(() => {
      SFX.soundtrack.currentTime = 0;
      SFX.soundtrack.play().catch(() => {});
    }, 1000);
    game.start();
  });

  // Initial render
  game.renderer.render(game);
})();
