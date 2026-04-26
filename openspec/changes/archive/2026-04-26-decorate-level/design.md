## Context

After `fix-ground` switched the ground to atlas-based tiles, the level reads correctly but feels empty — it's a 3-screen sliding-grass loop. The same atlas (`grass-tileset.png`, 16×16 spritesheet) has unused decoration cells visible when the atlas section (cols 0-7) is rendered at high zoom:

| Frame | Content | Opaque pixels (shape size cue) |
|---|---|---|
| 125 | Flower (white blossom on green stem) | 116 |
| 126 | Small bush (round green) | 144 |
| 145 | Wooden crate | 244 |
| 148 | Sign post (white panel) | 174 |
| 149 | Bush (round green, larger) | 204 |
| 150 | Tree (rounded triangular) | 186 |

This change pulls 5 of those (skipping crate — its silhouette implies "stand on me" which we don't support) and scatters them across the level.

## Goals / Non-Goals

**Goals:**
- ~12-14 decorations spread across the 2880-px level so each screen has visual variety.
- Decorations sit visually on the grass surface (bottom at the grass line) and render behind the player.
- Designer can edit one array in `config.js` to add/remove/reposition decorations without touching scene code.
- No physics body anywhere on decorations.

**Non-Goals:**
- No collidable props (the level stays flat).
- No multi-tile decorations.
- No randomization at runtime — positions are hardcoded for reproducibility (a designer can tweak one source-of-truth array).
- No parallax background. No sky variation.

## Decisions

### Decision 1: Decoration data lives in `config.js` as `DECORATIONS = [{ x, frame }]`

**Choice:** A flat array of `{ x, frame }` entries. The Y position and scale are computed at render time from `GAME_HEIGHT - GROUND_HEIGHT` and `DECORATION_SCALE` respectively. Width-extent isn't tracked because they're single-tile sprites placed by their bottom-center anchor.

**Why:**
- Simplest possible data shape. Adding/removing decorations is a one-line edit.
- Y-from-ground is automatic so a designer never has to recalculate when ground height changes.
- Per-decoration scale or tint can be added later by extending the entry shape (`{ x, frame, scale?, tint? }`) without breaking existing entries.

**Alternatives considered:**
- *Encode positions inline in GameScene.* Mixes data with rendering code — every position tweak is a scene edit. Rejected on the same convention that put every other tunable in `config.js`.
- *External JSON file (`decorations.json`).* Overkill for ~14 items and adds a `fetch`/load step the project doesn't have anywhere else.

### Decision 2: Single shared scale, not per-decoration

**Choice:** `DECORATION_SCALE = 2`. All decorations render at 32×32 displayed px (16×16 source × 2).

**Why:**
- The whole world is 100×100 character sprites at scale 1.0–1.1, ground tiles are 16×16 at scale 1.0, and screens are 960 wide. A 16-px decoration at scale 1 is barely visible; at scale 2 it reads as "thing on the ground"; at scale 3+ it starts to compete with the player visually. 2 is the readable middle.
- If we ever want a tall tree, scale-2 still keeps it under 32 px — under the player's height.
- One constant means the level reads consistently. Per-decoration scale would invite "this tree is 4×, this flower is 1×" inconsistency.

### Decision 3: Render after ground tiles, before player

**Choice:** In `GameScene.create`, the placement loop runs immediately after the two ground `tileSprite` calls and before `this.player = new Player(...)`. Phaser respects insertion order for depth, so decorations end up behind the player.

**Why:**
- Standard side-scroller layering: ground → background props → entities → bullets → HUD.
- Putting decorations before the player means the player runs IN FRONT of trees/bushes — readable.
- Putting decorations before the ground would hide them under the grass tile.

### Decision 4: Decorations' bottom-center sits on the grass-tile top

**Choice:** Use `setOrigin(0.5, 1)` — origin at bottom-center. Set the decoration's y to `GAME_HEIGHT - GROUND_HEIGHT` (the world Y of the grass surface). At scale 2 with origin (0.5, 1), the decoration's bottom edge lands exactly on the grass.

**Why:**
- Decorations of varying source heights all "stand" on the same grass line without per-entry Y math.
- If a future variant uses a 1×2 source tile (e.g., a tall tree), the same `setOrigin(0.5, 1)` still anchors it correctly.

### Decision 5: 12-14 decorations spread roughly every 200 px

**Choice:** A hand-tuned list with one of each variant per screen-equivalent (~960 px), totalling 12–14 entries across 2880 px. Mix: ~4 trees, ~3 bushes, ~2 small bushes, ~3 flowers, ~1 sign.

**Why:**
- Density: ≥1 every 250 px so a player walking through always has something on screen, not so dense the level feels cluttered.
- Variety: roughly one of each kind per screen, so the level reads as a coherent landscape rather than a single repeated motif.
- Single sign (148): too many signs would imply directional gameplay (which we don't have) or too much UI text. One sign is a flavor item.

## Risks / Trade-offs

- **Decorations look too small at scale 2** → easy fix in `config.js` (`DECORATION_SCALE = 3`); but the player sprite (~30 px tall visible) shouldn't be dwarfed.
- **Decoration overlapping the goal marker at the right edge** → goal sits at x = `levelWidth - 24`. Last decoration position should stay below x=2700 so it doesn't sit under the goal flag. Mitigation: hand-tuned positions.
- **Player visually walks "through" trees** → expected. We don't sort depth per-decoration. Trees aren't tall enough at scale 2 to make this read as wrong (they're chest-high to the player's sprite).
- **Future per-decoration polish (tint, scale, mirror)** → not included now. The data shape allows additive fields; adding them later is a config-only change.

## Migration Plan

Two-file diff. No data migration. Rollback = revert.

## Open Questions

- **Should decorations be slightly randomized in Y for variety?** Not for now — flat ground reads as flat ground. If "trees stand on a slight mound" is wanted later, it's a per-decoration `yOffset` field on the entry shape, no scene change needed.
- **Are crates (frame 145) really off the table?** They look like they should be standable. Adding them now would either visually mislead the player ("can I jump on this?") or require collision boxes. Keep them out of this fix; revisit if a Phase 9+ adds destructible/standable props.
