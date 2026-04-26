## Context

This is the very first change in the project: there is no source code yet, only `roadmap.md`, `CLAUDE.md`, and provided art under `contra-AC/resources/`. Phase 1 of the roadmap (`Bootstrap: empty game canvas runs in the browser`) is the foundation every subsequent phase builds on. The goal is to land the smallest runnable Phaser application *and* lock in the structural conventions (no build step, ES modules, scene-per-screen, central `config.js`) so later phases inherit them by default rather than negotiating them again.

Constraints that shape every decision:
- **No build step.** A static file server must be enough. No bundler, no transpiler, no `npm install`.
- **No frameworks beyond Phaser 3 + pure CSS.** No React, Tailwind, or TypeScript.
- **Code lives under `/contra-AC`.** Only `CLAUDE.md` and `/openspec` may sit at repo root.
- **Tuning constants live in `src/config.js`.** Even Phase 1 constants go through it.

## Goals / Non-Goals

**Goals:**
- A runnable `contra-AC/index.html` that boots Phaser and lands on a placeholder gameplay scene after a keypress on the title.
- Three thin scenes wired in order: `BootScene` → `TitleScene` → `GameScene`.
- A `config.js` module that already exports the Phase-1-relevant constants (`GAME_WIDTH`, `GAME_HEIGHT`, `LEVEL_DURATION_SECONDS`, `PLAYER_MAX_HP`) so later phases extend rather than introduce it.
- Folder layout matches `CLAUDE.md` exactly so Phase 2+ tasks just add files.

**Non-Goals:**
- No asset preloading. `BootScene` is intentionally empty in this phase.
- No player, enemies, projectiles, HUD, audio, or scoring.
- No `GameOverScene`, `VictoryScene`, or `PauseScene` (Phases 5–7 own those).
- No responsive scaling beyond Phaser's `Scale.FIT` — the canvas is a fixed logical size.
- No tests. Per `CLAUDE.md`, manual playtest is the test suite for the MVP.

## Decisions

### Decision 1: Phaser 3 via CDN `<script>` tag, not ES module import

**Choice:** Load Phaser from a pinned jsDelivr URL in `index.html` *before* `src/main.js`. `main.js` then references the global `Phaser`.

**Why:**
- Phaser 3 ships as a UMD bundle. Using `<script>` is the documented, frictionless path; loading it as an ES module would require either an ESM-only build or an import map, both of which add ceremony without value.
- Pinning the version (e.g. `phaser@3.80.1`) avoids silent breakage when the CDN updates.
- Keeps `main.js` short — no dynamic import, no module-resolution dance.

**Alternatives considered:**
- *Vendor `phaser.min.js` under `contra-AC/vendor/`.* Works offline but adds a ~1MB binary to git. User chose CDN at proposal time.
- *Import via `https://esm.sh/phaser`.* Works, but introduces a third-party rewriter in the dependency chain and slower cold loads.

### Decision 2: One ES module per scene, registered in `main.js`

**Choice:** Each scene is its own file under `src/scenes/`, exporting a class extending `Phaser.Scene`. `main.js` imports all three and passes them to the `scene` array on the `Phaser.Game` config.

**Why:**
- Mirrors the layout already prescribed by `CLAUDE.md`. Phase 2+ adds `PauseScene`, `GameOverScene`, etc., to the same array — no restructure.
- Scene-per-file keeps any one file small enough to read at a glance.
- Scenes are listed in the order they should run; `BootScene` is first so it auto-starts.

**Alternatives considered:**
- *Single-file scene definitions inside `main.js`.* Faster for Phase 1 but guaranteed to be ripped apart in Phase 2. Skip the churn.

### Decision 3: `BootScene` is intentionally empty in Phase 1

**Choice:** `BootScene.preload()` loads nothing; `BootScene.create()` immediately calls `this.scene.start('TitleScene')`.

**Why:**
- Phase 2 owns asset preloading (Soldier sprite sheets, grass tileset). Loading them now would require Phase 1 to also know about animation keys, which is out of scope.
- Establishes the *role* of `BootScene` (it exists; it transitions to title) so Phase 2 only needs to add `load.spritesheet(...)` calls.

**Alternatives considered:**
- *Skip `BootScene` entirely and start at `TitleScene`.* Would force a restructure in Phase 2 once preload is needed. Not worth saving 10 lines.

