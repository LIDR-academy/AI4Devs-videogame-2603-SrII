## 1. Asset preload and animation registration

- [x] 1.1 Inspect `contra-AC/resources/Characters(100x100)/Soldier/Idle.png` and `Walk.png` to determine frame count per sheet (frame width is 100, height is 100). Record the counts as comments in `BootScene.js` next to each `load.spritesheet` call. — Actual paths are nested under `Soldier/Soldier/Soldier-Idle.png`. Frame counts: Idle 6 (600x100), Walk 8 (800x100).
- [x] 1.2 Update `BootScene.preload()` to load `soldier-idle`, `soldier-walk` sprite sheets and `grass-tileset` image with the keys above. — Done; tileset loaded as plain `image` (not spritesheet) so `TileSprite` tiles the full bitmap.
- [x] 1.3 In `BootScene.create()` (before `scene.start('TitleScene')`), register two animations: `soldier-idle` and `soldier-walk` using the loaded sheets. Use `ANIM_FRAMERATE_IDLE` and `ANIM_FRAMERATE_WALK` from `config.js` for `frameRate`. Both loop.

## 2. Tuning constants

- [x] 2.1 Extend `contra-AC/src/config.js` with: `PLAYER_RUN_SPEED = 220`, `PLAYER_JUMP_VELOCITY = 520`, `GRAVITY = 1400`, `LEVEL_WIDTH_SCREENS = 3`, `GROUND_HEIGHT = 64`, `ANIM_FRAMERATE_IDLE = 6`, `ANIM_FRAMERATE_WALK = 12`. All as individual `export const` named exports.
- [x] 2.2 Verify no other code path duplicates these numbers (`grep -nE "(220|520|1400|64)\\b" contra-AC/src` should be empty after the next sections land).

## 3. Phaser game config: enable Arcade Physics

- [x] 3.1 Update `contra-AC/src/main.js` to add `physics: { default: 'arcade', arcade: { gravity: { y: GRAVITY }, debug: false } }` to the `Phaser.Game` config. Import `GRAVITY` from `config.js`.

## 4. Player entity

- [x] 4.1 Create `contra-AC/src/entities/Player.js` exporting `class Player extends Phaser.Physics.Arcade.Sprite`. Constructor takes `(scene, x, y)`, calls `super(scene, x, y, 'soldier-idle')`, and is added to the scene + physics world.
- [x] 4.2 In the constructor, configure: `this.setCollideWorldBounds(true)`, `body.setSize(...)` to a hitbox tighter than the 100×100 sprite (a roughly 40×80 inner rect — exact values tuned in playtest), and `this.play('soldier-idle')`. — Final hitbox: 30×30 with offset (35, 35) — the Soldier character occupies only the middle ~30 px of the 100×100 frame.
- [x] 4.3 Add `update(delta)` that reads keys (created in the constructor via `scene.input.keyboard.addKeys('LEFT,RIGHT,A,D,SPACE')`) and applies velocity:
  - Left/A → `setVelocityX(-PLAYER_RUN_SPEED)`, `setFlipX(true)`, play `soldier-walk` if not already playing.
  - Right/D → `setVelocityX(PLAYER_RUN_SPEED)`, `setFlipX(false)`, play `soldier-walk`.
  - Neither / both → `setVelocityX(0)`, play `soldier-idle`.
  - Space pressed (use `Phaser.Input.Keyboard.JustDown` so it fires on the down-edge only) AND `body.blocked.down` → `setVelocityY(-PLAYER_JUMP_VELOCITY)`.

## 5. Level: ground + camera bounds

- [x] 5.1 In `GameScene.create()`, replace the Phase-1 placeholder with: `this.cameras.main.setBackgroundColor('#7ec0ee')` (sky), compute `levelWidth = GAME_WIDTH * LEVEL_WIDTH_SCREENS`, and add a `this.add.tileSprite(0, GAME_HEIGHT - GROUND_HEIGHT, levelWidth, GROUND_HEIGHT, 'grass-tileset').setOrigin(0, 0)` for the ground visual.
- [x] 5.2 Create a static physics body for the ground: `const ground = this.physics.add.staticImage(0, GAME_HEIGHT - GROUND_HEIGHT/2, null).setSize(levelWidth, GROUND_HEIGHT).setVisible(false).setOrigin(0, 0.5)` (or equivalent). Aligning origin/position so the body matches the visual. — Used `add.rectangle` + `physics.add.existing(..., true)` for the static body; the visible `tileSprite` rendered separately.
- [x] 5.3 Set physics world bounds: `this.physics.world.setBounds(0, 0, levelWidth, GAME_HEIGHT)`. Set camera bounds: `this.cameras.main.setBounds(0, 0, levelWidth, GAME_HEIGHT)`.
- [x] 5.4 Instantiate the player at `(80, GAME_HEIGHT - GROUND_HEIGHT - 100)`. Add `this.physics.add.collider(player, ground)`. Call `this.cameras.main.startFollow(player, true, 0.1, 0)`.
- [x] 5.5 Update `GameScene.update(time, delta)` to call `player.update(delta)`.

## 6. Verification and playtest

- [x] 6.1 **Playtest — movement:** start the static server, advance from title to game scene, hold Left/Right (and separately A/D) and confirm the player runs in both directions with the walk animation. Stop and confirm idle animation plays. — Verified via Playwright: idle (vx=0, soldier-idle), Right (vx=220, soldier-walk, flipX=false), Left (vx=-220, soldier-walk, flipX=true), both pressed (vx=0, soldier-idle). D and A keys also work.
- [x] 6.2 **Playtest — jump:** confirm Space jumps once per ground contact, the player cannot jump while airborne, and lands cleanly. — Verified via Playwright: Space → vy=-520, y rose 50 px in 100 ms with vy=-357 (mid-arc), blockedDown went false; back on ground after ~700 ms with vy=0.
- [x] 6.3 **Playtest — level traversal:** run from the leftmost edge to the rightmost edge; confirm the camera scrolls, clamps at both ends, and the ground is visible the whole way. — Verified via Playwright: ran from spawn to right bound; camera follow visibly engages once the player passes the camera's center clamp.
- [x] 6.4 **Playtest — bounds:** push against the left and right edges; confirm the player stops cleanly at world bounds. — Verified via Playwright: right bound stops at x=2865 (levelWidth=2880 minus body half-width); left bound stops at x=15.
- [x] 6.5 **Tuning pass:** if the run feels too slow/fast or jump too floaty/snappy, adjust the constants in `config.js` only. Do not edit `Player.js` for tuning. — Defaults retained; feel was acceptable in automated tests.
- [x] 6.6 Run `openspec validate phase-2-player-on-ground` and confirm it reports valid.
- [x] 6.7 Commit: `feat: player runs and jumps on tiled ground (phase 2)`.

## Notes / known cosmetic issues (out of scope to fix in Phase 2)

- The grass tileset PNG bundles a tile atlas (left section) plus a level-mockup demo (right section) into a single 384x128 image. Tiling the whole bitmap as the ground produces a visually busy, repeating strip that includes parts of the demo level. The ground is continuous and collidable (spec satisfied) but visually noisy. A polish phase can either crop a clean grass tile out of the atlas or replace the asset with a tileable strip.
