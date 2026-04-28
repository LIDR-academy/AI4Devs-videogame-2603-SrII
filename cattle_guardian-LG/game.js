// ─── Cattle Guardian – game.js ───────────────────────────────────────────────
(() => {
  "use strict";

  // ══════════════════════════════════════════════════════════════════════════
  // Constants
  // ══════════════════════════════════════════════════════════════════════════
  const BASE_SPEED     = 2.5;          // pixels per frame at 60 fps
  const SHEPHERD_SPEED = BASE_SPEED;   // 1×
  const WOLF_SPEED     = BASE_SPEED * 0.75;
  const SHEEP_SPEED    = BASE_SPEED * 0.5;

  const SHEPHERD_SIZE  = 18;
  const SHEEP_RADIUS   = 10;
  const WOLF_SIZE      = 14;

  const WOLF_MOVE_STEPS   = 180; // frames between direction changes (~3 s)
  const NUM_SHEEP         = 5;
  const NUM_WOLVES        = 3;
  const BARN_X_RATIO      = 0.82; // barn line at 82 % of width
  const COLLISION_DIST    = 16;

  // Neon palette
  const COL_SHEPHERD = "#39ff14";
  const COL_SHEEP    = "#00bfff";
  const COL_WOLF     = "#ff2050";
  const COL_BARN     = "#ffe438";
  const COL_OBSTACLE = "#ff9900";
  const COL_BG       = "#0d0d1a";

  // ══════════════════════════════════════════════════════════════════════════
  // DOM refs
  // ══════════════════════════════════════════════════════════════════════════
  const canvas    = document.getElementById("gameCanvas");
  const ctx       = canvas.getContext("2d");
  const hud       = document.getElementById("score");
  const overlay   = document.getElementById("overlay");
  const oTitle    = document.getElementById("overlay-title");
  const oMsg      = document.getElementById("overlay-message");
  const startBtn  = document.getElementById("start-btn");

  // ══════════════════════════════════════════════════════════════════════════
  // Sound (Web Audio API) — tiny synth helpers
  // ══════════════════════════════════════════════════════════════════════════
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function playTone(freq, dur, type = "square", vol = 0.12) {
    try {
      ensureAudio();
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (_) { /* silent fail */ }
  }

  const sfx = {
    move:     () => playTone(220, 0.06, "sine", 0.06),
    obstacle: () => playTone(660, 0.12, "triangle", 0.15),
    saved:    () => { playTone(523, 0.15, "sine", 0.18); setTimeout(() => playTone(659, 0.15, "sine", 0.18), 120); },
    gameOver: () => { playTone(180, 0.4, "sawtooth", 0.2); setTimeout(() => playTone(120, 0.6, "sawtooth", 0.2), 300); },
    win:      () => { playTone(523, 0.12, "sine", 0.18); setTimeout(() => playTone(659, 0.12, "sine", 0.18), 100); setTimeout(() => playTone(784, 0.25, "sine", 0.2), 200); },
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Game state
  // ══════════════════════════════════════════════════════════════════════════
  let W, H, barnX;
  let shepherd = { x: 0, y: 0 };
  let sheep = [];
  let wolves = [];
  let obstacles = [];
  let score = 0;
  let running = false;
  let gameWon = false;
  let keys = {};
  let obstacleStart = null; // {x,y} or null — first click recorded

  // ══════════════════════════════════════════════════════════════════════════
  // Resize canvas to fit viewport
  // ══════════════════════════════════════════════════════════════════════════
  function resize() {
    const pad = 8;
    W = Math.min(window.innerWidth - pad, 1200);
    H = Math.min(window.innerHeight - pad, 720);
    canvas.width  = W;
    canvas.height = H;
    barnX = W * BARN_X_RATIO;
  }
  window.addEventListener("resize", resize);
  resize();

  // ══════════════════════════════════════════════════════════════════════════
  // Entity factories
  // ══════════════════════════════════════════════════════════════════════════
  function createShepherd() {
    return { x: 60, y: H / 2 };
  }

  function createSheep(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: 40 + Math.random() * (W * 0.25),
        y: 30 + Math.random() * (H - 60),
        saved: false,
      });
    }
    return arr;
  }

  function createWolves(count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() < 0.5 ? Math.PI / 4 : -Math.PI / 4;
      arr.push({
        x: W * 0.6 + Math.random() * (W * 0.25),
        y: 40 + Math.random() * (H - 80),
        angle,
        stepCount: 0,
      });
    }
    return arr;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Init / Reset
  // ══════════════════════════════════════════════════════════════════════════
  function init() {
    resize();
    shepherd = createShepherd();
    sheep    = createSheep(NUM_SHEEP);
    wolves   = createWolves(NUM_WOLVES);
    obstacles = [];
    obstacleStart = null;
    score    = 0;
    running  = true;
    gameWon  = false;
    hud.textContent = "Sheep Saved: 0";
    overlay.classList.add("hidden");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Input
  // ══════════════════════════════════════════════════════════════════════════
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  canvas.addEventListener("click", (e) => {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (!obstacleStart) {
      // First click — anchor at shepherd's current position
      obstacleStart = { x: shepherd.x, y: shepherd.y };
      sfx.obstacle();
    } else {
      // Second click — complete the obstacle from anchor to shepherd's current position
      obstacles.push({ x1: obstacleStart.x, y1: obstacleStart.y, x2: shepherd.x, y2: shepherd.y });
      obstacleStart = null;
      sfx.obstacle();
    }
  });

  // Touch support — treat single tap same as click
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    canvas.dispatchEvent(new MouseEvent("click", { clientX: t.clientX, clientY: t.clientY }));
  }, { passive: false });

  // ══════════════════════════════════════════════════════════════════════════
  // Geometry helpers
  // ══════════════════════════════════════════════════════════════════════════
  function dist(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
  }

  // Point–segment minimum distance (for obstacle collision)
  function pointSegDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return dist(px, py, x1, y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return dist(px, py, x1 + t * dx, y1 + t * dy);
  }

  // Does moving from (ox,oy) to (nx,ny) cross any obstacle? (for wolves)
  function blockedByObstacle(ox, oy, nx, ny) {
    for (const seg of obstacles) {
      if (segmentsIntersect(ox, oy, nx, ny, seg.x1, seg.y1, seg.x2, seg.y2)) return true;
    }
    return false;
  }

  // Segment–segment intersection test
  function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const d1 = cross(cx, cy, dx, dy, ax, ay);
    const d2 = cross(cx, cy, dx, dy, bx, by);
    const d3 = cross(ax, ay, bx, by, cx, cy);
    const d4 = cross(ax, ay, bx, by, dx, dy);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
    if (d1 === 0 && onSegment(cx, cy, dx, dy, ax, ay)) return true;
    if (d2 === 0 && onSegment(cx, cy, dx, dy, bx, by)) return true;
    if (d3 === 0 && onSegment(ax, ay, bx, by, cx, cy)) return true;
    if (d4 === 0 && onSegment(ax, ay, bx, by, dx, dy)) return true;
    return false;
  }

  function cross(ax, ay, bx, by, cx, cy) {
    return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  }

  function onSegment(px, py, qx, qy, rx, ry) {
    return Math.min(px, qx) <= rx && rx <= Math.max(px, qx) &&
           Math.min(py, qy) <= ry && ry <= Math.max(py, qy);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Update
  // ══════════════════════════════════════════════════════════════════════════
  function update() {
    if (!running) return;

    // ── Shepherd movement ──
    let dx = 0, dy = 0;
    if (keys["ArrowLeft"])  dx -= 1;
    if (keys["ArrowRight"]) dx += 1;
    if (keys["ArrowUp"])    dy -= 1;
    if (keys["ArrowDown"])  dy += 1;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      shepherd.x += (dx / len) * SHEPHERD_SPEED;
      shepherd.y += (dy / len) * SHEPHERD_SPEED;
      // Clamp
      shepherd.x = Math.max(SHEPHERD_SIZE, Math.min(W - SHEPHERD_SIZE, shepherd.x));
      shepherd.y = Math.max(SHEPHERD_SIZE, Math.min(H - SHEPHERD_SIZE, shepherd.y));
    }

    // ── Sheep movement (downward + push) ──
    for (const s of sheep) {
      if (s.saved) continue;
      // Move downward
      s.y += SHEEP_SPEED;

      // Wrap vertically
      if (s.y > H + SHEEP_RADIUS) s.y = -SHEEP_RADIUS;

      // Shepherd pushes sheep horizontally on contact
      const d = dist(shepherd.x, shepherd.y, s.x, s.y);
      if (d < SHEPHERD_SIZE + SHEEP_RADIUS) {
        const pushDir = s.x >= shepherd.x ? 1 : -1;
        s.x += pushDir * SHEPHERD_SPEED * 1.2;
        s.x = Math.max(SHEEP_RADIUS, Math.min(W - SHEEP_RADIUS, s.x));
      }

      // Check if sheep crosses barn line
      if (s.x >= barnX) {
        s.saved = true;
        score++;
        hud.textContent = `Sheep Saved: ${score}`;
        sfx.saved();
      }
    }

    // ── Wolves movement (45° angles, change after N steps) ──
    for (const w of wolves) {
      const vx = Math.cos(w.angle) * WOLF_SPEED;
      const vy = Math.sin(w.angle) * WOLF_SPEED;
      let nx = w.x + vx;
      let ny = w.y + vy;

      // Bounce off walls
      if (nx < WOLF_SIZE || nx > W - WOLF_SIZE) {
        w.angle = Math.PI - w.angle;
        nx = w.x + Math.cos(w.angle) * WOLF_SPEED;
      }
      if (ny < WOLF_SIZE || ny > H - WOLF_SIZE) {
        w.angle = -w.angle;
        ny = w.y + Math.sin(w.angle) * WOLF_SPEED;
      }

      // Obstacle collision — reverse
      if (blockedByObstacle(w.x, w.y, nx, ny)) {
        w.angle += Math.PI; // bounce back
        nx = w.x + Math.cos(w.angle) * WOLF_SPEED;
        ny = w.y + Math.sin(w.angle) * WOLF_SPEED;
      }

      w.x = nx;
      w.y = ny;
      w.stepCount++;

      // Change direction after WOLF_MOVE_STEPS
      if (w.stepCount >= WOLF_MOVE_STEPS) {
        w.stepCount = 0;
        // Switch between 45° and 135° (or their negatives)
        if (Math.abs(Math.cos(w.angle)) > 0.5) {
          // Currently ~45° family → flip horizontal component
          w.angle = Math.PI - w.angle;
        } else {
          w.angle = -w.angle;
        }
      }
    }

    // ── Collision: wolf ↔ sheep ──
    for (const w of wolves) {
      for (const s of sheep) {
        if (s.saved) continue;
        if (dist(w.x, w.y, s.x, s.y) < WOLF_SIZE + SHEEP_RADIUS) {
          endGame(false);
          return;
        }
      }
      // wolf ↔ shepherd
      if (dist(w.x, w.y, shepherd.x, shepherd.y) < WOLF_SIZE + SHEPHERD_SIZE * 0.6) {
        endGame(false);
        return;
      }
    }

    // ── Win condition: all sheep saved ──
    if (sheep.every((s) => s.saved)) {
      endGame(true);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // End game
  // ══════════════════════════════════════════════════════════════════════════
  function endGame(won) {
    running = false;
    gameWon = won;
    if (won) {
      sfx.win();
      oTitle.textContent = "You Win!";
      oMsg.innerHTML = `All sheep are safe!<br>Score: ${score}`;
    } else {
      sfx.gameOver();
      oTitle.textContent = "Game Over";
      oMsg.innerHTML = `A wolf got through!<br>Sheep saved: ${score}`;
    }
    startBtn.textContent = "Play Again";
    overlay.classList.remove("hidden");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Draw helpers
  // ══════════════════════════════════════════════════════════════════════════
  function glow(color, blur) {
    ctx.shadowColor = color;
    ctx.shadowBlur  = blur;
  }
  function noGlow() {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur  = 0;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // ── Background ──
    ctx.fillStyle = COL_BG;
    ctx.fillRect(0, 0, W, H);

    // ── Barn (dotted line) ──
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = COL_BARN;
    ctx.lineWidth = 3;
    glow(COL_BARN, 14);
    ctx.beginPath();
    ctx.moveTo(barnX, 0);
    ctx.lineTo(barnX, H);
    ctx.stroke();
    noGlow();
    ctx.setLineDash([]);
    // Barn label
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = COL_BARN;
    glow(COL_BARN, 10);
    ctx.fillText("BARN →", barnX + 8, 22);
    noGlow();
    ctx.restore();

    // ── Obstacles ──
    ctx.lineWidth = 3;
    ctx.strokeStyle = COL_OBSTACLE;
    glow(COL_OBSTACLE, 10);
    for (const o of obstacles) {
      ctx.beginPath();
      ctx.moveTo(o.x1, o.y1);
      ctx.lineTo(o.x2, o.y2);
      ctx.stroke();
    }
    // In-progress obstacle preview
    if (obstacleStart) {
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(obstacleStart.x, obstacleStart.y);
      ctx.lineTo(shepherd.x, shepherd.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    noGlow();

    // ── Sheep (circles) ──
    for (const s of sheep) {
      if (s.saved) continue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, SHEEP_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = COL_SHEEP;
      glow(COL_SHEEP, 12);
      ctx.fill();
      noGlow();
      // Face detail
      ctx.fillStyle = "#0d0d1a";
      ctx.beginPath();
      ctx.arc(s.x - 3, s.y - 2, 2, 0, Math.PI * 2);
      ctx.arc(s.x + 3, s.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Wolves (X shapes) ──
    ctx.lineWidth = 3;
    ctx.strokeStyle = COL_WOLF;
    ctx.lineCap = "round";
    glow(COL_WOLF, 14);
    for (const w of wolves) {
      const s = WOLF_SIZE;
      ctx.beginPath();
      ctx.moveTo(w.x - s, w.y - s);
      ctx.lineTo(w.x + s, w.y + s);
      ctx.moveTo(w.x + s, w.y - s);
      ctx.lineTo(w.x - s, w.y + s);
      ctx.stroke();
    }
    noGlow();

    // ── Shepherd (+ symbol) ──
    ctx.lineWidth = 4;
    ctx.strokeStyle = COL_SHEPHERD;
    ctx.lineCap = "round";
    glow(COL_SHEPHERD, 16);
    const sz = SHEPHERD_SIZE;
    ctx.beginPath();
    ctx.moveTo(shepherd.x - sz, shepherd.y);
    ctx.lineTo(shepherd.x + sz, shepherd.y);
    ctx.moveTo(shepherd.x, shepherd.y - sz);
    ctx.lineTo(shepherd.x, shepherd.y + sz);
    ctx.stroke();
    noGlow();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Game loop
  // ══════════════════════════════════════════════════════════════════════════
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Start button
  // ══════════════════════════════════════════════════════════════════════════
  startBtn.addEventListener("click", () => {
    ensureAudio();
    init();
    // loop is always running; init just resets state
  });

  // Show start screen then begin render loop
  overlay.classList.remove("hidden");
  oTitle.textContent = "Cattle Guardian";
  oMsg.innerHTML = "Protect the sheep from wolves!<br>Arrow keys to move · Click to place obstacles";
  startBtn.textContent = "Start Game";

  // Kick off the render loop (game paused until Start is clicked)
  running = false;
  loop();
})();
