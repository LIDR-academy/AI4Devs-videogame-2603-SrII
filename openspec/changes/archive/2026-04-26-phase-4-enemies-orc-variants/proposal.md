## Why

Phase 3 lets the player shoot bullets that hit nothing. Phase 4 introduces opponents: three behaviorally-distinct enemies built from the single Orc sprite set, plus a spawner that maintains 3–5 enemies on screen. Without enemies, the level is a target range; with them, it becomes a stage. This phase also locks in the "behavior + tint + scale" pattern the project will use for visual variety, since `CLAUDE.md` and the design doc both prohibit adding new enemy art.

The Orc variants are the second use of the bullet pool (the shooter type fires arrows back at the player), validating the projectile abstraction Phase 3 established.

## What Changes

- New entity module `contra-AC/src/entities/Enemy.js` — a single Phaser `Arcade.Sprite` subclass parameterized by a variant config (tint, scale, HP, speed, behavior id). No subclasses unless behavior diverges.
- Three variant configs in `src/config.js` keyed by `variant`:
  - **Grunt**: walks toward the player at ground level. Default tint, base scale, low HP.
  - **Shooter**: stationary; on a timer, fires an arrow projectile (reusing the Phase 3 `Bullet` pool, with a different tint to mark "enemy bullet"). Slightly larger scale, mid HP.
  - **Jumper**: hops along the ground in arcs toward the player using a periodic vertical impulse. Tint and scale distinct from Grunt and Shooter, low HP.
- New module `contra-AC/src/entities/EnemySpawner.js` — a small spawner owned by `GameScene` that:
  - Picks a variant at random per spawn.
  - Spawns at off-screen edges (left or right, slightly outside the camera view).
  - Caps simultaneous live enemies at `ENEMY_MAX_ON_SCREEN` (default 5).
  - Respects a minimum spawn interval (`ENEMY_SPAWN_INTERVAL_MS`).
- `Bullet.js` gains a `friendly: boolean` flag so the same pool can carry both player and enemy projectiles, distinguished by tint and collision target.
- `BootScene` preloads the Orc sprite sheets (Idle, Walk, Attack01, Hurt, Death).
- Enemies show hurt and death animations on damage and death; on death-animation-complete the sprite is returned to the pool.
- Player bullets damage enemies. Enemies do **not** yet damage the player (Phase 5 owns that link), but enemies and the player can collide physically.

## Capabilities

### New Capabilities
- `enemies`: the Enemy entity, the three variant configs, the spawner, hurt/death animations, and bullet→enemy damage resolution.

### Modified Capabilities
- `combat-shooting`: the bullet pool now carries a `friendly` flag and supports two visual tints (player vs. enemy projectile). Player bullets gain an explicit collision target (the enemy group).
- `game-shell`: `BootScene` preloads the Orc sprite set; `GameScene` instantiates the spawner.

## Impact

- **New files:** `contra-AC/src/entities/Enemy.js`, `contra-AC/src/entities/EnemySpawner.js`.
- **Modified files:** `contra-AC/src/entities/Bullet.js`, `contra-AC/src/scenes/BootScene.js`, `contra-AC/src/scenes/GameScene.js`, `contra-AC/src/config.js`.
- **Assets used (read-only):** `contra-AC/resources/Characters(100x100)/Orc/Idle.png`, `Walk.png`, `Attack01.png`, `Hurt.png`, `Death.png`. Enemy projectile reuses the Phase 3 Arrow asset with a different tint.
- **Constants added:** `ENEMY_MAX_ON_SCREEN = 5`, `ENEMY_SPAWN_INTERVAL_MS`, plus per-variant tint/scale/HP/speed/behavior-tuning blocks.
- **Constraints honored:** no new art added; behavior + tint + scale only.
- **Out of scope:** no damage to the player yet (Phase 5), no score (Phase 7), no boss, no enemy types beyond the three.
