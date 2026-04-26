## ADDED Requirements

### Requirement: Static-server entry point

The game SHALL be playable by serving `contra-AC/` from any static HTTP file server and opening `index.html` in a modern browser. No build, transpile, bundle, or package-install step SHALL be required to run the game.

#### Scenario: Game loads from a static server

- **WHEN** a developer runs a static file server (e.g. `python -m http.server`) from the `contra-AC/` directory and opens `index.html` in a current Chrome, Firefox, or Safari
- **THEN** the page renders without console errors and a Phaser canvas is visible

#### Scenario: No build artifacts are required

- **WHEN** a fresh clone of the repository is inspected
- **THEN** there is no `package.json`, no `node_modules/`, no bundler config, and no transpiled output under `contra-AC/`
- **AND** the game still loads correctly via the static-server flow above

### Requirement: Phaser 3 is loaded as an external runtime dependency

The game SHALL load Phaser 3 from a pinned external source (CDN `<script>` tag) before any application code runs. Application code SHALL reference the global `Phaser` provided by that script.

#### Scenario: Phaser is available globally before app code runs

- **WHEN** `index.html` is loaded
- **THEN** the Phaser `<script>` tag is parsed and executed before the application module (`src/main.js`)
- **AND** `window.Phaser` is defined when `main.js` runs

#### Scenario: Phaser version is pinned

- **WHEN** the `<script>` tag for Phaser is inspected
- **THEN** its `src` attribute references a specific pinned version (not `latest` or an unversioned URL)

### Requirement: Phaser game is configured from central tuning constants

The Phaser `Game` instance SHALL be constructed with `width` and `height` taken from constants exported by `src/config.js`. The game SHALL use a fixed logical resolution that is centered and scaled to fit the browser window without distorting aspect ratio.

#### Scenario: Canvas size matches config constants

- **WHEN** the page loads
- **THEN** the rendered Phaser canvas has the logical dimensions specified by `GAME_WIDTH` and `GAME_HEIGHT` in `config.js`

#### Scenario: Canvas scales to fit the window

- **WHEN** the browser window is resized
- **THEN** the canvas remains centered and preserves its aspect ratio (no stretching or distortion)

### Requirement: Three scenes registered in boot order

The game SHALL register exactly three scenes for Phase 1: `BootScene`, `TitleScene`, and `GameScene`. `BootScene` SHALL be the auto-started scene. Each scene SHALL live in its own ES module file under `src/scenes/`.

#### Scenario: BootScene starts first

- **WHEN** the Phaser game instance finishes initializing
- **THEN** `BootScene` is the active scene

#### Scenario: Each scene has its own file

- **WHEN** the `src/scenes/` directory is inspected
- **THEN** there is exactly one file per scene named `BootScene.js`, `TitleScene.js`, and `GameScene.js`
- **AND** each file exports a class that extends `Phaser.Scene`

### Requirement: BootScene transitions immediately to TitleScene

`BootScene` SHALL not load any assets in Phase 1. It SHALL transition to `TitleScene` as soon as it is created.

#### Scenario: No assets loaded in BootScene

- **WHEN** `BootScene.preload()` is invoked
- **THEN** no `this.load.*` calls occur

#### Scenario: BootScene transitions on create

- **WHEN** `BootScene.create()` finishes
- **THEN** the active scene is `TitleScene`

### Requirement: TitleScene shows the title and prompts for input

`TitleScene` SHALL display the text "CONTRA-AC" prominently and the instruction "Press any key to start" beneath it. Pressing any keyboard key SHALL transition to `GameScene`.

#### Scenario: Title and prompt are visible

- **WHEN** `TitleScene` is the active scene
- **THEN** the canvas displays the text "CONTRA-AC"
- **AND** the canvas displays a "Press any key to start" prompt

#### Scenario: Any key advances to gameplay

- **WHEN** the player presses any keyboard key while `TitleScene` is active
- **THEN** the active scene transitions to `GameScene`

#### Scenario: Subsequent keypresses do not re-trigger the transition

- **WHEN** the player holds a key during the transition from `TitleScene` to `GameScene`
- **THEN** the transition runs exactly once

### Requirement: GameScene renders a visible placeholder

`GameScene` SHALL render a non-default colored background and a label confirming the gameplay scene is live. It SHALL NOT contain any player, enemy, projectile, HUD, or audio logic in Phase 1.

#### Scenario: Placeholder background is visible

- **WHEN** `GameScene` becomes active
- **THEN** the canvas background is a non-default solid color (distinct from `TitleScene`)
- **AND** a text label such as "Game Scene (placeholder)" is rendered on screen

#### Scenario: No gameplay entities exist yet

- **WHEN** `GameScene` is inspected
- **THEN** it contains no Player, Enemy, Bullet, HUD, or audio constructs

### Requirement: Tuning constants module exists and exports Phase-1 values

`src/config.js` SHALL exist as an ES module and SHALL export, at minimum, the named constants `GAME_WIDTH`, `GAME_HEIGHT`, `LEVEL_DURATION_SECONDS`, and `PLAYER_MAX_HP`. Constants SHALL be exported individually (one `export const` per value) rather than packed into a default-exported object.

#### Scenario: Required constants are exported

- **WHEN** `src/config.js` is imported from any module
- **THEN** the imports `GAME_WIDTH`, `GAME_HEIGHT`, `LEVEL_DURATION_SECONDS`, and `PLAYER_MAX_HP` resolve to numeric values

#### Scenario: Roadmap-mandated values are correct

- **WHEN** `LEVEL_DURATION_SECONDS` is read
- **THEN** its value is `90`
- **AND** `PLAYER_MAX_HP` is `3`

### Requirement: All Phase-1 source lives under `contra-AC/`

Every file added or modified by this change SHALL live under `contra-AC/`, except for artifacts under `/openspec`. No file SHALL be added at the repository root other than what already exists.

#### Scenario: New game files are scoped correctly

- **WHEN** the diff for this change is inspected
- **THEN** every new code, asset, or stylesheet file resides under `contra-AC/`
- **AND** no new files are created at the repository root or outside `contra-AC/` (excluding `/openspec` artifacts)

### Requirement: Page chrome is minimal and unobtrusive

`contra-AC/styles.css` SHALL provide minimal page chrome around the canvas: a dark page background, no scrollbars at the configured logical resolution, and the canvas centered horizontally and vertically in the viewport.

#### Scenario: No scrollbars at default sizing

- **WHEN** the page is loaded in a viewport at least as large as `GAME_WIDTH`×`GAME_HEIGHT`
- **THEN** no horizontal or vertical scrollbars appear

#### Scenario: Canvas is centered

- **WHEN** the page is loaded
- **THEN** the Phaser canvas is centered both horizontally and vertically in the viewport
- **AND** the area outside the canvas is a solid dark color
