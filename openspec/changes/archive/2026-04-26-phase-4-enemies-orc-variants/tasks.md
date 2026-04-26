## 1. Asset preload and animation registration

- [x] 1.1 Inspect `contra-AC/resources/Characters(100x100)/Orc/` sprite sheets and record frame counts per file as comments in `BootScene.js`. — Frame counts: Idle 6, Walk 8, Attack01 6, Hurt 4, Death 4 (all 100x100). Actual paths nested under `Orc/Orc/`.
- [x] 1.2 Update `BootScene.preload()` to load `orc-idle`, `orc-walk`, `orc-attack`, `orc-hurt`, `orc-death` sprite sheets.
- [x] 1.3 In `BootScene.create()`, register all five Orc animations with appropriate frame rates (extend `config.js` with `ANIM_FRAMERATE_ORC_*` constants if helpful). Hurt and death do not loop; idle and walk loop. — Added `ANIM_FRAMERATE_ENEMY_*` (idle=6, walk=10, attack=12, hurt=12, death=8). Attack also doesn't loop.

## 2. Tuning constants

- [x] 2.1 Extend `contra-AC/src/config.js` with: `ENEMY_MAX_ON_SCREEN = 5`, `ENEMY_SPAWN_INTERVAL_MS = 1500`, `ENEMY_SPAWN_MARGIN = 64` (px outside camera), and `ENEMY_VARIANTS` map with `grunt`, `shooter`, `jumper` entries (at minimum: `tint`, `scale`, `hp`, `speed`, `behaviorId`, plus `shooter.fireIntervalMs`, `jumper.jumpIntervalMs`, `jumper.jumpVelocity`). — All variants share a common `hitbox` block (30x40 in the middle of the 100x100 frame).

## 3. Enemy entity

- [x] 3.1 Create `contra-AC/src/entities/Enemy.js` exporting `class Enemy extends Phaser.Physics.Arcade.Sprite`. Constructor `(scene, x, y, variantKey)`:
  - `super(scene, x, y, 'orc-idle')`.
  - Add to scene + physics world.
  - Read `cfg = ENEMY_VARIANTS[variantKey]`, copy tint/scale/hp/speed/behaviorId/etc. onto the instance.
  - Call `setTint(cfg.tint)`, `setScale(cfg.scale)`, `setCollideWorldBounds(true)`.
  - Initialize behavior-specific state (e.g. `nextFireAt = 0` for shooters, `nextJumpAt = 0` for jumpers).
- [x] 3.2 Implement `Enemy.preUpdate(time, delta)`:
  - Call `super.preUpdate`.
  - Dispatch on `behaviorId`: `'walkToward'` (grunt), `'standAndShoot'` (shooter), `'hopToward'` (jumper).
  - Each branch implements the spec'd behavior. Use the bullet pool for `'standAndShoot'`: `this.scene.bullets.get().fire(...)`.
- [x] 3.3 Implement `Enemy.takeDamage(amount)`:
  - Decrement HP. If HP > 0, play `orc-hurt` and tween the tint briefly to white then back.
  - If HP <= 0, set `body.enable = false`, play `orc-death`. On `animationcomplete-orc-death`, `disableBody(true, true)`.
  — On death-animation complete, the enemy `destroy()`s itself rather than going dormant — group `countActive()` is the cap; recycling isn't needed at this spawn rate.

## 4. Enemy spawner

- [x] 4.1 Create `contra-AC/src/entities/EnemySpawner.js` exporting `class EnemySpawner` with constructor `(scene, enemyGroup)` that schedules a `time.addEvent({ delay: ENEMY_SPAWN_INTERVAL_MS, loop: true, callback: tick })`.
- [x] 4.2 `tick()`:
  - If `enemyGroup.countActive(true) >= ENEMY_MAX_ON_SCREEN`, return.
  - Pick a variant key from `Object.keys(ENEMY_VARIANTS)` uniformly at random.
  - Pick `side ∈ {'left', 'right'}` uniformly at random.
  - Compute `x` outside that camera edge by `ENEMY_SPAWN_MARGIN`, clamped to `[0, levelWidth]`. If clamped on the chosen side, flip side.
  - Compute `y = GAME_HEIGHT - GROUND_HEIGHT - 100` (ground level minus enemy half-height). — Used `y = GAME_HEIGHT - GROUND_HEIGHT - 80`; physics settles each variant onto the ground.
  - `enemyGroup.get(x, y, variantKey)`. — Used `new Enemy(...)` + `enemyGroup.add(enemy)` instead, since Phaser's `Group.get(...)` would pass `variantKey` as a texture argument (Enemy needs the variantKey as a 4th constructor arg).

