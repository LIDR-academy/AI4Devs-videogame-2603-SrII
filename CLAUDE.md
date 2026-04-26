# Contra-AC — Project Guide for Claude

Browser-based 2D side-scrolling run-and-gun game inspired by Konami's Contra. Single-player MVP, one level.

## Hard rules

- **All game code, assets, and game documentation live under `/contra-AC`.** Do not create or edit files outside this folder. The only exceptions are:
  - this `CLAUDE.md` at the repo root (Claude Code reads it from the working directory and walks up — root keeps it discoverable from anywhere in the repo).
  - the `/openspec` workflow directory at the repo root.
- **No build step.** The game runs directly from `index.html` via a static file server (e.g. `python -m http.server`). No bundlers, no transpilers, no npm install required to play.
- **No frameworks beyond Phaser 3 and pure CSS.** No React, no Tailwind, no TypeScript.

## Tech stack

- **HTML5** — one `index.html` entry point that loads Phaser and the game's main module.
- **JavaScript (ES modules)** — `<script type="module">`; modern browser features only.
- **Phaser 3** — loaded via CDN (or vendored under `vendor/`).
- **Pure CSS** — single stylesheet for page chrome around the canvas.

## Folder layout

```
<repo root>/
├── CLAUDE.md                ← this file (kept at root so Claude Code finds it)
├── openspec/                ← OpenSpec workflow artifacts
└── contra-AC/
    ├── roadmap.md           ← phased plan, used as input for `openspec propose`
    ├── index.html           ← entry point
    ├── styles.css           ← page chrome around the Phaser canvas
    ├── src/
    │   ├── main.js          ← Phaser.Game bootstrap + scene registration
    │   ├── config.js        ← all tuning constants (HP, timer, speeds, spawn rate)
    │   ├── scenes/
    │   │   ├── BootScene.js     ← preload assets
    │   │   ├── TitleScene.js    ← start screen
    │   │   ├── GameScene.js     ← gameplay
    │   │   ├── PauseScene.js    ← overlay
    │   │   ├── GameOverScene.js
    │   │   └── VictoryScene.js
    │   └── entities/
    │       ├── Player.js
    │       ├── Enemy.js          ← base class for grunt/shooter/jumper variants
    │       └── Bullet.js
    └── resources/            ← provided art assets (do not modify)
```

## Game design (MVP)

| Aspect | Spec |
|---|---|
| View | Side-scrolling 2D, ~3 screens wide |
| Level length | ~90 second timer |
| Player moves | Run left/right, jump |
| Player weapon | Single basic gun, infinite ammo, straight shot |
| Player HP | 3 hits, 1 life. 0 HP = game over |
| Timer expiry | Game over immediately |
| Win condition | Reach the right edge of the stage |
| Enemy types | 3 variants of the Orc sprite: grunt (walks toward player), shooter (stationary, fires arrows), jumper (hops along ground) |
| Enemy density | 3–5 on screen at once, random spawns |
| Audio | SFX only (shoot, hit, death). No music |
| Score | Tracked during play; no persistence |
| Screens | Title, Game, Pause, Game Over, Victory |
| Controls | Arrow keys OR WASD = move; Space = jump; Z / X / mouse = shoot |

## Asset notes

- Only one enemy art set (Orc) ships with `/contra-AC/resources`. The three enemy types must be expressed via **behavior + tint/scale**, not new sprites.
- Soldier sprites are the player. Arrow sprite is both player bullets and shooter-enemy projectiles.
- `grass tileset.png` is the only ground/platform art. Build the level layout from this single tileset.

## Conventions

- **Tuning lives in `src/config.js`.** Anything a designer might want to tweak (speeds, HP, timer, spawn rates) goes here, never inline.
- **One Phaser Scene per screen.** Don't multiplex screens inside `GameScene`.
- **No premature abstraction.** If two enemy types differ in only a constant, parameterize — don't subclass yet. Subclass only when behavior diverges.
- **Constants over magic numbers.** Even pixel offsets get a named constant if they appear in more than one place.
- **Manual playtest is the test suite.** No unit tests for the MVP — every roadmap task ends with a "play it in the browser and confirm X" step.
- **Bug fixes follow replicate → understand → test.** Don't patch a reported bug until you can reliably reproduce it (note the exact steps), explain the root cause in one sentence, and re-run the same reproduction after the fix to confirm it's gone. A fix that "looks right" without a confirmed repro doesn't ship.
- **Conventional commit messages** (`feat:`, `fix:`, `chore:`, `docs:`).

## Workflow

This project uses the **OpenSpec** workflow. The phased plan in `roadmap.md` is the input to `openspec propose`. Each roadmap phase corresponds to one OpenSpec change proposal.

When picking up work:

1. Read `roadmap.md` to see what's done and what's next.
2. Use `/openspec-propose` (or the `feature-dev:feature-dev` skill) to turn the next phase into a change proposal.
3. Implement with `/openspec-apply-change` — keep tasks under ~2 hours each, every task ends with a manual playtest.
4. Archive with `/openspec-archive-change` once the phase is shipped.

## Recommended skills

- `feature-dev:feature-dev` — guided, codebase-aware feature implementation.
- `context7` — fetch up-to-date Phaser 3 API docs before writing engine code.
- `simplify` — review changes for reuse and clarity before commit.
