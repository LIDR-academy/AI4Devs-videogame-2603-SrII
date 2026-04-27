(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });

  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const levelEl = document.getElementById("level");
  const buffsEl = document.getElementById("buffs");

  const overlayEl = document.getElementById("overlay");
  const overlayTitleEl = document.getElementById("overlayTitle");
  const overlayTextEl = document.getElementById("overlayText");
  const overlayHintEl = document.getElementById("overlayHint");
  const startBtn = document.getElementById("startBtn");
  const howBtn = document.getElementById("howBtn");
  const toastEl = document.getElementById("toast");
  const soundToggle = document.getElementById("soundToggle");

  const W = canvas.width;
  const H = canvas.height;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const now = () => performance.now();

  const KEYS = {
    Left: ["ArrowLeft", "KeyA"],
    Right: ["ArrowRight", "KeyD"],
    Fire: ["Space"],
    Confirm: ["Enter"],
  };

  function keyMatches(e, list) {
    return list.includes(e.code);
  }

  const input = {
    left: false,
    right: false,
    fire: false,
  };

  const state = {
    mode: "menu", // menu | playing | gameover
    score: 0,
    lives: 3,
    level: 1,
    time: 0,
    difficulty: 1,
    lastShotMs: 0,
    shotCooldownMs: 160,
    invulnMs: 0,
    spawnAcc: 0,
    spawnBase: 0.9,
    spawnJitter: 0.35,
    nextSpawn: 0.9,
    toastUntil: 0,
    rapidUntil: 0,
    spreadUntil: 0,
    shieldCharges: 0,
    powerupSpawnAcc: 0,
    nextPowerupIn: 12,
  };

  const player = {
    x: W * 0.5,
    y: H - 110,
    w: 46,
    h: 56,
    speed: 520,
  };

  const bullets = [];
  const enemies = [];
  const particles = [];
  const powerups = [];

  const ENEMY_PALETTES = [
    { r: 255, g: 93, b: 116, hue: 350 },
    { r: 93, g: 220, b: 255, hue: 198 },
    { r: 120, g: 255, b: 140, hue: 128 },
    { r: 182, g: 140, b: 255, hue: 265 },
    { r: 255, g: 200, b: 90, hue: 38 },
    { r: 255, g: 120, b: 220, hue: 310 },
  ];

  const POWER_KINDS = ["rapid", "spread", "shield", "life"];

  const sound = (() => {
    const STORAGE_KEY = "space-defender-muted";
    let ctx = null;
    let master = null;
    let muted = false;
    try {
      muted = localStorage.getItem(STORAGE_KEY) === "1";
    } catch (_) {
      /* ignore */
    }

    function ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC || ctx) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.11;
      master.connect(ctx.destination);
    }

    function resume() {
      ensure();
      if (ctx && ctx.state === "suspended") void ctx.resume();
    }

    function setMuted(on) {
      muted = !!on;
      ensure();
      if (master) master.gain.value = muted ? 0 : 0.11;
      try {
        localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
      } catch (_) {
        /* ignore */
      }
    }

    function getMuted() {
      return muted;
    }

    function tone({ freq, dur, type = "square", freqEnd = null, vol = 0.35 }) {
      if (!ctx || !master || muted) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (freqEnd != null)
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    return {
      resume,
      setMuted,
      getMuted,
      shoot() {
        tone({ freq: 880, dur: 0.045, type: "square", freqEnd: 420, vol: 0.22 });
      },
      hit() {
        tone({ freq: 220, dur: 0.05, type: "triangle", freqEnd: 90, vol: 0.2 });
      },
      kill() {
        tone({ freq: 180, dur: 0.12, type: "sawtooth", freqEnd: 45, vol: 0.18 });
      },
      powerup() {
        if (!ctx || !master || muted) return;
        const t0 = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((f, i) => {
          const start = t0 + i * 0.055;
          const dur = 0.075;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(f, start);
          g.gain.setValueAtTime(0.0001, start);
          g.gain.exponentialRampToValueAtTime(0.14 - i * 0.025, start + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
          osc.connect(g);
          g.connect(master);
          osc.start(start);
          osc.stop(start + dur + 0.02);
        });
      },
      hurt() {
        tone({ freq: 95, dur: 0.18, type: "sawtooth", freqEnd: 40, vol: 0.28 });
      },
      warn() {
        tone({ freq: 140, dur: 0.14, type: "triangle", freqEnd: 80, vol: 0.2 });
      },
      shieldBreak() {
        tone({ freq: 660, dur: 0.1, type: "sine", freqEnd: 200, vol: 0.24 });
      },
      gameover() {
        tone({ freq: 110, dur: 0.35, type: "triangle", freqEnd: 55, vol: 0.22 });
      },
    };
  })();

  const stars = (() => {
    const layer = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      layer.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: rand(0.6, 1.9),
        s: rand(18, 85),
        a: rand(0.25, 0.85),
        tw: rand(0.6, 1.3),
        ph: Math.random() * Math.PI * 2,
      });
    }
    return layer;
  })();

  function updateBuffsHud() {
    if (!buffsEl) return;
    const t = now();
    const parts = [];
    if (t < state.rapidUntil) parts.push("Ráfaga");
    if (t < state.spreadUntil) parts.push("Triple");
    if (state.shieldCharges > 0) parts.push(`Escudo×${state.shieldCharges}`);
    buffsEl.textContent = parts.length ? parts.join(" · ") : "—";
  }

  function setHud() {
    scoreEl.textContent = String(state.score);
    livesEl.textContent = String(state.lives);
    levelEl.textContent = String(state.level);
    updateBuffsHud();
  }

  function setOverlay(visible, title, text, hint) {
    if (!visible) {
      overlayEl.hidden = true;
      return;
    }
    overlayEl.hidden = false;
    overlayTitleEl.textContent = title;
    overlayTextEl.textContent = text;
    overlayHintEl.textContent = hint ?? "";
  }

  function showToast(message, ms = 1600) {
    toastEl.hidden = false;
    toastEl.textContent = message;
    state.toastUntil = now() + ms;
  }

  function hideToastIfNeeded() {
    if (!toastEl.hidden && now() > state.toastUntil) toastEl.hidden = true;
  }

  function resetGame() {
    state.mode = "playing";
    state.score = 0;
    state.lives = 3;
    state.level = 1;
    state.time = 0;
    state.difficulty = 1;
    state.lastShotMs = 0;
    state.invulnMs = 0;
    state.spawnAcc = 0;
    state.nextSpawn = state.spawnBase;
    state.rapidUntil = 0;
    state.spreadUntil = 0;
    state.shieldCharges = 0;
    state.powerupSpawnAcc = 0;
    state.nextPowerupIn = rand(9, 15);

    player.x = W * 0.5;
    player.y = H - 110;

    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    powerups.length = 0;

    sound.resume();
    setHud();
    setOverlay(false);
    showToast("¡A jugar!", 900);
  }

  function goMenu() {
    state.mode = "menu";
    setHud();
    if (buffsEl) buffsEl.textContent = "—";
    setOverlay(
      true,
      "Space Defender",
      "Flechas para moverte • Espacio para disparar • Enter para iniciar o reiniciar",
      "Destruye enemigos, recoge power-ups (rombos) y sobrevive."
    );
  }

  function gameOver() {
    state.mode = "gameover";
    state.rapidUntil = 0;
    state.spreadUntil = 0;
    state.shieldCharges = 0;
    updateBuffsHud();
    sound.gameover();
    setOverlay(
      true,
      "Game Over",
      `Puntaje final: ${state.score}. Presiona Enter para reiniciar.`,
      "Tip: dispara en ráfagas cortas y prioriza los enemigos cercanos."
    );
    showToast("Enter para reiniciar", 1800);
  }

  function spawnBullet(angle = 0) {
    bullets.push({
      x: player.x + Math.sin(angle) * 10,
      y: player.y - player.h * 0.55,
      vy: Math.cos(angle) * -920,
      vx: Math.sin(angle) * 520,
      r: 3.2,
      alive: true,
    });
  }

  function spawnPowerup(atX, atY) {
    const kind = POWER_KINDS[Math.floor(Math.random() * POWER_KINDS.length)];
    const fromSky = atY === undefined;
    powerups.push({
      x: atX ?? rand(45, W - 45),
      y: fromSky ? -32 : atY,
      vy: fromSky ? rand(105, 158) : rand(48, 88),
      r: 15,
      kind,
      rot: rand(0, Math.PI * 2),
      alive: true,
    });
  }

  function applyPowerup(kind) {
    const t = now();
    if (kind === "rapid") {
      state.rapidUntil = t + 7000;
      showToast("Ráfaga rápida", 900);
    } else if (kind === "spread") {
      state.spreadUntil = t + 8500;
      showToast("Disparo triple", 900);
    } else if (kind === "shield") {
      state.shieldCharges = Math.min(2, state.shieldCharges + 1);
      showToast("Escudo orbital", 900);
    } else if (kind === "life") {
      state.lives = Math.min(5, state.lives + 1);
      setHud();
      showToast("Vida extra", 900);
      return;
    }
    updateBuffsHud();
  }

  function spawnEnemy() {
    const size = rand(26, 46);
    const pal = ENEMY_PALETTES[Math.floor(Math.random() * ENEMY_PALETTES.length)];
    const speed = rand(130, 210) * (0.85 + state.difficulty * 0.12);
    const drift = rand(-55, 55) * (0.5 + state.difficulty * 0.08);
    enemies.push({
      x: rand(26, W - 26),
      y: -size - 8,
      r: size * 0.55,
      vy: speed,
      vx: drift,
      hp: size > 40 ? 2 : 1,
      rgb: { r: pal.r, g: pal.g, b: pal.b },
      hue: pal.hue,
      alive: true,
    });
  }

  function spawnExplosion(x, y, hue = 190) {
    const n = Math.floor(rand(12, 22));
    for (let i = 0; i < n; i++) {
      const sp = rand(80, 360);
      const ang = rand(0, Math.PI * 2);
      particles.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: rand(1.2, 3.2),
        a: 1,
        hue: hue + rand(-20, 20),
        life: rand(0.35, 0.65),
      });
    }
  }

  function circleHit(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const rr = ar + br;
    return dx * dx + dy * dy <= rr * rr;
  }

  function playerCircle() {
    return { x: player.x, y: player.y - 6, r: 20 };
  }

  function updateDifficulty() {
    const targetLevel = 1 + Math.floor(state.score / 350);
    if (targetLevel !== state.level) {
      state.level = targetLevel;
      showToast(`Nivel ${state.level}`, 1200);
    }
    state.difficulty = 1 + (state.level - 1) * 0.22;
  }

  function update(dt) {
    state.time += dt;
    hideToastIfNeeded();

    for (const st of stars) {
      st.y += st.s * dt;
      if (st.y > H + 6) {
        st.y = -6;
        st.x = Math.random() * W;
      }
      st.ph += st.tw * dt;
    }

    if (state.mode !== "playing") return;

    updateDifficulty();

    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    player.x = clamp(player.x + dir * player.speed * dt, 26, W - 26);

    state.invulnMs = Math.max(0, state.invulnMs - dt * 1000);

    if (input.fire) {
      const t = now();
      const cd = t < state.rapidUntil ? 84 : state.shotCooldownMs;
      if (t - state.lastShotMs >= cd) {
        state.lastShotMs = t;
        sound.shoot();
        if (t < state.spreadUntil) {
          spawnBullet(-0.33);
          spawnBullet(0);
          spawnBullet(0.33);
        } else {
          spawnBullet(0);
        }
      }
    }

    state.powerupSpawnAcc += dt;
    if (state.powerupSpawnAcc >= state.nextPowerupIn) {
      state.powerupSpawnAcc = 0;
      state.nextPowerupIn = rand(8, 16);
      spawnPowerup();
    }

    state.spawnAcc += dt;
    if (state.spawnAcc >= state.nextSpawn) {
      state.spawnAcc = 0;
      spawnEnemy();
      const base = Math.max(0.24, state.spawnBase - 0.07 * (state.level - 1));
      state.nextSpawn = clamp(base + rand(-state.spawnJitter, state.spawnJitter), 0.22, 1.15);
    }

    for (const b of bullets) {
      if (!b.alive) continue;
      b.y += b.vy * dt;
      b.x += (b.vx || 0) * dt;
      if (b.y < -20) b.alive = false;
    }

    for (const e of enemies) {
      if (!e.alive) continue;
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      if (e.x < 18 || e.x > W - 18) e.vx *= -1;

      if (e.y - e.r > H + 20) {
        e.alive = false;
        state.lives -= 1;
        setHud();
        spawnExplosion(clamp(e.x, 12, W - 12), H - 20, 25);
        sound.warn();
        showToast("¡Se coló uno!", 900);
        if (state.lives <= 0) gameOver();
      }
    }

    const p = playerCircle();

    for (const e of enemies) {
      if (!e.alive) continue;

      for (const b of bullets) {
        if (!b.alive) continue;
        if (circleHit(b.x, b.y, b.r + 1.2, e.x, e.y, e.r)) {
          b.alive = false;
          e.hp -= 1;
          spawnExplosion(b.x, b.y, e.hue);
          if (e.hp <= 0) {
            e.alive = false;
            sound.kill();
            spawnExplosion(e.x, e.y, e.hue);
            state.score += 20 + Math.floor(e.r);
            setHud();
            if (Math.random() < 0.065) spawnPowerup(e.x, e.y + e.r * 0.5);
          } else {
            sound.hit();
          }
        }
      }

      if (state.invulnMs <= 0 && circleHit(p.x, p.y, p.r, e.x, e.y, e.r * 0.92)) {
        e.alive = false;
        spawnExplosion(e.x, e.y, e.hue);
        if (state.shieldCharges > 0) {
          state.shieldCharges -= 1;
          sound.shieldBreak();
          state.invulnMs = 450;
          showToast("Escudo absorbió el impacto", 900);
          updateBuffsHud();
        } else {
          spawnExplosion(p.x, p.y, 355);
          sound.hurt();
          state.lives -= 1;
          state.invulnMs = 900;
          setHud();
          showToast("¡Te golpearon!", 900);
          if (state.lives <= 0) gameOver();
        }
      }
    }

    for (const pu of powerups) {
      if (!pu.alive) continue;
      pu.y += pu.vy * dt;
      pu.rot += dt * 2.2;
      if (pu.y > H + 50) pu.alive = false;
      if (circleHit(p.x, p.y, p.r + 8, pu.x, pu.y, pu.r)) {
        pu.alive = false;
        sound.powerup();
        applyPowerup(pu.kind);
      }
    }

    for (const pr of particles) {
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.vy += 380 * dt;
      pr.a -= dt / pr.life;
    }

    for (let i = bullets.length - 1; i >= 0; i--) if (!bullets[i].alive) bullets.splice(i, 1);
    for (let i = enemies.length - 1; i >= 0; i--) if (!enemies[i].alive) enemies.splice(i, 1);
    for (let i = powerups.length - 1; i >= 0; i--) if (!powerups[i].alive) powerups.splice(i, 1);
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].a <= 0) particles.splice(i, 1);

    updateBuffsHud();
  }

  function drawStars() {
    ctx.fillStyle = "#070814";
    ctx.fillRect(0, 0, W, H);

    for (const st of stars) {
      const tw = 0.65 + 0.35 * Math.sin(st.ph);
      const a = st.a * tw;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const g = ctx.createRadialGradient(W * 0.5, H * 0.15, 20, W * 0.5, H * 0.15, H * 0.95);
    g.addColorStop(0, "rgba(124,247,255,0.09)");
    g.addColorStop(0.45, "rgba(182,140,255,0.05)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawPlayer() {
    const px = player.x;
    const py = player.y;

    const flame = 6 + 4 * Math.sin(state.time * 9);
    ctx.save();
    ctx.translate(px, py);

    ctx.globalAlpha = state.invulnMs > 0 ? 0.55 + 0.35 * Math.sin(state.time * 28) : 1;

    if (state.shieldCharges > 0 && state.mode === "playing") {
      const pulse = 0.38 + 0.22 * Math.sin(state.time * 5.5);
      ctx.strokeStyle = `rgba(124,247,255,${pulse})`;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(0, -6, 30 + state.shieldCharges * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "rgba(124,247,255,0.10)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,180,84,0.85)";
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(-8, 26 + flame);
    ctx.lineTo(8, 26 + flame);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(182,140,255,0.92)";
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(-22, 22);
    ctx.lineTo(22, 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-10, 16);
    ctx.lineTo(10, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(124,247,255,0.95)";
    ctx.beginPath();
    ctx.arc(0, -5, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawBullets() {
    for (const b of bullets) {
      ctx.fillStyle = "rgba(124,247,255,0.95)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(124,247,255,0.25)";
      ctx.beginPath();
      ctx.arc(b.x, b.y + 9, b.r * 1.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawEnemies() {
    for (const e of enemies) {
      const { r, g, b } = e.rgb;
      const core = ctx.createRadialGradient(e.x - e.r * 0.3, e.y - e.r * 0.3, 2, e.x, e.y, e.r);
      core.addColorStop(0, "rgba(255,255,255,0.9)");
      core.addColorStop(0.28, `rgba(${r},${g},${b},0.82)`);
      core.addColorStop(1, `rgba(${r},${g},${b},0.2)`);
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * 0.72, 0, Math.PI * 2);
      ctx.stroke();

      if (e.hp > 1) {
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 0.52, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function powerupStyle(kind) {
    switch (kind) {
      case "rapid":
        return { fill: "rgba(255,180,84,0.92)", glow: "rgba(255,200,120,0.35)" };
      case "spread":
        return { fill: "rgba(93,220,255,0.92)", glow: "rgba(120,240,255,0.3)" };
      case "shield":
        return { fill: "rgba(160,140,255,0.92)", glow: "rgba(182,160,255,0.32)" };
      case "life":
        return { fill: "rgba(255,110,150,0.92)", glow: "rgba(255,140,170,0.3)" };
      default:
        return { fill: "rgba(200,200,220,0.9)", glow: "rgba(255,255,255,0.2)" };
    }
  }

  function drawPowerups() {
    for (const pu of powerups) {
      if (!pu.alive) continue;
      const st = powerupStyle(pu.kind);
      ctx.save();
      ctx.translate(pu.x, pu.y);
      ctx.rotate(pu.rot);
      ctx.fillStyle = st.glow;
      ctx.beginPath();
      ctx.moveTo(0, -pu.r * 1.15);
      ctx.lineTo(pu.r * 1.05, 0);
      ctx.lineTo(0, pu.r * 1.15);
      ctx.lineTo(-pu.r * 1.05, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = st.fill;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -pu.r);
      ctx.lineTo(pu.r * 0.92, 0);
      ctx.lineTo(0, pu.r);
      ctx.lineTo(-pu.r * 0.92, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const a = clamp(p.a, 0, 1);
      ctx.fillStyle = `hsla(${p.hue}, 95%, 60%, ${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    drawStars();

    if (state.mode === "playing") {
      drawBullets();
      drawEnemies();
      drawPowerups();
      drawParticles();
      drawPlayer();
    } else {
      drawBullets();
      drawEnemies();
      drawPowerups();
      drawParticles();
      drawPlayer();

      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  let last = now();
  function frame() {
    const t = now();
    const dt = clamp((t - last) / 1000, 0, 0.034);
    last = t;

    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function toggleHowTo() {
    if (state.mode === "playing") return;
    const isHow = overlayTitleEl.textContent === "Cómo jugar";
    if (isHow) {
      goMenu();
      return;
    }
    setOverlay(
      true,
      "Cómo jugar",
      "Objetivo: destruye enemigos antes de que te golpeen o crucen la pantalla.\n\nPower-ups (rombos): ráfaga, disparo triple, escudo y vida extra.\n\nControles:\n- Flecha izquierda/derecha: mover\n- Espacio: disparar\n- Enter: iniciar o reiniciar",
      "Los enemigos vienen en varios colores. Recoge los rombos que caen."
    );
  }

  function onConfirm() {
    if (state.mode === "playing") return;
    resetGame();
  }

  window.addEventListener("keydown", (e) => {
    if (keyMatches(e, KEYS.Left)) input.left = true;
    if (keyMatches(e, KEYS.Right)) input.right = true;
    if (keyMatches(e, KEYS.Fire)) input.fire = true;
    if (keyMatches(e, KEYS.Confirm)) {
      e.preventDefault();
      onConfirm();
    }
    if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  });

  window.addEventListener("keyup", (e) => {
    if (keyMatches(e, KEYS.Left)) input.left = false;
    if (keyMatches(e, KEYS.Right)) input.right = false;
    if (keyMatches(e, KEYS.Fire)) input.fire = false;
  });

  function syncSoundToggleUi() {
    if (!soundToggle) return;
    const m = sound.getMuted();
    soundToggle.setAttribute("aria-pressed", m ? "true" : "false");
    soundToggle.setAttribute("aria-label", m ? "Activar sonido" : "Silenciar sonido");
    soundToggle.title = m ? "Sonido desactivado" : "Sonido activado";
    soundToggle.classList.toggle("sound-toggle--muted", m);
    const ico = soundToggle.querySelector(".sound-toggle__ico");
    if (ico) ico.textContent = m ? "🔇" : "🔊";
  }

  startBtn.addEventListener("click", () => onConfirm());
  howBtn.addEventListener("click", () => toggleHowTo());

  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      sound.setMuted(!sound.getMuted());
      sound.resume();
      syncSoundToggleUi();
    });
    syncSoundToggleUi();
  }
  overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) toggleHowTo();
  });

  setHud();
  goMenu();
  requestAnimationFrame(frame);
})();
