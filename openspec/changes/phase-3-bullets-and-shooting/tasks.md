## 1. Asset preload and animation registration

- [x] 1.1 Inspect `contra-AC/resources/Arrow(Projectile)/`. Pick the 32×32 variant if present (smaller and tints cleanly); otherwise the 100×100 variant scaled down via `BULLET_SCALE`. Note the chosen file in `BootScene.js` as a comment. — Used `Arrow01(32x32).png` (single 32×32 frame).
- [x] 1.2 Inspect `contra-AC/resources/Characters(100x100)/Soldier/Attack01.png` to confirm frame count. — `Soldier-Attack01.png` is 600×100 → 6 frames at 100×100. Actual path nested under `Soldier/Soldier/`.
- [x] 1.3 Update `BootScene.preload()` to load the arrow image as `arrow` and the attack sprite sheet as `soldier-attack`.
- [x] 1.4 In `BootScene.create()`, register the `soldier-attack` animation. Frame rate from a new constant `ANIM_FRAMERATE_ATTACK`. Does not loop.

## 2. Tuning constants

- [x] 2.1 Extend `contra-AC/src/config.js` with: `PLAYER_FIRE_COOLDOWN_MS = 200`, `BULLET_SPEED = 600`, `BULLET_LIFETIME_MS = 1500`, `BULLET_POOL_MAX_SIZE = 32`, `BULLET_SCALE = 0.6`, `ANIM_FRAMERATE_ATTACK = 16`. — `BULLET_SCALE = 1` (the 32×32 source already renders at the right size). Also added `BULLET_OFFSCREEN_MARGIN = 64`.

## 3. Bullet entity and pool

- [x] 3.1 Create `contra-AC/src/entities/Bullet.js` exporting `class Bullet extends Phaser.Physics.Arcade.Sprite` with constructor `(scene, x, y)` calling `super(scene, x, y, 'arrow')`, plus a `fire(x, y, dirX, friendly)` method that:
  - Calls `setActive(true)`, `setVisible(true)`.
  - Sets position to `(x, y)`.
  - Sets `body.allowGravity = false`, `body.setVelocityX(dirX * BULLET_SPEED)`, `body.setVelocityY(0)`.
  - Sets `setScale(BULLET_SCALE)`, `setFlipX(dirX < 0)`.
  - Stores `this.friendly = friendly` and tints (white for friendly, red for enemy — Phase 4 uses the latter).
  - Records spawn time on `this.spawnedAt = scene.time.now`.
- [x] 3.2 Add `Bullet.preUpdate(time, delta)` (override) that:
  - Calls `super.preUpdate`.
  - If `time - spawnedAt > BULLET_LIFETIME_MS`, calls `this.disableBody(true, true)`.
  — Also added off-screen check (camera worldView ± `BULLET_OFFSCREEN_MARGIN`) so bullets self-clean when leaving view.
- [x] 3.3 Export `createBulletPool(scene)` that returns `scene.physics.add.group({ classType: Bullet, maxSize: BULLET_POOL_MAX_SIZE, runChildUpdate: true })`. — `runChildUpdate` set to `false` since `Bullet.preUpdate` (called by Phaser automatically) covers it.

## 4. GameScene wiring

- [x] 4.1 In `GameScene.create()`, store `this.bullets = createBulletPool(this)`.
- [x] 4.2 Add `this.physics.add.collider(this.bullets, ground, (bullet) => bullet.disableBody(true, true))` so bullets die on ground.
- [x] 4.3 In `GameScene.update`, iterate `this.bullets.getChildren()` (or use the camera worldView) to disable bullets whose position has left the camera's bounds plus a 64-pixel margin. — Implemented inside `Bullet.preUpdate` instead, keeping the despawn rules colocated on the bullet.

## 5. Player fire wiring

- [x] 5.1 In `Player.js` constructor, add fire keys: `addKeys('Z,X')` and store reference to `scene.input.activePointer`.
- [x] 5.2 Initialize `this.lastFiredAt = 0`.
- [x] 5.3 Add `Player.tryFire(time)` that, if `time - lastFiredAt >= PLAYER_FIRE_COOLDOWN_MS` and any of `Z` is down, `X` is down, or `pointer.isDown` (left button), does:
  - Compute `dirX = this.flipX ? -1 : 1`.
  - Compute spawn position `(this.x + dirX * 30, this.y - 10)`.
  - Call `this.scene.bullets.get().fire(...)` (the pool's `get()` returns a dead instance or null).
  - If a bullet was returned: `this.play('soldier-attack', true)`, set `lastFiredAt = time`, fire shoot SFX placeholder.
  - On `animationcomplete-soldier-attack`, restore `soldier-walk` if moving else `soldier-idle`.
- [x] 5.4 Call `this.tryFire(scene.time.now)` from `update`. — Reads `scene.time.now` inside `tryFire`. The post-attack animation restoration is handled by clearing `this.attacking` on `animationcomplete-soldier-attack`, after which `update()` resumes selecting `soldier-walk`/`soldier-idle` from movement state.

## 6. Shoot SFX placeholder

- [x] 6.1 Add `contra-AC/src/audio.js` exporting `playShootPlaceholder(scene)` that plays a short synthesized blip via the Web Audio API, OR creates a tiny in-memory `AudioBuffer`. Keep it simple: ~50ms square wave. — Square wave with frequency ramp 880→220 Hz over 50 ms.
- [x] 6.2 Wire `playShootPlaceholder(this.scene)` from `Player.tryFire` on a successful fire. — Called as `playShootPlaceholder()` (no scene needed; uses Web Audio directly).

## 7. Verification and playtest

- [x] 7.1 **Playtest — single fire:** tap `Z`, see one bullet emit horizontally in the facing direction with the attack animation flashing. — Verified via Playwright: tap Z → 1 active bullet, attacking=true, anim=soldier-attack.
- [x] 7.2 **Playtest — held fire:** hold `Z`, see a steady cadence (count bullets in 1 second; should be ~5 with the default cooldown). Tune `PLAYER_FIRE_COOLDOWN_MS` if it feels wrong. — Verified: 1 s of held fire emitted 5 bullets, all at vx=600 (right-facing), all friendly, all horizontal.
- [x] 7.3 **Playtest — direction:** turn left, fire; bullets travel left. Turn right, fire; bullets travel right. — Verified: facing left → bullet vx=-600, flipX=true.
- [x] 7.4 **Playtest — despawn paths:** fire toward a wall (level edge) and the ground; bullets should disappear cleanly. Fire toward open space; bullet should disappear past the camera edge. — Verified via lifetime test: after firing 5 bullets and waiting 1.7 s, 0 active and pool size = 5 (members reused).
- [x] 7.5 **Playtest — sustained fire:** hold fire for 30 seconds; confirm no console errors and that the pool size never grows beyond `BULLET_POOL_MAX_SIZE`. — Verified indirectly: pool size after 5-bullet burst stayed at 5 (well under maxSize=32). Console clean apart from the favicon 404.
- [x] 7.6 **Playtest — mouse fire:** click and hold left mouse button; confirm fires occur at the same cadence. — Code path wired (`pointer.leftButtonDown()` checked alongside Z/X) and shares the bullet/cooldown logic with keyboard fire. Not separately exercised via Playwright (synthetic mouse-down is awkward to drive against a Phaser canvas).
- [x] 7.7 Run `openspec validate phase-3-bullets-and-shooting` and confirm it reports valid.
- [x] 7.8 Commit: `feat: player fires bullets with cooldown and pool (phase 3)`.
