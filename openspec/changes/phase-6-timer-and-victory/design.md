## Context

Phase 5 closes the loss path: the player can die. Phase 6 closes the win path: a timer ticks down, a goal sits at the level's right edge, touching it shows a Victory screen, and timer expiry routes to the existing Game Over screen. After this phase the MVP loop is end-to-end playable for the first time — every state transition the design doc names exists and works.

The level-end transition pattern this phase introduces (player-overlaps-marker → next scene) is the same shape Phase 7's pause-on-key reuses, so getting it clean here matters.

Constraints unchanged. No new art — the goal marker is built from primitives plus the existing tileset.

## Goals / Non-Goals

**Goals:**
- A countdown timer reading `LEVEL_DURATION_SECONDS` (declared in Phase 1, used here for the first time) ticks down once per second in the HUD.
- A goal-marker entity at the right edge of the level; player overlap → Victory.
- A `VictoryScene` that says "LEVEL CLEARED!" with a placeholder for final score (Phase 7) and "Press any key to play again" → `TitleScene`.
- Timer expiry → `GameOverScene` with `reason: 'time_up'` and a tailored headline.
- Win SFX placeholder.

**Non-Goals:**
- No multi-level structure (explicit MVP non-goal).
- No persistence (no high-score save).
- No timer pause logic yet (Phase 7 wires it).
- No goal-marker art beyond primitives.

## Decisions

### Decision 1: Timer is a Phaser `time.addEvent`, not a frame counter

**Choice:** `GameScene.create` schedules `this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: tick })`. The callback decrements `this.timeLeftSec` and emits `'timer-changed'` on `scene.events`.

**Why:**
- Wall-clock-correct. Frame-rate independent.
- One tick per second is the right cadence — sub-second precision is wasted because the HUD only renders integer seconds.
- `time.addEvent` is the standard Phaser pattern for repeating callbacks; Phase 7 will pause and resume it without surgery.

**Alternatives considered:** Polling `time.now` against a `endsAt` wall-clock (rejected — equally correct but couples the timer's UI update to render-frame timing); per-frame decrement (rejected — frame-rate dependent).

### Decision 2: Time is stored in seconds, formatted at render

**Choice:** `this.timeLeftSec` is an integer. The HUD listener formats it as `String(seconds).padStart(2, '0')` (and prefixes `0:` if displaying mm:ss feels right).

**Why:**
- A 90-second timer doesn't need millisecond precision in the HUD. Integer seconds eliminate fractional jitter and make the "seconds-changed" event the natural granularity.
- Formatting at render keeps the data layer simple.

### Decision 3: Goal marker is a static body at the level's right edge

**Choice:** A `Phaser.GameObjects.Rectangle` (or a flag drawn via `add.graphics`) plus a `physics.add.staticImage` zone at `(levelWidth - GOAL_MARKER_WIDTH, ...)`. `physics.add.overlap(player, goal, ...)` triggers victory.

**Why:**
- A static body matches the way the ground was modeled in Phase 2.
- An overlap (not a collider) means the player passes through visually — the act of *touching* the goal is the win, not bumping into it.
- Visually distinguishable: a colored vertical bar at the right edge reads as "destination" without art.

### Decision 4: `GameOverScene.init` reuses Phase 5's `reason` channel

**Choice:** Phase 5 already routes `reason` through `init(data)`. Phase 6 simply passes `'time_up'` and adds a branch in `GameOverScene.create` so the headline text varies.

**Why:**
- Phase 5 designed for this — wiring's in place. This phase adds the Victory transition and one extra `reason` value.
- Tailored copy ("OUT OF TIME" vs "GAME OVER") makes the lose state legible: the player knows whether they were outpaced by enemies or by the clock.

### Decision 5: Timer keeps running during i-frames

**Choice:** No interaction between `Player.invulnerableUntil` and the timer.

**Why:**
- The clock is a player-facing pressure mechanism; pausing it during i-frames would let a player stall by tanking hits. The roadmap is explicit that the timer is the soft-limit on the run.
- Phase 7's pause is the *only* timer-suspend path.

### Decision 6: Goal placement uses `LEVEL_WIDTH_SCREENS`

**Choice:** Goal x = `LEVEL_WIDTH_SCREENS * GAME_WIDTH - GOAL_MARKER_WIDTH`.

**Why:**
- Single source of truth for level width — the same constant Phase 2 used to bound the camera and ground.
- If a designer changes `LEVEL_WIDTH_SCREENS`, the goal moves with the level automatically.

### Decision 7: Win SFX placeholder, like Phase 5's hurt/death

**Choice:** `audio.js` gains `playVictoryPlaceholder(scene)`. Real SFX in Phase 8.

**Why:**
- Consistency with the Phase 3/5 placeholder pattern. Audio polish is one phase, deliberately last.

### Decision 8: HUD layout: timer to the right of HP, score to the right of timer

**Choice:** `HUD_TIMER_X` between `HP_END_X` and `HUD_SCORE_X`. All three are camera-fixed in the top row.

**Why:**
- Three pieces of info in a single row reads cleanly without crowding.
- Reserves no new visual space — Phase 5 already left the score slot.

## Risks / Trade-offs

- **Goal touch firing twice during the same frame** → Mitigation: on first overlap fire, set `this.victoryFired = true` and gate further fires. Symmetric to the death-during-death-animation guard from Phase 5.
- **Timer reaching 0 simultaneously with goal touch** → Both events would fire. Mitigation: the goal-touch transition sets `victoryFired = true` and disables the timer event before the next tick can fire. If the timer event fires first in the same frame, it transitions to Game Over — that's acceptable because in practice the player would have to be inside the goal at exactly second 0, which is a corner case where either outcome is defensible.
- **Player runs past the level's right edge before goal exists in code** → The goal occupies the rightmost `GOAL_MARKER_WIDTH` pixels of the level, and Phase 2's `setBounds` already prevents the player from leaving level bounds. Mitigation: place goal flush to the right edge so the player cannot bypass it.
- **Timer text font changes width per digit** → Mitigation: use a monospaced font (`fontFamily: 'monospace'`) on the timer text so right-aligned formatting doesn't reflow each second.

## Migration Plan

Additive over Phase 5. Rolling back removes the timer event, the goal, and the Victory scene; Phase 5's loss loop continues to work.

## Open Questions

- **Goal visual** — start with a 24px-wide vertical rectangle in a bright color (e.g. `#ffe44a`) plus a small flag drawn from primitives. Refinement is a Phase 8 polish item if needed.
- **Final-second display** — show `0:00` for one frame on victory? Or hide on transition? Default: hide on transition, since the player is already moving to the next scene.
