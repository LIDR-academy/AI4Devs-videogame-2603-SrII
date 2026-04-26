## Why

Nothing runs in a browser yet — the project is just a roadmap, a CLAUDE.md, and provided art assets. Before any gameplay can be built (player movement, enemies, combat, win/lose), there must be a Phaser canvas that boots, shows a title, and transitions into a gameplay scene. Phase 1 of `contra-AC/roadmap.md` is the foundation every subsequent phase depends on.

This change ships the smallest possible runnable artifact: open `index.html` via a static server, see a title screen, press a key, land on an empty gameplay scene. It also locks in the project's structural choices (no build step, ES modules, Phaser via CDN, scene-per-screen, tuning constants centralized in `config.js`) so later phases inherit them.

## What Changes

- Add `contra-AC/index.html` as the single entry point. It loads Phaser 3 from CDN via a `<script>` tag and then loads `src/main.js` as an ES module.
- Add `contra-AC/styles.css` with minimal page chrome (centered canvas, dark background, no scrollbars).
- Add `contra-AC/src/main.js` that constructs the `Phaser.Game` config and registers the three scenes in order: `BootScene`, `TitleScene`, `GameScene`.
- Add `contra-AC/src/config.js` exporting tuning constants required by Phase 1: `GAME_WIDTH`, `GAME_HEIGHT`, `LEVEL_DURATION_SECONDS = 90`, `PLAYER_MAX_HP = 3`. (Later phases will append more constants here; they're declared now so the module exists and conventions are set.)
- Add three scene modules under `contra-AC/src/scenes/`:
  - `BootScene.js` — empty `preload`/`create` that immediately starts `TitleScene`. No assets are loaded yet (Phase 2 owns asset loading).
  - `TitleScene.js` — renders "CONTRA-AC" title text and a "Press any key to start" prompt; on any key down, starts `GameScene`.
  - `GameScene.js` — fills the canvas with a placeholder colored rectangle (to prove the scene is live) and shows a small "Game Scene (placeholder)" label.

## Capabilities

### New Capabilities
- `game-shell`: the always-on framework — Phaser game instance, scene registry, screen transitions, page chrome, tuning-config module — that hosts every gameplay capability added in later phases.

### Modified Capabilities
<!-- None — no specs exist yet. -->

## Impact

- **New code:** `contra-AC/index.html`, `contra-AC/styles.css`, `contra-AC/src/main.js`, `contra-AC/src/config.js`, `contra-AC/src/scenes/BootScene.js`, `contra-AC/src/scenes/TitleScene.js`, `contra-AC/src/scenes/GameScene.js`.
- **External dependency added:** Phaser 3 loaded from a public CDN (jsDelivr or unpkg) at a pinned version. No `package.json`, no `node_modules`.
- **Runtime:** users serve `contra-AC/` with any static file server (e.g. `python -m http.server`) and open `index.html`. No build, transpile, or install step.
- **Constraints honored:** all new files live under `/contra-AC`; no frameworks beyond Phaser 3 + pure CSS; no TypeScript; no bundler.
- **Sets conventions for later phases:** scene-per-screen, ES module imports, central `config.js`, file/folder layout from `CLAUDE.md`. Phase 2 onward will only need to add files, not restructure these.
- **Out of scope (explicit non-goals):** no asset loading, no player entity, no input beyond "any key advances title", no Game Over / Victory / Pause scenes, no HUD, no audio.
