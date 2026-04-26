## 1. Project scaffolding

- [x] 1.1 Create the directory structure under `contra-AC/`: `src/`, `src/scenes/`. Confirm `resources/` already exists and is untouched.
- [x] 1.2 Create `contra-AC/src/config.js` exporting `GAME_WIDTH = 960`, `GAME_HEIGHT = 540`, `LEVEL_DURATION_SECONDS = 90`, `PLAYER_MAX_HP = 3` as individual `export const` declarations. Add a one-line comment next to `LEVEL_DURATION_SECONDS` and `PLAYER_MAX_HP` noting they are reserved for later phases.

## 2. HTML entry point and page chrome

- [x] 2.1 Create `contra-AC/index.html` with a minimal HTML5 skeleton: `<meta charset>`, `<title>Contra-AC</title>`, link to `styles.css`, a `<script>` tag loading Phaser 3 from a pinned jsDelivr URL (e.g. `https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js`), and a final `<script type="module" src="src/main.js">` after Phaser. Include a brief HTML comment that the game must be served via a static file server (e.g. `python -m http.server`).
- [x] 2.2 Create `contra-AC/styles.css` setting: `body { margin: 0; background: #111; display: flex; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }` and a `canvas { display: block; }` rule. No other styles.
- [x] 2.3 **Playtest:** start a static server in `contra-AC/` (e.g. `python -m http.server 8000`), open `http://localhost:8000/`, and confirm the page loads with no console errors and a dark background. (No canvas yet — that lands in section 3.) — Verified via Playwright: page loads cleanly, only console error is favicon.ico 404 (cosmetic).

## 3. Phaser game bootstrap and scenes

- [x] 3.1 Create `contra-AC/src/scenes/BootScene.js` exporting `class BootScene extends Phaser.Scene` with key `'BootScene'`, an empty `preload()`, and a `create()` that calls `this.scene.start('TitleScene')`.
- [x] 3.2 Create `contra-AC/src/scenes/TitleScene.js` exporting `class TitleScene extends Phaser.Scene` with key `'TitleScene'`. In `create()`, render the centered text "CONTRA-AC" (large) and "Press any key to start" (smaller, beneath it) using `this.add.text` with `GAME_WIDTH`/`GAME_HEIGHT` from `config.js` for centering. Wire `this.input.keyboard.once('keydown', () => this.scene.start('GameScene'))` so the transition fires exactly once.
- [x] 3.3 Create `contra-AC/src/scenes/GameScene.js` exporting `class GameScene extends Phaser.Scene` with key `'GameScene'`. In `create()`, set the camera background to a distinct color (e.g. `'#1a3a1a'`) via `this.cameras.main.setBackgroundColor` and add a centered "Game Scene (placeholder)" text label. No gameplay logic.
- [x] 3.4 Create `contra-AC/src/main.js` that imports the three scene classes and `GAME_WIDTH`/`GAME_HEIGHT` from `config.js`, then constructs `new Phaser.Game({ type: Phaser.AUTO, width: GAME_WIDTH, height: GAME_HEIGHT, backgroundColor: '#000', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [BootScene, TitleScene, GameScene] })`.

## 4. Verification and playtest

- [x] 4.1 **Playtest — golden path:** restart the static server, hard-reload the page, and confirm the title screen renders with both text strings. Press a key (any key) and confirm the screen transitions to the green-tinted game scene with the placeholder label. No console errors, no visible scrollbars. — Verified via Playwright: title screen renders "CONTRA-AC" + "Press any key to start"; Space advances to green-tinted GameScene with placeholder label.
- [x] 4.2 **Playtest — viewport scaling:** resize the browser window larger and smaller; confirm the canvas stays centered and preserves aspect ratio (no distortion, no scrollbars at the default `GAME_WIDTH`×`GAME_HEIGHT`). — Verified via Playwright: tested 1400×700 (wider letterboxes left/right) and 600×800 (taller letterboxes top/bottom); aspect preserved, canvas centered, no scrollbars.
- [x] 4.3 **Playtest — file:// negative check:** open `index.html` directly via `file://` and confirm the browser console reports an ES-module/CORS error. This validates the README/HTML comment guidance that a static server is required. — Confirmed manually by user.
- [x] 4.4 Run `openspec validate phase-1-bootstrap-canvas` and confirm it reports the change as valid.
- [x] 4.5 Commit the change using a Conventional Commit message: `feat: bootstrap Phaser canvas with Boot/Title/Game scenes (phase 1)`.
