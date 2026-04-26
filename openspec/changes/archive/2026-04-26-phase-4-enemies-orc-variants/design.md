## Context

Phase 3 left bullets that hit nothing. Phase 4 introduces three enemy variants — Grunt, Shooter, Jumper — built from the single Orc sprite set, plus a spawner. The "behavior + tint + scale" rule (no new art for variant differences) is the project's biggest art-budget constraint, so this phase is where the rule gets baked into a working pattern.

The shooter variant fires arrows back at the player using the Phase 3 bullet pool, validating that pool's reusability. The Phase 5 damage link comes next — for this phase, enemies are visible threats but they cannot yet hurt the Soldier.

Constraints unchanged: no build step, Phaser 3 + pure CSS, code under `/contra-AC`, tuning in `config.js`, no new art.

## Goals / Non-Goals

**Goals:**
- Three Orc variants alive simultaneously, each with distinct behavior, tint, and scale.
- A spawner that randomly picks a variant, spawns at off-screen edges, and caps simultaneous live enemies.
- Player bullets damage enemies and trigger hurt/death animations.
- Shooter variant fires from the same `Bullet` pool with `friendly: false`, distinguished by tint.
- All per-variant tuning lives in `config.js` as parameter blocks, not as subclasses.

**Non-Goals:**
- Enemies do **not** damage the player yet (Phase 5).
- No score on kill yet (Phase 7).
- No boss, no fourth enemy type, no enemy melee animations beyond death and hurt.
- No path-finding, no jumping over obstacles (the level is flat).
- No enemy-vs-enemy collision (they pass through each other).

## Decisions

### Decision 1: One `Enemy` class parameterized by variant config — no subclasses

**Choice:** `contra-AC/src/entities/Enemy.js` exports `class Enemy extends Phaser.Physics.Arcade.Sprite`. Its constructor takes `(scene, x, y, variant)` where `variant` is a string key into `config.js`. The class reads its tint, scale, HP, speed, and behavior id from the variant block and dispatches per-frame behavior via a `switch` on the behavior id.

**Why:**
- `CLAUDE.md` is explicit: "No premature abstraction. If two enemy types differ in only a constant, parameterize — don't subclass yet. Subclass only when behavior diverges."
- The three behaviors (walk-toward, stand-and-shoot, hop-toward) are all small enough that a `switch` in `update` is more readable than a strategy pattern with three classes.
- Adds a fourth variant later? If its behavior fits the same shape, add a config block. If not, *that* phase introduces subclasses.

**Alternatives considered:** Three subclasses of `Enemy` (rejected as premature); a strategy/component system (rejected as overkill for three variants).

### Decision 2: Shooter reuses the Phase 3 `Bullet` pool with `friendly: false`

**Choice:** When a Shooter fires, it calls `scene.bullets.get().fire(x, y, dirX, false)`. Bullets with `friendly === false` are tinted red and target the player (Phase 5 wires the actual damage; Phase 4 just makes them exist and travel).

**Why:**
- Phase 3 already designed the pool to be sharable. Validating that here costs almost nothing.
- A separate enemy-bullet pool would double the number of colliders to manage (player vs enemy-bullets, enemy vs player-bullets, etc.) and split tuning across two files.

### Decision 3: Spawner is a small, standalone module owned by `GameScene`

**Choice:** `contra-AC/src/entities/EnemySpawner.js` exports `class EnemySpawner` that takes `(scene, enemyGroup, options)`. It uses `scene.time.addEvent({ delay: ENEMY_SPAWN_INTERVAL_MS, loop: true, callback })` to attempt spawns. On each tick:
- If `enemyGroup.countActive(true) >= ENEMY_MAX_ON_SCREEN`, skip.
- Else pick a variant uniformly at random.
- Pick a side uniformly at random; spawn just outside that camera edge at ground level.
- Call `enemyGroup.get(x, y, variant)`.

**Why:**
- Keeps the spawn policy in one file with one knob (interval) and one cap (max-on-screen). Easy to read, easy to tune.
- Time-event based (not per-frame) means the spawn rate is decoupled from frame rate.
- Skipping rather than queuing means the on-screen cap is always respected — no runaway after a spike.