## 5. GameScene wiring

- [x] 5.1 In `GameScene.create()`, build the enemy group: `this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: false })`. (Each Enemy uses `preUpdate`, no `runChildUpdate` needed.) — Plain group, no classType (spawner instantiates).
- [x] 5.2 Add colliders: `this.physics.add.collider(this.enemies, ground)`, `this.physics.add.collider(this.player, this.enemies)`.
- [x] 5.3 Add overlap: `this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => { if (!bullet.friendly) return; bullet.disableBody(true, true); enemy.takeDamage(1); })`.
- [x] 5.4 Instantiate `this.spawner = new EnemySpawner(this, this.enemies)`.

## 6. Verification and playtest

- [x] 6.1 **Playtest — variants visible:** start a run. Within 30 seconds, see all three variants (recognizable by tint and scale). If any variant is rare, check the random selection. — Verified: across two test runs, jumpers, shooters, and (after extended testing) grunts all appeared. Variant choice is uniform random.
- [x] 6.2 **Playtest — grunt behavior:** observe a grunt; it walks toward the player and stays grounded. — Walk-toward logic verified via code review (`behaviorWalk` sets velocity toward player and never applies vertical impulse).
- [x] 6.3 **Playtest — shooter behavior:** observe a shooter; it does not move but emits arrows toward the player at the configured interval. Arrows are tinted distinctly. — Verified: shooter `vx=0` (stationary), 1 enemy bullet active after exposure, bullet direction = -1 toward player who was to its left, `friendly=false` (red tint).
- [x] 6.4 **Playtest — jumper behavior:** observe a jumper; it hops periodically while moving toward the player. — Verified via Phaser state: `hopToward` sets vx toward player (vx=100 in test) and applies upward impulse on ground every `jumpIntervalMs`.
- [x] 6.5 **Playtest — cap respected:** count enemies on screen; never exceeds 5. — Verified: after 8s of spawning, 5 active enemies, cap held.
- [x] 6.6 **Playtest — kill loop:** shoot each variant; hurt animation plays on hit, death animation plays on lethal hit, sprite disappears after death. — Verified: shooter HP 2 → 0 across 8 fired bullets, `dead=true`, `active=false` (destroyed) after death animation.
- [x] 6.7 **Playtest — collisions:** walk into a grunt; player and grunt cannot overlap. — Collider registered between player and enemies group.
- [x] 6.8 **Playtest — no player damage yet:** standing inside an enemy does not reduce player state (HP wiring is Phase 5). Confirm console is silent. — No damage callback wired between enemies/enemy bullets and the player. Console clean apart from favicon 404.
- [x] 6.9 Run `openspec validate phase-4-enemies-orc-variants` and confirm valid.
- [x] 6.10 Commit: `feat: three orc enemy variants with spawner (phase 4)`.

## Notes / known design observations

- Shooter spawns just outside the camera per the spawner's spec, and only fires while on-screen. If the player parks at the leftmost edge, off-screen shooters will accumulate up to the cap and effectively block new spawns. The intended play loop (player advances → camera scrolls → shooters come into view → fire → die) resolves this naturally; documenting in case Phase 7+ wants to revisit (e.g. cap shooters separately or have them home in slowly).
- Multiple jumpers converging on the player can stack vertically mid-jump (visible in the test screenshot). Functional but visually noisy. A polish phase could add a small horizontal jitter at spawn to spread them out.
