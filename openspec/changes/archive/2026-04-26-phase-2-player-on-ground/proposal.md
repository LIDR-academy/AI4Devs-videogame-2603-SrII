## Why

Phase 1 ships an empty Phaser shell with a placeholder `GameScene`. Without a controllable player on a real ground, none of the gameplay phases (combat, enemies, damage, win condition) can be meaningfully built or tested. Phase 2 of `contra-AC/roadmap.md` adds the first real gameplay primitive: a Soldier that runs, jumps, and exists in a level wider than one screen.

This change also forces the project to confront its first asset-loading workflow (sprite sheets and tileset) and its first physics tuning, both of which Phases 3–8 will reuse heavily.

## What Changes

- `BootScene` gains real preload work: it loads the Soldier sprite sheets (Idle, Walk) and the `grass tileset.png` from `contra-AC/resources/`, then hands off to `TitleScene`.
- `GameScene` builds a static ground from the grass tileset spanning `LEVEL_WIDTH_SCREENS = 3` screen widths, with a sky-colored background. The placeholder rectangle from Phase 1 is removed.
- New entity module `contra-AC/src/entities/Player.js` — a Phaser `Arcade.Sprite` subclass with gravity, a single ground-only jump, walk/idle animations, and left/right facing.
- A keyboard controller (inside `Player.js` or a small helper) reads arrow keys *and* WASD for horizontal movement, and `Space` for jump.
- The `GameScene` camera follows the player horizontally, clamped to level bounds.
- `src/config.js` gains: `PLAYER_RUN_SPEED`, `PLAYER_JUMP_VELOCITY`, `GRAVITY`, `LEVEL_WIDTH_SCREENS = 3`, plus animation framerate constants needed by the new sprite animations.

## Capabilities

### New Capabilities
- `player-movement`: the Soldier entity, its physics body, animations, input bindings, and the world (ground tiles + camera follow + level bounds) it moves through.

### Modified Capabilities
- `game-shell`: `BootScene` now preloads assets instead of being empty, and `GameScene` no longer renders a placeholder — it hosts the level and player. The constants module gains the Phase-2 tuning values listed above.

## Impact

- **New files:** `contra-AC/src/entities/Player.js`. A small `src/scenes/level.js` (or inline helper) for building the ground tile strip if `GameScene` itself gets too long.
- **Modified files:** `contra-AC/src/scenes/BootScene.js`, `contra-AC/src/scenes/GameScene.js`, `contra-AC/src/config.js`.
- **Assets used (read-only):** `contra-AC/resources/Characters(100x100)/Soldier/Idle.png`, `Walk.png`, and `contra-AC/resources/grass tileset.png`.
- **Physics:** Phaser Arcade Physics is enabled in the game config. World gravity is set from `GRAVITY`.
- **Constraints honored:** all changes still under `/contra-AC`; no build step; no new frameworks.
- **Out of scope:** no shooting (Phase 3), no enemies (Phase 4), no HP UI (Phase 5), no double-jump or crouch, no win/lose state.
