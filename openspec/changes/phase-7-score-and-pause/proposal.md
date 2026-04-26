## Why

After Phase 6 the loop is complete (start → run → win or lose) but feedback is thin: every kill feels the same, and there's no way to step away from the game without dying or alt-tabbing. Phase 7 adds the two MVP-grade quality-of-life features that close out gameplay before the polish pass: a per-kill score in the HUD, and a Pause overlay that freezes the game until resumed.

Score also gives the existing end screens (Game Over, Victory) something to display besides a static message — and it closes the loop on the "SCORE: 0" placeholder that's been in the HUD since Phase 5.

## What Changes

- `GameScene` tracks a `score` state, incremented on enemy death by a per-variant amount declared in `src/config.js`. The HUD score field (a placeholder since Phase 5) becomes live.
- `Enemy.js` (or its config) gains a `scoreValue` per variant. The grunt is worth the least, the shooter the most, the jumper in between (exact values tuned in `config.js`).
- New scene `contra-AC/src/scenes/PauseScene.js` rendered as a transparent overlay with "PAUSED — press P or Esc to resume / Q to quit". The underlying `GameScene` is paused (its `update` halts) but its render persists, so the world is visible but frozen.
- Inputs to enter pause: `P` or `Esc` while in `GameScene`. Inputs while paused: `P`/`Esc` to resume, `Q` to quit to `TitleScene`. Input is consumed only by `PauseScene` while it is active.
- `GameOverScene` and `VictoryScene` show the final score in addition to their existing text.
- The level timer is paused while `PauseScene` is active and resumes cleanly on resume.
- `src/config.js` gains: `SCORE_PER_GRUNT`, `SCORE_PER_SHOOTER`, `SCORE_PER_JUMPER`, plus pause-overlay color/alpha/font constants.

## Capabilities

### New Capabilities
- `scoring`: the score state, per-variant score values, HUD score rendering, and final-score display on Game Over and Victory screens.
- `pause`: the `PauseScene` overlay, the pause/resume input bindings, and the timer-suspension behavior.

### Modified Capabilities
- `enemies`: each variant gains a `scoreValue`; on death the enemy reports its value to `GameScene`.
- `level-timer`: the timer suspends/resumes in lockstep with the pause overlay.
- `game-over-screen`: now displays the final score.
- `victory-screen`: now displays the final score.
- `game-shell`: registers `PauseScene`.

## Impact

- **New files:** `contra-AC/src/scenes/PauseScene.js`.
- **Modified files:** `contra-AC/src/scenes/GameScene.js`, `contra-AC/src/scenes/GameOverScene.js`, `contra-AC/src/scenes/VictoryScene.js`, `contra-AC/src/entities/Enemy.js`, `contra-AC/src/main.js` (scene registration), `contra-AC/src/config.js`, the HUD module.
- **Constraints honored:** no `localStorage`, no new art, no new frameworks; pause uses Phaser's built-in `scene.pause`/`scene.resume`.
- **Out of scope:** no high-score persistence (explicit MVP non-goal), no pause-menu options beyond resume and quit, no in-game settings UI.
