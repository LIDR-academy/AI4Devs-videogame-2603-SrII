## Why

Phase 2 loaded `grass tileset.png` as a single image and tiled the whole 384×128 bitmap across the level width. The PNG is actually an atlas: cols 0-7 are individual 16×16 tiles, cols 8-23 are a fully-composed level-mockup demo. Tiling the entire bitmap means every screen of the ground includes random snippets of that demo (signs, floating platforms, trees) — visually busy and clearly wrong.

I noted this as a known cosmetic limitation in Phase 2's tasks.md and deferred fixing. The user's request now is to fix it: treat the image as a tileset and pick the right cells.

## What Changes

- Load `grass tileset.png` as a 16×16 spritesheet instead of a plain image.
- Build the visible ground from two tiled rows — one grass-top tile across the top 16 px, one dirt-fill tile across the remaining height. Replaces the single full-bitmap `TileSprite` with two narrow ones.
- The collision body, level width, and ground height all stay the same; only the visual changes.
- Add three named constants in `config.js`: `TILE_SIZE = 16`, `GROUND_TILE_TOP` (frame index of the grass-top tile), `GROUND_TILE_DIRT` (frame index of the dirt fill). The existing `GROUND_HEIGHT = 64` stays — that's exactly four 16-pixel tiles tall.

## Capabilities

### New Capabilities
<!-- None — visual fix only. -->

### Modified Capabilities
<!-- None — no requirement deltas. The existing `player-movement` requirement just says "a continuous, visible ground tile strip" exists; the strip stays continuous and visible, it just looks better. -->

## Impact

- **Files changed:** `contra-AC/src/scenes/BootScene.js` (one `load` call), `contra-AC/src/scenes/GameScene.js` (replace one tileSprite with two), `contra-AC/src/config.js` (three constants).
- **No new files, no asset changes.** The PNG itself is unchanged — we're just consuming it correctly.
- **No spec deltas.** The Phase 2 `player-movement` requirement "Level is `LEVEL_WIDTH_SCREENS` screens wide with a tiled ground" is already satisfied; we're improving the visual quality of an already-shipped capability.
- **Out of scope:** no full tilemap (no per-cell variety, no slopes, no pits). That's a follow-up if a Phase 9+ ever adds platforms or terrain. This fix is the smallest one that makes the ground readable.
