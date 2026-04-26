## Context

After Phase 6, the loop is closed (start → run → win or lose) but the game lacks two MVP-grade quality-of-life features: scoring and pause. Scoring gives kills feedback weight and finally fills the `SCORE: 0` placeholder the HUD has carried since Phase 5. Pause lets a player step away without dying or alt-tabbing. After this phase, the only thing left is polish (Phase 8).

This phase introduces the project's first scene-as-overlay (`PauseScene` launched on top of `GameScene` rather than replacing it) — a pattern the codebase doesn't have yet. Getting it right means Phase 8's audio mute toggle and any future overlay (e.g. settings) inherits the same pattern.

Constraints unchanged. No persistence (`localStorage`) — explicit MVP non-goal.

## Goals / Non-Goals

**Goals:**
- Killing each enemy variant adds a per-variant score value to a run-scoped score counter.
- HUD score field shows the live score (replacing Phase 5's placeholder).
- `GameOverScene` and `VictoryScene` show the final score.
- `P` or `Esc` during gameplay opens a Pause overlay; `P`/`Esc` resumes; `Q` quits to title.
- The game world is *visible* but *frozen* while paused (timer suspended, enemies still, no fire).

**Non-Goals:**
- No high-score persistence (explicit MVP non-goal).
- No pause-menu controls beyond resume and quit.
- No graphical/audio settings menu.
- No score multipliers, combos, or end-of-level bonuses.

## Decisions

### Decision 1: Score lives on `GameScene`; updates via scene events

**Choice:** `GameScene` owns `this.score = 0`. Enemies on death emit `'enemy-killed'` via `scene.events` with `{ variant }`; `GameScene` increments score by `ENEMY_VARIANTS[variant].scoreValue` and emits `'score-changed'` for the HUD.

**Why:**
- Mirrors Phase 5's `'player-hp-changed'` and Phase 6's `'timer-changed'` patterns: every HUD field updates via a scene event. No new mechanism.
- Keeps the per-variant score value in `config.js` (the variant block) rather than scattered in enemy code.

**Alternatives considered:** Enemy directly mutates a global score (rejected — global state, hard to reset on retry); HUD owns the score (rejected — HUD becomes a model, not a view).

### Decision 2: Per-variant `scoreValue` in `ENEMY_VARIANTS`

**Choice:** Extend Phase 4's `ENEMY_VARIANTS` map with `scoreValue` per variant. Defaults: grunt 100, jumper 200, shooter 300.

**Why:**
- Already-existing config block. One more field is no structural change.
- Roadmap specifies "per-variant score values in `config.js`".
- Default ordering (grunt < jumper < shooter) reflects relative difficulty — shooters are stationary but threatening at range; grunts are basic; jumpers are mid.

### Decision 3: PauseScene is launched (overlay), not started (replace)

**Choice:** On `P`/`Esc` keydown in `GameScene`, call `this.scene.launch('PauseScene')` and `this.scene.pause()`. `PauseScene` renders its overlay on top of the still-visible (but paused) `GameScene`.

**Why:**
- The visible-but-frozen world is the genre's expected pause behavior.
- Phaser's `scene.pause()` halts `update` and timers but keeps the render frame, exactly matching the requirement.
- `launch` (not `start`) means the underlying scene's state is preserved — when `PauseScene` ends, the resumed `GameScene` continues mid-run.

**Alternatives considered:** Render pause inside `GameScene` (rejected — couples menu logic to gameplay logic); freeze frame as a static screenshot (rejected — `scene.pause` already does the right thing without screenshot ceremony).

### Decision 4: Timer suspension is automatic via `scene.pause`

**Choice:** Phaser's `scene.pause()` halts the scene's `time` system, so the Phase 6 `time.addEvent` timer naturally suspends and resumes. No manual `timerEvent.paused = true` toggle.

**Why:**
- Phaser already does the right thing. Layering manual pause logic on top would risk drift between the timer event's pause state and the scene's pause state.
- The HUD's last `'timer-changed'` value sticks while paused — perfect.

### Decision 5: Pause input gating

**Choice:** While `PauseScene` is active, `GameScene` is paused so its input handlers don't run. `PauseScene` owns its own keyboard input (`P`, `Esc`, `Q`) and consumes them.

**Why:**
- Phaser's pause does not auto-disable input on paused scenes if the scene has explicit input handlers. Mitigation: in `Player.update`, early-return if `this.scene.scene.isPaused()`. Or rely on the fact that paused scenes don't run `update` at all (which is what `scene.pause` does — confirmed in Phaser docs).
- `PauseScene` listens via `this.input.keyboard.on('keydown-P', ...)` etc., so its input is independent.

### Decision 6: `Q` quits to title (not retry)

**Choice:** `Q` in `PauseScene` calls `this.scene.stop('GameScene')` and `this.scene.start('TitleScene')`.

**Why:**
- "Quit to title" is the natural pause-menu second option. Resume is one option; quit is the other.
- Stopping `GameScene` (rather than just leaving it paused under the title) frees memory and forces a clean state on the next run.

### Decision 7: End screens display final score

**Choice:** `GameScene` passes `score` through `scene.start` data to `GameOverScene` and `VictoryScene`: `this.scene.start('VictoryScene', { score: this.score })`.

**Why:**
- Same pattern Phase 5 introduced for `reason`. Both scenes already have `init(data)`.
- Keeps the scenes themselves stateless w.r.t. game state — they receive the value at start.

### Decision 8: Score reset on retry is automatic

**Choice:** A retry goes Title → Game, and `GameScene.create()` reinitializes `this.score = 0`. No explicit reset needed.

**Why:**
- `scene.start('GameScene')` rebuilds the scene from scratch. State is fresh by construction.

## Risks / Trade-offs

- **Pause input "leak"** to `GameScene` while paused → Mitigation: confirmed via Phaser docs that `scene.pause()` halts the scene's `update` loop. Verified in playtest 7.7.
- **HUD updates while paused** (e.g. animations on the timer text) → None should fire because the scene is paused, but worth confirming in playtest.
- **Score going negative** (theoretical, but if a future damage-on-kill event ever existed) → Score is increment-only in this phase. If subtraction is ever added, the floor at 0 is a one-line guard.
- **Pause overlay covering important info** → The overlay is a translucent dark layer (`alpha 0.6`) over the world, with the menu text centered. Player can still see HP, timer, and score below it.
- **Quit-to-title dropping a run-in-progress** → That's the intended behavior. If Phase 7+ ever adds "are you sure?" friction, that's a polish phase concern.

## Migration Plan

Additive over Phase 6. Rolling back removes pause and score; Phase 6's victory/loss/timer continue to work.

## Open Questions

- **Exact score values per variant** — start at grunt 100, jumper 200, shooter 300; tune after a few playtests.
- **Pause overlay style** — `alpha 0.6` translucent dark layer with white centered text. Adjust in `config.js` if it reads as too dim or too bright.
- **Whether `Esc` should *also* unpause from outside the pause scene** — currently `Esc` only opens pause. From inside pause, `Esc` resumes. That asymmetry is intentional: `Esc` is the "context-aware" key while `P` is the unambiguous pause toggle.
