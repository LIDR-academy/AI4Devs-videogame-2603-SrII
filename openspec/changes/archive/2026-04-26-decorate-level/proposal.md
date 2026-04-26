## Why

The level is now correctly tiled (clean grass on dirt) but it's a 3-screen long, perfectly empty strip — visually flat. The atlas has obvious decoration tiles we're not using: trees, bushes, flowers, signs. Pulling them in adds visual variety with zero gameplay impact, no new assets, and stays inside the project's "no new art" rule.

## What Changes

- Scatter **single-tile decorations** from the existing `grass-tileset` atlas across the level surface: trees (frame 150), bushes (149, 126), flowers (125), and a sign (148). Approximately 12-14 placements across the 3-screen level so players see something different per screen.
- Decorations render **between the ground and the player layer** so the player runs in front of them — standard side-scroller stack. They are pure `Image` GameObjects with no physics body.
- Decoration positions and frame indices live in `config.js` as a `DECORATIONS` array of `{ x, frame }` entries. Y is computed from the ground line so the bottom of each decoration sits on the grass surface. Scale is one shared `DECORATION_SCALE = 2` so 16-px source tiles render at 32 px (readable against the 64-px-tall ground).
- No collisions, no gameplay change, no spec deltas to existing capabilities.

## Capabilities

### New Capabilities
- `level-decoration`: the configurable list of foreground props, the rendering pass that places them on the grass line, and the rendering-order invariant (behind player, in front of ground).

### Modified Capabilities
<!-- None — adds a new capability rather than altering player-movement / enemies / etc. -->

## Impact

- **Files changed:** `contra-AC/src/config.js` (add `DECORATIONS` array + `DECORATION_SCALE`), `contra-AC/src/scenes/GameScene.js` (~6 lines of decoration-placement loop after the ground tiles).
- **No new files, no asset changes, no API changes.**
- **Performance:** ~14 static `Image` objects, no physics — negligible.
- **Out of scope:**
  - No collidable decorations (no "stand on a crate"); the level stays flat-ground-only as Phase 2 intended.
  - No multi-tile decorations (e.g. tall trees made of 1×2 tiles). Single-tile only — keeps the placement loop trivial.
  - No background parallax layer (mountains, sky variation). Sky stays a flat color.
  - No tinting variation per decoration. Designer can tweak in a follow-up.