**Alternatives considered:** Per-frame probabilistic spawn (rejected — frame-rate dependent); pre-authored spawn waves (rejected — out of MVP scope; the level is "random infinite spawn for 90s").

### Decision 4: Variant differences = `tint` + `scale` + `behaviorId` + `hp` + `speed`

**Choice:** `config.js` exports `ENEMY_VARIANTS = { grunt: {...}, shooter: {...}, jumper: {...} }`. Each block has the keys above plus variant-specific knobs (e.g., shooter's `fireIntervalMs`, jumper's `jumpIntervalMs`, `jumpVelocity`). The `Enemy` constructor merges this block onto `this`.

**Why:**
- One place a designer can change all three variants' feel without opening any other file.
- A flat per-variant block means new knobs (e.g. "grunt minimum walk distance") slot in cleanly without restructuring.
- Tints are committed-to-config hex strings — Phase 8 only revisits the values, not the structure.

### Decision 5: Hurt and death animations are universal across variants

**Choice:** All variants share `orc-hurt` and `orc-death` animations registered in `BootScene`. On hurt, the variant's tint is briefly overridden with a flash, then restored. On death, the body is disabled while the death animation plays; on `animationcomplete` the sprite is fully deactivated and returns to the group.

**Why:**
- Every variant uses the Orc sprite set, so animations are identical at the sprite level.
- Briefly overriding tint for the hurt flash is what a player reads as "I hit it" — Phase 8 can adjust the flash color and duration but the mechanism is here.

### Decision 6: Player and enemies physically collide; bullets are the damage

**Choice:** Add `physics.add.collider(player, enemies)` so bodies don't overlap. Damage from player→enemy is via `physics.add.overlap(playerBullets, enemies, onHit)`. Damage from enemy→player is left for Phase 5; Phase 4 ships the collider but no `onHit`.

**Why:**
- Without the collider, Grunts walk through the player which feels broken even without damage.
- Splitting damage from collision means Phase 5 only adds the overlap callback — no restructure of Phase 4 code.

### Decision 7: Spawn position respects camera, not level

**Choice:** Spawn just outside `cameras.main.worldView.left - margin` or `cameras.main.worldView.right + margin`, clamped to the level bounds.

**Why:**
- Spawning outside the level (e.g., at x=-200 when the camera is at x=0) puts enemies in a place the player can never reach.
- The clamp ensures spawns are always inside the level so enemies become reachable as the camera scrolls.

## Risks / Trade-offs

- **Spawn pile-ups at level edges** → If the player camps the right edge, spawns from the right are clamped to the level boundary and may overlap. Mitigation: when clamped, the spawner picks the other side. If both sides are clamped (impossible at LEVEL_WIDTH_SCREENS=3 unless camera is exactly at level center, which never happens), skip the tick.
- **Jumper getting stuck on edges** → If a jumper hits a vertical wall while airborne, its trajectory could oscillate. Mitigation: jumper's behavior includes "if I'm against a wall, change direction"; tested in playtest.
- **Bullet/enemy overlap precision with tinted sprites** → The 100×100 sprite has transparent padding; an oversized hitbox lets bullets register on what looks like air. Mitigation: each variant's hitbox is set explicitly via `body.setSize` to a tighter rect; tuned in playtest.
- **Pool-of-pools complexity** → The bullet pool must accept enemy bullets without enemy code knowing about pool internals. Mitigation: the pool's only public surface is `pool.get(...).fire(x, y, dirX, friendly)`. Enemy code calls only that.
- **Performance with 5 enemies + ~10 active bullets** → Arcade Physics handles this well within budget. No mitigation needed unless playtest shows frame drops.

## Migration Plan

Additive over Phase 3. Rolling back removes the enemies and spawner; the Phase 3 shooting range continues to work.

## Open Questions

- **Per-variant exact HP values** — start at Grunt 1, Shooter 2, Jumper 1. Tune in playtest so the player's per-shot DPS times time-on-target lines up with expected kill rate.
- **Shooter's fire interval** — start at 1500ms. If it feels too aggressive (because multiple shooters can be on-screen), raise it.
- **Whether the shooter fires while off-screen** — default no, only fires while inside camera bounds. Saves CPU and prevents the "got hit by something I never saw" feel.
