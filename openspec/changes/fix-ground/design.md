## Context

`grass tileset.png` is a 384×128 atlas. Reading it at high resolution with a labeled 16×16 grid (24 cols × 8 rows = 192 frames):

- **Cols 0-7 (frames where col < 8)**: the actual atlas — flat grass-top tiles, dirt fill, slopes, end-caps, decorations.
- **Cols 8-23 (frames where col ≥ 8)**: a complete level-mockup demo with signs, crates, flowers, trees.

Phase 2 took a shortcut and used `load.image` + `add.tileSprite(0, y, levelWidth, GROUND_HEIGHT, 'grass-tileset')` — that tiles the whole bitmap horizontally. Every 384 px the player sees a chunk of the demo: signs, floating platforms, trees. Functionally correct (collision body matches the visual rect), but visibly wrong.

Reading the labeled grid at 4× scale, the cleanest pieces for a flat ground are:
- Frame **1** (col 1, row 0): grass-top — green grass strip across the top of the cell with dirt below. Reads as a flat ground edge when tiled horizontally.
- Frame **5** (col 5, row 0): solid dirt fill — no grass, no decoration. Tiles cleanly in both axes for the body of the ground.

(Frame 0 is transparent/blank, which is why the original Phase 2 attempt to load as a 16×16 spritesheet and use frame 0 produced an invisible ground — the experience that drove the team to fall back to `load.image`.)

## Goals / Non-Goals

**Goals:**
- The visible ground reads as "flat grass on top of dirt" across all three screens.
- No demo-mockup content visible anywhere in the playfield.
- Collision and level dimensions are unchanged; the player physics body still rests on the same Y as before.
- Tile indexes are named in `config.js` so a designer can pick different tiles without diving into scene code.

**Non-Goals:**
- No tilemap, no per-cell variety, no slopes/pits.
- No new art, no asset edits.
- No change to `GROUND_HEIGHT`, level width, camera bounds, or the ground physics body.

## Decisions

### Decision 1: Two `TileSprite`s, not a tilemap

**Choice:** Render the ground as exactly two `TileSprite` objects:
1. Top row: `add.tileSprite(0, groundTopY, levelWidth, TILE_SIZE, 'grass-tileset', GROUND_TILE_TOP)` — tiles the grass-top cell across the level width.
2. Body: `add.tileSprite(0, groundTopY + TILE_SIZE, levelWidth, GROUND_HEIGHT - TILE_SIZE, 'grass-tileset', GROUND_TILE_DIRT)` — tiles the dirt cell horizontally and vertically across the remaining height.

**Why:**
- Two GameObjects vs. potentially `levelWidth/16` per-tile sprites — way fewer scene-graph entries.
- Phaser's `TileSprite` accepts a `frame` arg when the texture is a spritesheet. Using a single frame collapses the source down to one cell; tiling repeats just that cell.
- A full tilemap would let us add platforms/pits later, but that's speculative right now and the existing collision body wouldn't transfer cleanly. Defer.

**Alternatives considered:**
- *One TileSprite with a single combined "ground" frame.* No such frame exists in this atlas — the grass-top and dirt are different cells. Combining would mean creating a new image asset, which the rules forbid.
- *Phaser tilemap (`tilemap.layer`).* Right tool for variety, overkill for "uniform grass strip across 3 screens".

### Decision 2: Reload the tileset as a spritesheet

**Choice:** `BootScene.preload`: change `this.load.image('grass-tileset', ...)` to `this.load.spritesheet('grass-tileset', '...', { frameWidth: 16, frameHeight: 16 })`.

**Why:**
- `TileSprite` with a frame arg requires the texture to be a spritesheet (or at least registered with frame data). Loading as `image` gives the texture exactly one frame (`__BASE`), and passing a numeric frame index falls back to that single frame — which is the whole bitmap, hence the original bug.
- 16×16 is the tile size verified against the visible atlas content: every visual boundary in cols 0-7 lands on a 16-pixel grid.

### Decision 3: Tile indexes go in `config.js`, not literals in the scene

**Choice:** Add `TILE_SIZE = 16`, `GROUND_TILE_TOP = 1`, `GROUND_TILE_DIRT = 5` to `config.js`. `GameScene` imports and uses them.

**Why:**
- Consistent with every other tunable in this codebase. A designer who wants to swap `GROUND_TILE_TOP` to a different grass variant (frame 73 or 97 in this atlas) can edit one line in `config.js`.
- The chosen frames are not "obvious" — explaining them in a comment next to the constant declaration is much cleaner than burying them in `GameScene`.

### Decision 4: Ground physics body stays as the existing invisible `Rectangle`

**Choice:** No change to the `groundBody` setup in `GameScene`. The visual swap doesn't touch collision.

**Why:**
- The body is independent of the visual. A player physics test against the body produces the same outcome before and after the visual fix.
- Reduces blast radius of the change: if the visual still looks off, we know it's a frame-index choice, not a physics regression.

## Risks / Trade-offs

- **Wrong frame indexes** → easy to confirm via screenshot, easy to swap in `config.js`. The grid PNG that drove this analysis (rendered at 4× with frame numbers) is at `/tmp/tileset-probe/grid-16.png` while debugging; a designer can re-run the snippet in this proposal to regenerate it.
- **Visual seams between top-row TileSprite and body TileSprite** → both are tiled from the same source image with no scaling, so vertical alignment at y = `groundTopY + TILE_SIZE` should be pixel-clean. Mitigation: integer Y coordinates only, no fractional offsets.
- **Phaser texture filtering** → if anti-aliasing is on, 16×16 tiles scaled by `Scale.FIT` could blur. The Phaser game config doesn't currently set `pixelArt: true`. Out of scope for this fix; the existing canvas already lives without it. If blur is unacceptable in playtest, that's a separate one-line fix in `main.js`.

## Migration Plan

Two-file diff (BootScene + GameScene) plus three constants. No data migration. Rollback = revert.

## Open Questions

- **Could a slightly different grass-top tile look better?** Frames 1, 2, 3 all look like grass-top variants in the atlas. I picked 1 as the most centered/symmetric. If a playtester finds it looks too repetitive, swap to 2 or alternate them with a tilemap (out of scope here).
