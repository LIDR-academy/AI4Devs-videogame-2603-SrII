(function () {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const floorHud = document.getElementById("floorHud");
  const coinHud = document.getElementById("coinHud");
  const diffHud = document.getElementById("diffHud");
  const stateHud = document.getElementById("stateHud");
  const restartBtn = document.getElementById("restart");
  const difficultyPick = document.getElementById("difficultyPick");

  const W = canvas.width;
  const H = canvas.height;
  const WALL_PAD = 28;
  const INNER_LEFT = WALL_PAD;
  const INNER_RIGHT = W - WALL_PAD;
  const NUM_PLATFORMS = 100;
  const PLATFORM_GAP = 90;
  const BASE_WORLD_Y = 9000;
  const FORCED_SCROLL = 0.38;
  const CAMERA_LERP = 0.14;

  const GRAVITY = 0.42;
  const MAX_RUN = 4.85;
  const RUN_ACCEL = 0.36;
  const AIR_ACCEL = 0.22;
  const GROUND_FRICTION = 0.84;
  const AIR_FRICTION = 0.988;
  /** Standing jump must clear one PLATFORM_GAP (tuned for discrete vy += GRAVITY). */
  const JUMP_STAND = 9.32;
  const JUMP_RUN_MULT = 0.9;
  const JUMP_RUN_MAX_EXTRA = 6.2;
  const JUMP_VY_HARD_CAP = 14.9;
  const COYOTE_MS = 90;
  const JUMP_BUFFER_MS = 120;

  const WALL_COMBO_MULT = 1.18;
  const WALL_MIN_COMBO_SPEED = 3.2;
  const WALL_ELASTIC = 0.15;

  let crumbleMs = 5000;
  let crumbleShakeLeadMs = 900;
  const PLAYER_W = 20;
  const PLAYER_H = 34;
  const PASS_PLATFORM_X_PAD = 4;
  const VOID_DEATH_FRAMES = 18;
  /** Horizontal forgiveness: next floor is often offset; still “reachable” while falling. */
  const VOID_DETECT_HALF_WIDTH = 96;
  /** Max distance (world y) platform top may sit above feet and still count as landable while falling. */
  const VOID_LANDING_TOP_ABOVE_FEET = 30;
  const FALL_SCAN_BELOW = 5200;

  const MIN_COINS_FOR_ESCAPE = 20;
  const COIN_MAX_IN_GAME = 25;
  const COIN_HIT_RX = 16;
  const COIN_HIT_RY = 18;

  let platforms = [];
  let coins = [];
  let player = {};
  let cameraTop = 0;
  let keys = {};
  let preWallVx = 0;
  let grounded = false;
  let coyoteUntil = 0;
  let jumpBufferedUntil = 0;
  let highestFloor = 0;
  let gameOver = false;
  let victory = false;
  let lastTs = 0;
  let raf = 0;
  let knightFacing = 1;
  let voidBelowFrames = 0;
  let coinCount = 0;
  let rejectedAtTop = false;
  let gameStarted = false;

  const RAPUNZEL_HEAD_Y = 298;
  const HAIR_ANCHOR_X = W * 0.5 + 2;
  const TOWER_TOP_Y = 120;

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function setCrumbleTiming(ms) {
    crumbleMs = ms;
    crumbleShakeLeadMs = Math.min(900, Math.max(160, crumbleMs * 0.38));
  }

  function buildPlatforms() {
    const list = [];
    for (let i = 0; i < NUM_PLATFORMS; i++) {
      const pw = rand(110, 168);
      const px = rand(INNER_LEFT + 8, INNER_RIGHT - pw - 8);
      const py = BASE_WORLD_Y - i * PLATFORM_GAP;
      list.push({
        i,
        x: px,
        y: py,
        w: pw,
        h: 14,
        solid: true,
        steppedAt: null,
        fallVy: 0,
      });
    }
    return list;
  }

  function buildCoins(platforms) {
    const count =
      MIN_COINS_FOR_ESCAPE +
      ((Math.random() * (COIN_MAX_IN_GAME - MIN_COINS_FOR_ESCAPE + 1)) | 0);
    const indices = [];
    for (let i = 1; i < NUM_PLATFORMS - 1; i++) {
      indices.push(i);
    }
    for (let k = indices.length - 1; k > 0; k--) {
      const j = (Math.random() * (k + 1)) | 0;
      const t = indices[k];
      indices[k] = indices[j];
      indices[j] = t;
    }
    const out = [];
    for (let n = 0; n < count; n++) {
      out.push({
        platI: indices[n],
        collected: false,
        phase: rand(0, Math.PI * 2),
      });
    }
    return out;
  }

  function tryCollectCoins() {
    const pcx = player.x + PLAYER_W * 0.5;
    const pcy = player.y + PLAYER_H * 0.5;
    for (const c of coins) {
      if (c.collected) continue;
      const p = platforms[c.platI];
      if (!p) continue;
      const cx = p.x + p.w * 0.5;
      const cy = p.y - 20;
      if (Math.abs(cx - pcx) < COIN_HIT_RX && Math.abs(cy - pcy) < COIN_HIT_RY) {
        c.collected = true;
        coinCount += 1;
      }
    }
  }

  function reset() {
    platforms = buildPlatforms();
    coins = buildCoins(platforms);
    const p0 = platforms[0];
    player = {
      x: p0.x + p0.w / 2 - PLAYER_W / 2,
      y: p0.y - PLAYER_H,
      vx: 0,
      vy: 0,
      onPlatformIndex: 0,
    };
    cameraTop = player.y - H * 0.48;
    grounded = true;
    coyoteUntil = 0;
    jumpBufferedUntil = 0;
    highestFloor = 1;
    voidBelowFrames = 0;
    coinCount = 0;
    rejectedAtTop = false;
    gameStarted = true;
    gameOver = false;
    victory = false;
    preWallVx = 0;
    knightFacing = 1;
    stateHud.textContent = "20 coins, then the princess";
    coinHud.textContent = `Coins: 0 / ${MIN_COINS_FOR_ESCAPE}`;
    restartBtn.hidden = true;
    lastTs = 0;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function resolveHorizontalWall() {
    const px = player.x;
    preWallVx = player.vx;

    if (px < INNER_LEFT) {
      player.x = INNER_LEFT;
      const wantRight = keys.ArrowRight || keys.KeyD;
      if (wantRight && Math.abs(preWallVx) > 0.05) {
        const mag = Math.max(Math.abs(preWallVx) * WALL_COMBO_MULT, WALL_MIN_COMBO_SPEED);
        player.vx = Math.min(MAX_RUN, mag);
      } else {
        player.vx = Math.abs(player.vx) * WALL_ELASTIC;
      }
    } else if (px + PLAYER_W > INNER_RIGHT) {
      player.x = INNER_RIGHT - PLAYER_W;
      const wantLeft = keys.ArrowLeft || keys.KeyA;
      if (wantLeft && Math.abs(preWallVx) > 0.05) {
        const mag = Math.max(Math.abs(preWallVx) * WALL_COMBO_MULT, WALL_MIN_COMBO_SPEED);
        player.vx = -Math.min(MAX_RUN, mag);
      } else {
        player.vx = -Math.abs(player.vx) * WALL_ELASTIC;
      }
    }
  }

  function tryJump(now) {
    const canJump = now <= coyoteUntil || grounded;
    if (jumpBufferedUntil > now && canJump) {
      const speed = Math.min(MAX_RUN, Math.abs(player.vx));
      let j = JUMP_STAND + Math.min(JUMP_RUN_MAX_EXTRA, speed * JUMP_RUN_MULT);
      if (j > JUMP_VY_HARD_CAP) j = JUMP_VY_HARD_CAP;
      player.vy = -j;
      grounded = false;
      jumpBufferedUntil = 0;
      coyoteUntil = 0;
    }
  }

  function platformCollideVertical() {
    if (player.vy < 0) return;

    const px = player.x;
    const py = player.y;
    const nextY = py + player.vy;
    const feet = nextY + PLAYER_H;
    const prevFeet = py + PLAYER_H;

    let landed = false;
    let bestPlat = null;
    let bestTop = -1e9;

    for (const plat of platforms) {
      if (!plat.solid) continue;
      const top = plat.y;
      const withinX = px + PLAYER_W > plat.x + 2 && px + 2 < plat.x + plat.w;
      if (!withinX) continue;
      if (prevFeet <= top + 1 && feet >= top - 2 && feet <= top + plat.h + 6) {
        if (top > bestTop) {
          bestTop = top;
          bestPlat = plat;
        }
      }
    }

    if (bestPlat) {
      player.y = bestPlat.y - PLAYER_H;
      player.vy = 0;
      grounded = true;
      landed = true;
      player.onPlatformIndex = bestPlat.i;
      if (bestPlat.steppedAt == null) {
        bestPlat.steppedAt = performance.now();
      }
      if (bestPlat.i + 1 > highestFloor) highestFloor = bestPlat.i + 1;
    }

    if (!landed) grounded = false;
  }

  function markPlatformsLeftBelow(now) {
    const idx = player.onPlatformIndex;
    const pxL = player.x + PASS_PLATFORM_X_PAD;
    const pxR = player.x + PLAYER_W - PASS_PLATFORM_X_PAD;
    for (const plat of platforms) {
      if (!plat.solid || plat.steppedAt != null) continue;
      if (plat.i >= idx) continue;
      const ox = pxR > plat.x + 3 && pxL < plat.x + plat.w - 3;
      if (!ox) continue;
      plat.steppedAt = now;
    }
  }

  function hasSolidPlatformBelowFeet() {
    const footY = player.y + PLAYER_H;
    const cx = player.x + PLAYER_W * 0.5;
    const pxL = cx - VOID_DETECT_HALF_WIDTH;
    const pxR = cx + VOID_DETECT_HALF_WIDTH;
    const topMin = footY - VOID_LANDING_TOP_ABOVE_FEET;
    const topMax = footY + FALL_SCAN_BELOW;
    for (const plat of platforms) {
      if (!plat.solid) continue;
      if (plat.x + plat.w <= pxL || plat.x >= pxR) continue;
      const top = plat.y;
      if (top >= topMin && top < topMax) {
        return true;
      }
    }
    return false;
  }

  function updatePlatforms(now) {
    for (const plat of platforms) {
      if (!plat.solid && plat.fallVy !== undefined) {
        plat.y += plat.fallVy;
        plat.fallVy += 0.35;
      }
      if (plat.steppedAt != null && plat.solid) {
        const elapsed = now - plat.steppedAt;
        if (elapsed >= crumbleMs) {
          plat.solid = false;
          plat.fallVy = 0.4;
        }
      }
    }
  }

  function checkVictory() {
    if (player.onPlatformIndex >= NUM_PLATFORMS - 1 && grounded) {
      gameOver = true;
      restartBtn.hidden = false;
      if (coinCount >= MIN_COINS_FOR_ESCAPE) {
        victory = true;
        rejectedAtTop = false;
        stateHud.textContent = "Rapunzel welcomes you!";
      } else {
        victory = false;
        rejectedAtTop = true;
        stateHud.textContent = `Rejected — need ${MIN_COINS_FOR_ESCAPE} coins (${coinCount} collected)`;
      }
    }
  }

  function checkDeath(screenY) {
    if (victory || gameOver) return;
    if (grounded) {
      voidBelowFrames = 0;
      return;
    }
    if (player.vy > 0.25) {
      if (hasSolidPlatformBelowFeet()) {
        voidBelowFrames = 0;
      } else {
        voidBelowFrames += 1;
        if (voidBelowFrames >= VOID_DEATH_FRAMES) {
          gameOver = true;
          stateHud.textContent = "Game over — nothing below";
          restartBtn.hidden = false;
          return;
        }
      }
    } else {
      voidBelowFrames = 0;
    }
    if (screenY > H + 48) {
      gameOver = true;
      stateHud.textContent = "Game over — you fell";
      restartBtn.hidden = false;
    }
  }

  function hairXAtWorldY(wy, t) {
    return (
      HAIR_ANCHOR_X +
      20 * Math.sin(wy * 0.0105 + t * 0.0011) +
      11 * Math.sin(wy * 0.026 - t * 0.00085) +
      6 * Math.sin(wy * 0.045 + t * 0.0023)
    );
  }

  function drawRoundTowerInterior(y0, y1, t) {
    const midX = W * 0.5;
    const g = ctx.createRadialGradient(midX, (y0 + y1) * 0.5, 40, midX, (y0 + y1) * 0.5, Math.max(W, y1 - y0) * 0.72);
    g.addColorStop(0, "rgba(55, 48, 40, 0.55)");
    g.addColorStop(0.35, "rgba(28, 25, 22, 0.92)");
    g.addColorStop(1, "rgba(12, 10, 9, 0.98)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, W, y1 - y0);

    const shaft = ctx.createLinearGradient(INNER_LEFT, y0, INNER_RIGHT, y0);
    shaft.addColorStop(0, "rgba(0,0,0,0.35)");
    shaft.addColorStop(0.22, "rgba(0,0,0,0.05)");
    shaft.addColorStop(0.5, "rgba(8, 7, 6, 0.12)");
    shaft.addColorStop(0.78, "rgba(0,0,0,0.05)");
    shaft.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = shaft;
    ctx.fillRect(INNER_LEFT, y0, INNER_RIGHT - INNER_LEFT, y1 - y0);

    ctx.strokeStyle = "rgba(255, 232, 200, 0.04)";
    ctx.lineWidth = 1;
    for (let wy = Math.floor(y0 / 64) * 64; wy < y1; wy += 64) {
      const sway = 14 * Math.sin(wy * 0.02 + t * 0.0006);
      ctx.beginPath();
      ctx.moveTo(midX + sway, wy);
      ctx.lineTo(midX + sway * 0.4, wy + 64);
      ctx.stroke();
    }
  }

  function drawStoneCourseWall(x0, x1, y0, y1, seed, flip) {
    const rowH = 20;
    const baseHue = 32;
    for (let wy = Math.floor(y0 / rowH) * rowH - rowH; wy < y1 + rowH; wy += rowH) {
      const row = (wy / rowH) | 0;
      const stagger = (row % 2) * ((x1 - x0) * 0.22);
      const brickW = (x1 - x0) / 3.2;
      for (let b = -1; b < 5; b++) {
        const bx = x0 + b * brickW + stagger;
        const n = Math.sin(seed * 0.001 + row * 1.7 + b * 2.1) * 0.5 + 0.5;
        const L = 42 + n * 18;
        const s = 12 + (n * 8) % 6;
        ctx.fillStyle = `hsl(${baseHue + n * 8}, ${s}%, ${L}%)`;
        ctx.fillRect(bx + 1, wy + 1, brickW - 2, rowH - 3);
        ctx.strokeStyle = "rgba(0,0,0,0.28)";
        ctx.strokeRect(bx + 0.5, wy + 0.5, brickW - 1, rowH - 2);
      }
    }
    const edge = ctx.createLinearGradient(flip ? x1 : x0, y0, flip ? x0 : x1, y0);
    edge.addColorStop(0, "rgba(0,0,0,0.55)");
    edge.addColorStop(0.45, "rgba(0,0,0,0)");
    edge.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = edge;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }

  function drawTorchSconces(y0, y1, t) {
    const places = [INNER_LEFT + 4, INNER_RIGHT - 10];
    for (let wy = Math.floor(y0 / 320) * 320; wy < y1 + 320; wy += 320) {
      for (let i = 0; i < places.length; i++) {
        const px = places[i];
        const flick = 0.65 + 0.35 * Math.sin(t * 0.018 + wy * 0.03 + i);
        ctx.fillStyle = `rgba(255, 190, 90, ${0.12 * flick})`;
        ctx.beginPath();
        ctx.arc(px + 4, wy + 18, 52, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#3a3530";
        ctx.fillRect(px, wy, 10, 22);
        ctx.fillStyle = "#c2410c";
        ctx.beginPath();
        ctx.moveTo(px + 2, wy + 22);
        ctx.lineTo(px + 5, wy + 34 + flick * 4);
        ctx.lineTo(px + 8, wy + 22);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 235, 160, ${0.55 * flick})`;
        ctx.beginPath();
        ctx.arc(px + 5, wy + 30 + flick * 2, 4 + flick * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawGothicWindowAndPrincess(t) {
    const cx = HAIR_ANCHOR_X;
    const sillY = RAPUNZEL_HEAD_Y + 52;
    ctx.save();
    ctx.strokeStyle = "rgba(35, 32, 30, 0.95)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 62, sillY);
    ctx.lineTo(cx - 62, RAPUNZEL_HEAD_Y - 20);
    ctx.quadraticCurveTo(cx - 62, RAPUNZEL_HEAD_Y - 58, cx - 28, RAPUNZEL_HEAD_Y - 62);
    ctx.lineTo(cx + 28, RAPUNZEL_HEAD_Y - 62);
    ctx.quadraticCurveTo(cx + 62, RAPUNZEL_HEAD_Y - 58, cx + 62, RAPUNZEL_HEAD_Y - 20);
    ctx.lineTo(cx + 62, sillY);
    ctx.stroke();

    const night = ctx.createLinearGradient(cx, TOWER_TOP_Y, cx, RAPUNZEL_HEAD_Y + 20);
    night.addColorStop(0, "#0a1628");
    night.addColorStop(1, "#152642");
    ctx.fillStyle = night;
    ctx.beginPath();
    ctx.moveTo(cx - 56, sillY - 3);
    ctx.lineTo(cx - 56, RAPUNZEL_HEAD_Y - 16);
    ctx.quadraticCurveTo(cx - 56, RAPUNZEL_HEAD_Y - 52, cx - 26, RAPUNZEL_HEAD_Y - 56);
    ctx.lineTo(cx + 26, RAPUNZEL_HEAD_Y - 56);
    ctx.quadraticCurveTo(cx + 56, RAPUNZEL_HEAD_Y - 52, cx + 56, RAPUNZEL_HEAD_Y - 16);
    ctx.lineTo(cx + 56, sillY - 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 248, 220, 0.06)";
    ctx.beginPath();
    ctx.arc(cx - 18, RAPUNZEL_HEAD_Y - 8, 3, 0, Math.PI * 2);
    ctx.arc(cx + 22, RAPUNZEL_HEAD_Y - 14, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2a1a2e";
    ctx.beginPath();
    ctx.ellipse(cx, RAPUNZEL_HEAD_Y + 8, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f5d0c5";
    ctx.beginPath();
    ctx.arc(cx, RAPUNZEL_HEAD_Y - 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3d2c22";
    ctx.fillRect(cx - 10, RAPUNZEL_HEAD_Y - 8, 20, 5);

    ctx.fillStyle = "#b8860b";
    ctx.beginPath();
    ctx.moveTo(cx - 14, RAPUNZEL_HEAD_Y + 6);
    ctx.lineTo(cx + 14, RAPUNZEL_HEAD_Y + 6);
    ctx.lineTo(cx + 10, RAPUNZEL_HEAD_Y + 28);
    ctx.lineTo(cx - 10, RAPUNZEL_HEAD_Y + 28);
    ctx.closePath();
    ctx.fill();

    const glow = ctx.createRadialGradient(cx, RAPUNZEL_HEAD_Y + 4, 2, cx, RAPUNZEL_HEAD_Y + 4, 48);
    glow.addColorStop(0, "rgba(255, 230, 150, 0.35)");
    glow.addColorStop(1, "rgba(255, 200, 80, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, RAPUNZEL_HEAD_Y + 6, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawGoldenHairStrands(y0, y1, t) {
    const strands = 5;
    for (let s = 0; s < strands; s++) {
      const phase = s * 1.7;
      const thick = s === 0 ? 14 : 5 - s * 0.35;
      ctx.beginPath();
      let started = false;
      for (let wy = y0 - 40; wy < y1 + 80; wy += 10) {
        const x = hairXAtWorldY(wy, t) + (s - strands / 2) * 5.5 + 4 * Math.sin(phase + wy * 0.015);
        if (!started) {
          ctx.moveTo(x, wy);
          started = true;
        } else {
          ctx.lineTo(x, wy);
        }
      }
      const g = ctx.createLinearGradient(HAIR_ANCHOR_X, y0, HAIR_ANCHOR_X + 30, y1);
      g.addColorStop(0, s === 0 ? "#fff3b0" : "#e8c86a");
      g.addColorStop(0.5, s === 0 ? "#e6b422" : "#c9a227");
      g.addColorStop(1, "#7a5a12");
      ctx.strokeStyle = g;
      ctx.lineWidth = thick;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = s === 0 ? 0.95 : 0.55;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawWoodPlatform(px, py, pw, ph, plat, shake, now) {
    const t = plat.steppedAt != null ? (now - plat.steppedAt) / crumbleMs : 0;
    const warn = t > 0.72 ? 1 - (1 - t) / 0.28 : 0;
    const u = px + shake;
    const base = 28 - warn * 12;
    const wood = `hsl(${base}, ${42 - warn * 15}%, ${38 + warn * 22}%)`;
    ctx.fillStyle = wood;
    ctx.fillRect(u, py, pw, ph);
    ctx.strokeStyle = "rgba(20, 12, 8, 0.55)";
    ctx.lineWidth = 1;
    for (let i = 8; i < pw - 4; i += 14) {
      ctx.beginPath();
      ctx.moveTo(u + i, py + 2);
      ctx.lineTo(u + i, py + ph - 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(60, 45, 30, 0.9)";
    ctx.fillRect(u - 3, py + 2, 5, ph - 4);
    ctx.fillRect(u + pw - 2, py + 2, 5, ph - 4);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.strokeRect(u + 0.5, py + 0.5, pw - 1, ph - 1);
  }

  function drawReachTowardHair(t) {
    const cx = player.x + PLAYER_W * 0.5;
    const reachY = Math.max(TOWER_TOP_Y + 40, player.y - 52 - Math.min(90, player.vy * -2.2));
    const tx = hairXAtWorldY(reachY, t);
    const ty = reachY;
    const climb = (player.y - RAPUNZEL_HEAD_Y) / (BASE_WORLD_Y - RAPUNZEL_HEAD_Y);
    const a = Math.max(0.06, Math.min(0.42, 0.52 - climb * 0.55));
    if (player.y < RAPUNZEL_HEAD_Y + 40) return;

    ctx.save();
    ctx.setLineDash([3, 7]);
    ctx.strokeStyle = `rgba(255, 220, 140, ${a * 0.55})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, player.y + 14);
    ctx.quadraticCurveTo((cx + tx) * 0.5 + knightFacing * 18, (player.y + ty) * 0.5 - 30, tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = `rgba(255, 245, 200, ${a * 0.35})`;
    ctx.beginPath();
    ctx.arc(tx, ty, 3.5 + 0.8 * Math.sin(t * 0.012), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawKnight(x, y, t) {
    const f = knightFacing;
    ctx.save();
    const bob = grounded ? Math.sin(t * 0.022) * 0.45 : 0;
    ctx.translate(x, y + bob);

    const cx = PLAYER_W * 0.5;
    const armReach = player.vy < -1.0 ? 8 + Math.min(10, -player.vy * 0.65) : 0;

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(cx, 29.5, 4.2, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1e2d4a";
    ctx.beginPath();
    ctx.moveTo(cx - 3, 22);
    ctx.lineTo(cx - 4.5, 31);
    ctx.lineTo(cx - 1, 33);
    ctx.lineTo(cx - 1.5, 22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 3, 22);
    ctx.lineTo(cx + 4.5, 31);
    ctx.lineTo(cx + 1, 33);
    ctx.lineTo(cx + 1.5, 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#243a63";
    ctx.beginPath();
    ctx.moveTo(cx - 6, 15);
    ctx.lineTo(cx + 6, 15);
    ctx.lineTo(cx + 4.5, 23);
    ctx.lineTo(cx - 4.5, 23);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#1a2744";
    ctx.fillRect(cx - 5, 15, 10, 8);

    ctx.strokeStyle = "#1b2a45";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    const sh = 14;
    ctx.moveTo(f > 0 ? cx + 5 : cx - 5, sh);
    ctx.lineTo(
      f > 0 ? cx + 8 + armReach * 0.25 : cx - 8 - armReach * 0.25,
      sh - 5 - armReach,
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(f > 0 ? cx - 5 : cx + 5, sh + 1);
    ctx.lineTo(f > 0 ? cx - 9 : cx + 9, sh + 7);
    ctx.stroke();

    ctx.fillStyle = "#c7a26a";
    ctx.fillRect(f > 0 ? PLAYER_W - 9 : -1, 13, 9, 11);
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(f > 0 ? PLAYER_W - 9 : -1, 13, 9, 11);

    ctx.fillStyle = "#9aaab8";
    ctx.beginPath();
    ctx.ellipse(cx, 7.2, 6.2, 6.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1f28";
    ctx.fillRect(cx - 5, 5.5, 10, 2.2);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, 7.5, 6.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawCoins(now) {
    for (const c of coins) {
      if (c.collected) continue;
      const p = platforms[c.platI];
      if (!p) continue;
      if (p.y > cameraTop + H + 160) continue;
      const shake =
        p.steppedAt != null && p.solid && now - p.steppedAt > crumbleMs - crumbleShakeLeadMs
          ? Math.sin(now / 40 + p.i) * 2
          : 0;
      const cx = p.x + p.w * 0.5 + shake;
      const cy = p.y - 19 + Math.sin(now * 0.0045 + c.phase) * 4;
      const r = 9;

      ctx.save();
      const gl = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, r + 4);
      gl.addColorStop(0, "#fff8d4");
      gl.addColorStop(0.35, "#f0c030");
      gl.addColorStop(0.85, "#b8860b");
      gl.addColorStop(1, "#6a4a0a");
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(90, 60, 10, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx - 2.5, cy - 2.5, 2.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawWorld(now) {
    ctx.save();
    ctx.translate(0, -cameraTop);

    const y0 = cameraTop;
    const y1 = cameraTop + H + 600;
    const wallH = cameraTop + H + 2400;

    drawRoundTowerInterior(y0, y1, now);

    if (y0 < RAPUNZEL_HEAD_Y + 140) {
      drawGothicWindowAndPrincess(now);
    }

    drawGoldenHairStrands(y0, y1, now);

    drawStoneCourseWall(0, INNER_LEFT, y0, wallH, 11, false);
    drawStoneCourseWall(INNER_RIGHT, W, y0, wallH, 29, true);
    drawTorchSconces(y0, y1, now);

    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    for (let gy = Math.floor(y0 / 52) * 52; gy < y1; gy += 52) {
      ctx.beginPath();
      ctx.moveTo(INNER_LEFT, gy);
      ctx.lineTo(INNER_RIGHT, gy);
      ctx.stroke();
    }

    for (const plat of platforms) {
      if (!plat.solid && plat.y > cameraTop + H + 200) continue;
      const shake =
        plat.steppedAt != null && plat.solid && now - plat.steppedAt > crumbleMs - crumbleShakeLeadMs
          ? Math.sin(now / 40 + plat.i) * 2
          : 0;
      const px = plat.x + shake;
      if (plat.solid) {
        drawWoodPlatform(px, plat.y, plat.w, plat.h, plat, shake, now);
      } else {
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#64748b";
        ctx.fillRect(px, plat.y, plat.w, plat.h);
        ctx.globalAlpha = 1;
      }
    }

    drawCoins(now);
    drawReachTowardHair(now);
    drawKnight(player.x, player.y, now);

    ctx.restore();

    ctx.fillStyle = "rgba(8, 6, 5, 0.55)";
    ctx.fillRect(0, H - 8, W, 8);
  }

  function loop(ts) {
    if (!gameOver) {
      const dt = lastTs ? Math.min(32, ts - lastTs) : 16;
      lastTs = ts;
      const now = ts;

      const groundedStart = grounded;

      const left = keys.ArrowLeft || keys.KeyA;
      const right = keys.ArrowRight || keys.KeyD;
      const accel = grounded ? RUN_ACCEL : AIR_ACCEL;
      if (left && !right) player.vx -= accel * (dt / 16);
      if (right && !left) player.vx += accel * (dt / 16);
      if (!left && !right) {
        player.vx *= grounded ? GROUND_FRICTION : AIR_FRICTION;
      }
      if (player.vx > MAX_RUN) player.vx = MAX_RUN;
      if (player.vx < -MAX_RUN) player.vx = -MAX_RUN;

      if (Math.abs(player.vx) > 0.12) {
        knightFacing = player.vx >= 0 ? 1 : -1;
      }

      player.x += player.vx * (dt / 16);
      resolveHorizontalWall();

      player.vy += GRAVITY * (dt / 16);
      player.y += player.vy * (dt / 16);

      platformCollideVertical();
      tryJump(now);
      if (groundedStart && !grounded) {
        coyoteUntil = now + COYOTE_MS;
      }
      markPlatformsLeftBelow(now);
      updatePlatforms(now);
      tryCollectCoins();

      const targetTop = player.y - H * 0.44;
      cameraTop += (targetTop - cameraTop) * CAMERA_LERP;
      cameraTop -= FORCED_SCROLL * (dt / 16);

      checkVictory();

      const screenY = player.y - cameraTop;
      checkDeath(screenY);

      floorHud.textContent = `Floor: ${Math.min(NUM_PLATFORMS, highestFloor)} / ${NUM_PLATFORMS}`;
      coinHud.textContent = `Coins: ${coinCount} / ${MIN_COINS_FOR_ESCAPE}`;
    }

    drawFrame(ts);

    if (!gameOver) {
      raf = requestAnimationFrame(loop);
    }
  }

  function drawFrame(ts) {
    const now = ts || performance.now();
    ctx.clearRect(0, 0, W, H);
    drawWorld(now);
    if (gameOver && victory) {
      ctx.fillStyle = "rgba(2, 6, 23, 0.65)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f0f9ff";
      ctx.font = "bold 26px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Rescued!", W / 2, H / 2 - 10);
    } else if (gameOver && rejectedAtTop) {
      ctx.fillStyle = "rgba(2, 6, 23, 0.68)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fca5a5";
      ctx.font = "bold 26px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Rejected", W / 2, H / 2 - 22);
      ctx.fillStyle = "#fde68a";
      ctx.font = "600 15px system-ui,sans-serif";
      ctx.fillText(`Need ${MIN_COINS_FOR_ESCAPE} coins for the escape — you had ${coinCount}`, W / 2, H / 2 + 10);
    } else if (gameOver) {
      ctx.fillStyle = "rgba(2, 6, 23, 0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fecaca";
      ctx.font = "bold 24px system-ui,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Game over", W / 2, H / 2);
    }
  }

  window.addEventListener("keydown", (e) => {
    if (!gameStarted) {
      if (e.code === "Space" || e.code.startsWith("Arrow")) {
        e.preventDefault();
      }
      return;
    }
    keys[e.code] = true;
    if (e.code === "Space") {
      e.preventDefault();
      jumpBufferedUntil = performance.now() + JUMP_BUFFER_MS;
    }
    if (e.code.startsWith("Arrow") || e.code === "Space") {
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (!gameStarted) {
      return;
    }
    keys[e.code] = false;
  });

  restartBtn.addEventListener("click", () => {
    const won = victory;
    if (won && difficultyPick) {
      openDifficultyPicker();
      return;
    }
    reset();
  });

  function openDifficultyPicker() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    lastTs = 0;
    gameStarted = false;
    victory = false;
    gameOver = false;
    if (restartBtn) {
      restartBtn.hidden = true;
    }
    if (diffHud) {
      diffHud.textContent = "Pick";
    }
    if (difficultyPick) {
      difficultyPick.hidden = false;
    }
    if (platforms.length > 0 && player && typeof player.x === "number") {
      drawFrame(performance.now());
    }
  }

  function initDifficultyPick() {
    if (!difficultyPick || !diffHud) {
      setCrumbleTiming(5000);
      reset();
      return;
    }
    openDifficultyPicker();
    difficultyPick.querySelectorAll("button[data-ms]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ms = Number(btn.getAttribute("data-ms"));
        const label = btn.getAttribute("data-label") || "Custom";
        setCrumbleTiming(ms);
        diffHud.textContent = `${label} · ${ms / 1000}s`;
        difficultyPick.hidden = true;
        reset();
      });
    });
  }

  initDifficultyPick();
})();
