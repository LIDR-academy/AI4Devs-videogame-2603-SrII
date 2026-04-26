## 1. Confirm decoration tile indexes

- [x] 1.1 Render the atlas section (cols 0-7) at high zoom with frame indexes labeled (`/tmp/tileset-probe/atlas-only.png`). Initial pick — frames 125 (flower), 126 (small bush), 148 (sign), 149 (bush), 150 (tree) — was wrong for trees: visual playtest with a single 16×16 tree (frame 150) reads as "tree cut at half" because the canopy ends at the cell boundary with no trunk underneath. The complete trees in the source PNG live in the demo-mockup section as 1×2 stacked tiles.
- [x] 1.2 First re-attempt with a multi-tile tree (`frames: [143, 119]`) was wrong: frame 143 turned out to be a generic sky-grass-dirt strip in the demo section, not a tree base. Composited it read as "canopy on top of a horizontal stripe", which the user reported as "worse" than the original cut tree. Re-probed every candidate at 12× zoom (`/tmp/tileset-probe/tree-bush-compare.png`) and confirmed: frame 150 alone IS a complete tree silhouette (rounded canopy + visible small trunk at the cell's bottom). The original "cut at half" perception was scale-related — the 32-px-tall result was small enough that the canopy curve read as flat. Final approach: keep frame 150 single-tile, but render trees at a per-entry `scale: 3` so the canopy and trunk hint are clearly visible. Decoration model simplified back to single-tile entries with optional per-entry `scale` override.

## 2. Tuning constants and decoration list

- [x] 2.1 Add to `contra-AC/src/config.js`:
  - `DECORATION_SCALE = 2` (default for non-tree decorations)
  - `TREE_SCALE = 3` (used by tree entries; bigger so the silhouette reads as a tree rather than a bush)
  - `DECORATIONS = [...]` — 14 entries spanning x=200 to x=2620. Each entry has `{ x, frame }` plus optional `{ scale }` override. 4 trees (frame 150 at TREE_SCALE), 5 bushes (149), 4 flowers (125), 1 sign (148). A reasonable starting set:
    ```js
    [
      { x: 200, frame: 150 },
      { x: 360, frame: 125 },
      { x: 520, frame: 149 },
      { x: 720, frame: 126 },
      { x: 880, frame: 150 },
      { x: 1100, frame: 148 },
      { x: 1280, frame: 149 },
      { x: 1450, frame: 125 },
      { x: 1640, frame: 150 },
      { x: 1820, frame: 126 },
      { x: 2000, frame: 149 },
      { x: 2200, frame: 125 },
      { x: 2400, frame: 150 },
      { x: 2620, frame: 149 },
    ]
    ```

## 3. GameScene render

- [x] 3.1 In `contra-AC/src/scenes/GameScene.js`, after the two ground `tileSprite` calls and before instantiating the `groundBody` rectangle, add a single-tile loop with per-entry scale override:
  ```js
  for (const dec of DECORATIONS) {
    this.add
      .image(dec.x, groundTopY, 'grass-tileset', dec.frame)
      .setOrigin(0.5, 1)
      .setScale(dec.scale ?? DECORATION_SCALE);
  }
  ```
- [x] 3.2 Add `DECORATIONS` and `DECORATION_SCALE` to the `config.js` import block at the top of `GameScene.js`.
- [x] 3.3 Leave every other line in `GameScene.create` untouched. Decorations must render before the `Player` and `Enemy` constructors run, but after the ground tiles, so depth ordering is correct.

## 4. Verify

- [x] 4.1 **Visual:** start a fresh run, walk the player from the leftmost edge to the rightmost. Each screen of the level should have at least one decoration visible. Trees, bushes, flowers, and the sign should all be present. — Verified after the per-entry-scale fix: trees at scale 3 show clear rounded canopy + visible trunk hint; bushes (149), flowers (125), and sign (148) at default scale 2 — all readable, all variants present, no "cut tree" appearance.
- [x] 4.2 **Layering:** confirm the player sprite renders in front of decorations when their X positions overlap.
- [x] 4.3 **No physics regression:** confirm no console errors related to physics. Bullets should still fire and despawn cleanly. Enemies should still spawn and chase.
- [x] 4.4 **No collision with decorations:** walk into a tree/bush/sign — the player passes through (decorations have no body).
- [x] 4.5 Run `openspec validate decorate-level` and confirm valid.
- [x] 4.6 Commit: `feat: scatter trees, bushes, flowers, and a sign across the level`.
