## Why

After Phase 5 the player can lose, but cannot yet win, and there is no time pressure. A run-and-gun without a timer or goal is a target range with stakes. Phase 6 closes the loop: a 90-second countdown ticks in the HUD, a goal marker sits at the right edge of the level, touching it shows a Victory screen, and running out the clock routes to the existing Game Over screen. After this phase the game has both a clear win path and a clear lose-on-time path — the first time the MVP loop is truly playable end-to-end.

This phase reuses the timer/HUD pattern that Phase 7's score will piggyback on, and the level-end transition pattern that becomes the model for any future end-of-level events.

## What Changes

- HUD gains a countdown timer reading from `LEVEL_DURATION_SECONDS` (already declared in Phase 1, used here for the first time). The timer ticks down once per second using a Phaser `time.addEvent`; the displayed value is monospaced and right-aligned so it doesn't reflow.
- A goal marker entity is placed at the right edge of the level inside `GameScene`. Visually it is built from the existing grass tileset plus a tinted rectangle or simple flag drawn from primitives (no new art). It is a static physics body the player overlaps with to trigger victory.
- New scene `contra-AC/src/scenes/VictoryScene.js` — "LEVEL CLEARED!" text, a placeholder for final score (Phase 7 fills it), and "Press any key to play again" returning to `TitleScene`.
- The timer-expiry path is wired into the existing `GameOverScene` flow. `GameOverScene` accepts a reason (`'killed'` or `'time_up'`) so the message can be tailored ("OUT OF TIME" vs. "GAME OVER").
- A win SFX placeholder is wired (real SFX in Phase 8).
- `src/config.js` gains: `GOAL_MARKER_WIDTH`, HUD timer position/format constants, and a flag for whether the timer pauses while in i-frames (default off — the player taking damage shouldn't stop the clock).

## Capabilities

### New Capabilities
- `level-timer`: the countdown driven by `LEVEL_DURATION_SECONDS`, its HUD rendering, and the timer-expiry → Game Over hook.
- `victory-screen`: the goal marker, the player→goal collision that triggers the transition, and the `VictoryScene` with retry-to-title.

### Modified Capabilities
- `game-over-screen`: now accepts a reason (`killed` vs. `time_up`) and shows a different headline per reason.
- `game-shell`: registers `VictoryScene`. `BootScene` does not need new assets (no new art).
- `damage-and-lives`: the HUD now also renders a timer; layout constants are extended.

## Impact

- **New files:** `contra-AC/src/scenes/VictoryScene.js`, `contra-AC/src/entities/Goal.js` (or inline in `GameScene` if under ~40 lines).
- **Modified files:** `contra-AC/src/scenes/GameScene.js`, `contra-AC/src/scenes/GameOverScene.js`, `contra-AC/src/main.js` (scene registration), `contra-AC/src/config.js`, plus the HUD module (or HUD code in `GameScene`).
- **Constraints honored:** no new art, no new frameworks, code stays under `/contra-AC`.
- **Out of scope:** no multiple levels, no persistence between runs, no per-second pickups or bonuses, no pause yet (Phase 7), no real SFX (Phase 8).
