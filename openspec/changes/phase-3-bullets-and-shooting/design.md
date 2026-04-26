## Context

Phase 2 ships a moving Soldier on a tiled ground. Phase 3 adds the player's primary verb — shooting — and lays the bullet abstraction every later phase reuses (Phase 4's shooter enemies fire from the same pool, Phase 5's enemy bullets damage the player, Phase 8 swaps the placeholder shoot SFX for a real one). This is also the first place where input *during gameplay* must coexist with movement input from Phase 2 — both consume keys on the same scene.

Constraints: still no build step, still Phaser 3 + pure CSS, all code under `/contra-AC`, tuning in `config.js`.

## Goals / Non-Goals

**Goals:**
- Pressing `Z`, `X`, or left mouse button fires an arrow horizontally in the direction the player faces.
- A bullet pool that supports a steady stream of fires without runtime allocation.
- A fire cooldown that turns "held button" into a steady rhythm rather than a frame-rate dependent flood.
- Attack animation plays on each fire.
- Bullets despawn when off-screen, on ground contact, or after `BULLET_LIFETIME_MS` (whichever first).
- Placeholder shoot SFX wired (real asset in Phase 8).

**Non-Goals:**
- No spread shot, multi-direction aim, or aim up/down/diagonal — all explicit MVP non-goals.
- No power-ups, ammo counter, weapon switch.
- No enemy targets yet (Phase 4 owns enemy collision).
- No real audio asset (Phase 8).

## Decisions

### Decision 1: Object pool via `Phaser.Physics.Arcade.Group` with `maxSize`

**Choice:** `Bullet.js` exports a factory: `createBulletPool(scene)` returns a configured Arcade Physics group with a fixed `maxSize` and `classType` of `Bullet` (a small subclass of `Phaser.Physics.Arcade.Sprite`). Firing calls `group.getFirstDead(true, x, y, ...)`.

**Why:**
- Zero per-shot allocation once warm. A 60Hz game with a 200ms cooldown fires up to 5 bullets/sec; over a 90-second run that's 450 fires — well within a `maxSize` of, say, 32.
- Reusing dead instances keeps GC churn low and crash-resistant on long runs.
- `getFirstDead(true, ...)` auto-spawns and resets, removing the per-fire reset code from the caller.

**Alternatives considered:** Plain `physics.add.sprite` per fire (rejected — allocation pressure, harder to bound count); custom array-based pool (rejected — Arcade groups already do this cleanly).

### Decision 2: Single bullet class for both player and enemy projectiles

**Choice:** `Bullet` extends `Phaser.Physics.Arcade.Sprite` and stores `friendly: boolean` plus a tint. The pool is created in `GameScene` and is shared. Phase 3 only fires `friendly: true` bullets; Phase 4 will fire `friendly: false` from shooter enemies using the same pool.

**Why:**
- The mechanics (constant horizontal velocity, despawn on screen-leave or ground-hit) are identical. Tinting and ownership are the only differences.
- Sharing the pool means one collider setup site (in `GameScene`) and one place to tune projectile feel for the whole game.
- Discriminating with a flag is cheaper and clearer than two parallel pools that would need to be reconciled later.

**Alternatives considered:** Two separate pools (rejected — duplicates code and tuning surface for negligible benefit).

### Decision 3: Despawn rules: off-screen OR ground OR lifetime

**Choice:** A bullet returns to the pool when any of:
- Its world position leaves the camera's visible bounds (with a small margin).
- It collides with the ground (Arcade collider).
- `BULLET_LIFETIME_MS` elapses since spawn (safety net for any path that escapes the other two checks).

**Why:**
- Multiple termination paths catch edge cases: bullets spawned off-screen by the spawner in Phase 4 wouldn't trigger the camera-bounds check until they came on-screen and left again; the lifetime cap forecloses runaway bullets.
- Using camera bounds rather than level bounds means a stray bullet doesn't traverse 3 screens uselessly.

### Decision 4: Fire input: `Z`, `X`, or left-mouse — held = continuous fire

**Choice:** `Player.js` checks each frame whether any of the fire inputs is *currently down* and whether `time - lastFiredAt >= PLAYER_FIRE_COOLDOWN_MS`. If so, it fires.

**Why:**
- "Held" rather than "tap" matches the genre. A player should be able to keep firing while running.
- Cooldown is wall-clock based, not frame based — frame-rate variance does not change fire rate.
- Storing `lastFiredAt` on the player keeps the cooldown logic colocated with the input that triggers it.

**Alternatives considered:** `JustDown` only (rejected — forces tap-spamming, doesn't match Contra feel); a separate `Weapon` module (rejected — premature abstraction with one weapon).

### Decision 5: Mouse left-click is treated as a discrete fire input

**Choice:** `scene.input.activePointer.isDown` (left button) is read alongside the keyboard fire keys.

**Why:**
- Roadmap explicitly lists `Z / X / mouse` as fire inputs. Click-and-hold should fire continuously, same as a held key.
- No mouse-aim — direction is still "where the player is facing", because aim-with-mouse is an explicit MVP non-goal.

### Decision 6: Attack animation interrupts neither walk nor idle

**Choice:** The attack animation plays on top of (rather than replacing) the body's movement animation: when fire happens, briefly swap to `soldier-attack` for the animation's duration, then restore `soldier-walk` or `soldier-idle` based on movement state. Implementation: trigger the animation, on its `animationcomplete` event reset to the movement-appropriate animation.

**Why:**
- The Soldier sprite set has separate Idle/Walk/Attack sheets — there's no walk-and-shoot frame. The pragmatic solution is to play attack and snap back.
- Attack animations are short (typically <250ms); a held trigger replays attack at the cooldown rate, which reads correctly.

### Decision 7: Bullet velocity is purely horizontal, derived from facing

**Choice:** `velocityX = player.flipX ? -BULLET_SPEED : +BULLET_SPEED`. `velocityY = 0`. `body.allowGravity = false`.

**Why:**
- Roadmap: "straight horizontal shots". No vertical drop.
- `allowGravity = false` is critical because world gravity is set on the physics world, not per body — without disabling, bullets would arc.

## Risks / Trade-offs

- **Pool exhaustion** → Mitigation: `maxSize = 32` (or larger if playtest needs it). With a 200ms cooldown and 600ms typical bullet flight time, well under 32 are alive simultaneously. If `getFirstDead` returns null, a small console warning fires (no crash).
- **Mouse click-through on a paused/menu scene** → Not an issue in Phase 3 (no menu overlap during gameplay), but Phase 7's pause must remember to gate fire input. Document this in Phase 7's design rather than over-engineering now.
- **Bullet/ground collision masking** → If the Phase 2 ground body extends slightly above the visible tile, bullets fired at ground level could collide too early. Mitigation: align bullet spawn Y to the player's torso (~30px above the body bottom), not the body bottom.
- **Animation snap-back jitter** → If `animationcomplete` fires after the player has already changed movement state, the wrong "after" animation could play. Mitigation: in the snap-back, check current input state at firing time, not at animation start.

## Migration Plan

Additive over Phase 2. No data migration. Rollback removes the bullet module and the fire input wiring; Phase 2 continues to work.

## Open Questions

- **Exact `BULLET_SPEED`** — start at `600 px/s`. Tune in playtest until "shoot in front of where the player is running" feels right.
- **Exact `PLAYER_FIRE_COOLDOWN_MS`** — start at `200ms` (5 shots/sec). Faster feels chaotic; slower feels weak. Final number lands in playtest.
- **Bullet-on-bullet collisions** — explicitly disabled. The genre rarely uses bullet-cancels and adding it now is speculative.
