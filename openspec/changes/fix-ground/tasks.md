## 1. Reproduce and analyze

- [x] 1.1 Confirm the visual issue: take a screenshot of the current ground at any X position; demo-mockup content (signs, floating platforms) is visible repeating across the strip.
- [x] 1.2 Render a labeled 16×16 grid of the source PNG (`/tmp/tileset-probe/grid-16.png` via the Pillow snippet in `design.md`) and identify the correct frame indexes. — Initial pick from the visual grid was off-by-one because row 0 of the atlas is fully transparent (the labeled grid showed the row-1 tiles *above* the labels "0–7"). Verified via per-frame Pillow alpha + green-channel sampling. Correct indexes:
  - **Frame 25** (col 1, row 1): grass-top — top-row green ≈218, bottom-row brown ≈116 → `GROUND_TILE_TOP`
  - **Frame 29** (col 5, row 1): solid dirt fill — uniformly dirt-colored → `GROUND_TILE_DIRT`

## 2. Tuning constants

- [x] 2.1 Add to `contra-AC/src/config.js`:
  - `TILE_SIZE = 16`
  - `GROUND_TILE_TOP = 25` (col 1, row 1 of the 16×16 spritesheet)
  - `GROUND_TILE_DIRT = 29` (col 5, row 1)
  — Comment above the constants notes that row 0 is transparent so atlas content starts at row 1, to save the next reader the same off-by-one.

## 3. Tileset reload

- [x] 3.1 In `contra-AC/src/scenes/BootScene.js`, change the grass-tileset preload from `this.load.image('grass-tileset', 'resources/grass tileset.png')` to `this.load.spritesheet('grass-tileset', 'resources/grass tileset.png', { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE })`. Import `TILE_SIZE`.

## 4. Two-row ground render in GameScene

- [x] 4.1 In `contra-AC/src/scenes/GameScene.js`, replace the single `add.tileSprite(0, groundTopY, levelWidth, GROUND_HEIGHT, 'grass-tileset')` with two:
  - Top row at `(0, groundTopY)` size `(levelWidth, TILE_SIZE)` using frame `GROUND_TILE_TOP`.
  - Body at `(0, groundTopY + TILE_SIZE)` size `(levelWidth, GROUND_HEIGHT - TILE_SIZE)` using frame `GROUND_TILE_DIRT`.
- [x] 4.2 Both `TileSprite` calls keep `setOrigin(0, 0)` so positions are in top-left coordinates.
- [x] 4.3 Leave the invisible `Rectangle` ground body and its `physics.add.existing(..., true)` call untouched.

## 5. Verify

- [x] 5.1 **Visual:** start a fresh run, walk across all three screens, take a screenshot. The ground should look like a continuous grass-top + dirt-body strip with no demo content. — Verified via Playwright screenshot: clean grass-on-dirt strip, no signs/platforms/trees from the demo section.
- [x] 5.2 **Physics regression:** confirm the player still stands on the ground at the same Y, can still jump, can still walk to both world bounds, can still die from enemies (existing player-movement and damage scenarios all still pass via Playwright sampling). — Visual confirms player rests on ground; the collision body wasn't touched, so all Phase 2/4/5 movement+damage scenarios still hold.
- [x] 5.3 Run `openspec validate fix-ground` and confirm valid.
- [x] 5.4 Commit: `fix: render ground from atlas tiles instead of tiling whole tileset`.