### Decision 4: Fixed logical canvas size with `Scale.FIT`

**Choice:** `GAME_WIDTH = 960`, `GAME_HEIGHT = 540` (16:9), `Phaser.Scale.FIT` + `Phaser.Scale.CENTER_BOTH`.

**Why:**
- A side-scroller needs predictable pixel coordinates; physics tuning in later phases gets harder if the logical size shifts. `Scale.FIT` keeps gameplay coordinates fixed while letting the canvas scale to the window.
- 960×540 is a common 16:9 base that downscales cleanly on small laptops and upscales without obvious blur.
- These dimensions are exported from `config.js`, so a designer can change them in one place if a different aspect feels better in playtest.

**Alternatives considered:**
- *Full window with `Scale.RESIZE`.* Forces every scene to query `this.scale.width` for layout, which is more work and shifts hitboxes on resize.
- *Pixel-art native size like 320×180.* Cleaner pixels but the provided sprites are 100×100 — they would dominate the screen.

### Decision 5: `TitleScene` advances on **any key**, not a specific key

**Choice:** Use `this.input.keyboard.once('keydown', ...)` with no key filter.

**Why:**
- Roadmap Phase 1 explicitly says "Pressing any key advances". Players don't need to guess the right key on the title screen.
- `once` (not `on`) prevents double-trigger if a held key fires again before the scene transition lands.
- Phase 5+ (Game Over → retry) will use the same pattern.

### Decision 6: `GameScene` placeholder is a colored rectangle, not a no-op

**Choice:** `GameScene.create()` paints `this.cameras.main.setBackgroundColor('#1a3a1a')` and adds a centered text label "Game Scene (placeholder)".

**Why:**
- Roadmap Phase 1 done-criterion requires *visible proof* that the gameplay scene is live. A blank canvas could mean either "scene loaded successfully" or "scene crashed" — the colored rect plus label disambiguates instantly.
- The dark green hints at the eventual grass-tileset background and is throwaway code that Phase 2 deletes.

### Decision 7: `config.js` exports named constants, not a config object

**Choice:** `export const GAME_WIDTH = 960;` style, individual named exports.

**Why:**
- Tree-shaking isn't needed (no bundler), but named imports make every consumer site an explicit declaration of dependency: `import { GAME_WIDTH } from '../config.js';`. Easier to grep, easier for a designer to find what's used where.
- A single object (`export default { GAME_WIDTH, ... }`) hides which constants any given file actually reads.

## Risks / Trade-offs

- **CDN availability** → Mitigation: pin to a specific Phaser version (`@3.80.1`), and document in `proposal.md` that vendoring is the fallback. Network failure produces a clear "Phaser is not defined" error in the console, not a silent broken game.
- **Phaser version drift between CDN and local docs** → Mitigation: comment the pinned version inside `index.html` next to the `<script>` tag, and use Context7 / official Phaser 3 docs at that exact version when writing scene code.
- **Scope creep into Phase 2 (asset loading, player)** → Mitigation: `BootScene.preload` is the natural magnet for "while I'm here, just load the sprite". Keep it explicitly empty in this phase; reviewer rejects the diff if assets show up.
- **Module path quirks on `file://`** → ES modules cannot be loaded from `file://` due to CORS. Mitigation: README-level instruction (in `index.html` comment for now) that the game must be served via `python -m http.server` or similar. This is restated in the playtest task.
- **`config.js` accumulating dead constants** → Even Phase 1 only *needs* `GAME_WIDTH` and `GAME_HEIGHT`. `LEVEL_DURATION_SECONDS` and `PLAYER_MAX_HP` are listed in the roadmap but unused yet. Mitigation: include them with a one-line comment explaining when each is consumed; they are roadmap commitments, not speculative additions.

## Migration Plan

There is no existing system to migrate from. Deploy = "open `index.html` via a static server". Rollback = "delete the new files" (everything new is under `contra-AC/` with no external footprint).

## Open Questions

- **Exact Phaser version:** roadmap says "Phaser 3" without pinning. Default to the latest 3.80.x (`3.80.1` at the time of writing) unless playtest reveals an issue. Tasks include "verify the pinned version still resolves on jsDelivr" so the choice is explicit at implementation time.
- **Title font:** Phase 1 can use Phaser's default bitmap font. A custom font is out of scope and belongs in Phase 8 (audio polish / final pass).
