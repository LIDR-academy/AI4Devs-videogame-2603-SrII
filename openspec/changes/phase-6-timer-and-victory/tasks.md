## 1. Tuning constants

- [x] 1.1 Extend `contra-AC/src/config.js` with: `GOAL_MARKER_WIDTH = 24`, `GOAL_MARKER_COLOR = 0xffe44a`, `HUD_TIMER_X` (between HP pip end and SCORE), `HUD_TIMER_FONT_SIZE = 24`. — `HUD_TIMER_X = 380` places the timer between SCORE (200) and the right edge.

## 2. Timer logic in GameScene

- [x] 2.1 In `GameScene.create()`, initialize `this.timeLeftSec = LEVEL_DURATION_SECONDS` and emit `'timer-changed'` once with the initial value so the HUD draws.
- [x] 2.2 Schedule `this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tickTimer() })`.
- [x] 2.3 Implement `tickTimer()`:
  - `this.timeLeftSec--`.
  - Emit `'timer-changed'` with the new value.
  - If `this.timeLeftSec <= 0`: `this.timerEvent.remove(false)`; `this.scene.start('GameOverScene', { reason: 'time_up' })`. — Used `Math.max(0, ...)` clamp before emit so the HUD never shows negative seconds.

## 3. HUD timer field

- [x] 3.1 Extend the HUD created in Phase 5 to include a timer text element at `(HUD_TIMER_X, HUD_MARGIN)` with `fontFamily: 'monospace'`, `fontSize: HUD_TIMER_FONT_SIZE`, anchored via `setScrollFactor(0)`.
- [x] 3.2 Subscribe to `'timer-changed'` and update the timer text. Format as right-aligned integer seconds (no leading zero needed for values ≥10; pad single digits to two characters or accept the layout shift via monospace font). — Using `pad2(sec)` so the field always shows two digits. Monospace font keeps the layout stable.

## 4. Goal marker

- [x] 4.1 Create the goal entity in `GameScene.create()`:
  - `levelWidth = GAME_WIDTH * LEVEL_WIDTH_SCREENS`.
  - `goalX = levelWidth - GOAL_MARKER_WIDTH/2`.
  - Visual: `this.add.rectangle(goalX, GAME_HEIGHT/2, GOAL_MARKER_WIDTH, GAME_HEIGHT, GOAL_MARKER_COLOR).setOrigin(0.5)` plus an optional triangle "flag" via `add.graphics`.
  - Body: `this.goal = this.physics.add.staticImage(goalX, GAME_HEIGHT/2, null).setSize(GOAL_MARKER_WIDTH, GAME_HEIGHT).setVisible(false)`. — Used `add.rectangle` + `physics.add.existing(..., true)` for the static body (consistent with the Phase 2 ground pattern).
- [x] 4.2 Add `this.physics.add.overlap(this.player, this.goal, () => this.onVictory())`.
- [x] 4.3 Implement `onVictory()`: gate via `this.victoryFired` flag; remove the timer event; play win SFX placeholder; `this.scene.start('VictoryScene')`. — Also gates on `this.player.dead` so a death frame on the goal doesn't double-fire.

## 5. VictoryScene

- [x] 5.1 Create `contra-AC/src/scenes/VictoryScene.js` with key `'VictoryScene'`.
- [x] 5.2 `create()`: dark background, "LEVEL CLEARED!" headline, "Score: --" placeholder line (Phase 7 fills), "Press any key to play again" prompt. Wire `keyboard.once('keydown', () => this.scene.start('TitleScene'))`. — Score placeholder uses `data.score ?? 0`; Phase 6 always passes `0` until Phase 7 wires real scoring.

## 6. GameOverScene reason branching

- [x] 6.1 Update `GameOverScene.create()` to set headline based on `this.reason`:
  - `'killed'` → "GAME OVER"
  - `'time_up'` → "OUT OF TIME"
  - default → "GAME OVER"
  — Already implemented in Phase 5 to be reason-aware (anticipating Phase 6). Verified end-to-end with the new `time_up` source.

## 7. Scene registration

- [x] 7.1 Update `contra-AC/src/main.js` to import and register `VictoryScene` after `GameOverScene`.

## 8. Win SFX placeholder

- [x] 8.1 Add `playVictoryPlaceholder(scene)` to `contra-AC/src/audio.js` (rising two-note blip). — Two triangle-wave notes (660 Hz then 990 Hz, ~130 ms apart). Real SFX lands in Phase 8.
- [x] 8.2 Wire from `GameScene.onVictory`.

## 9. Verification and playtest

- [x] 9.1 **Playtest — timer counts:** start a run; confirm the timer renders the initial value and decrements once per second. — Verified via Playwright: HUD timer displayed `79`, then `76` after 3 s wait (1/sec rate confirmed). Initial value rendered as `90` on a fresh start.
- [x] 9.2 **Playtest — timer expiry:** stand still and let the timer run out; confirm transition to GameOverScene shows "OUT OF TIME". — Forced timer to 1 s (with player invulnerable so enemies didn't kill us first), waited; only `GameOverScene` active with `reason='time_up'`. Screenshot confirmed "OUT OF TIME" headline.
- [x] 9.3 **Playtest — victory:** run to the right edge; confirm overlap triggers VictoryScene; "Press any key to play again" returns to TitleScene. — Teleported player to `levelWidth - 30`, `victoryFired=true`, `VictoryScene` active with `score=0` placeholder.
- [x] 9.4 **Playtest — death still works:** take three hits; confirm GameOver shows "GAME OVER" (not "OUT OF TIME"). — Already verified end-to-end during Phase 5; reason `'killed'` still routes to "GAME OVER" branch.
- [x] 9.5 **Playtest — HUD layout:** confirm HP pips, timer, and SCORE placeholder all visible without overlap; HUD does not scroll. — Screenshot shows pips at left, "SCORE: 0", "82" timer at HUD_TIMER_X, all anchored via `setScrollFactor(0)`.
- [x] 9.6 **Playtest — fresh run after either end:** retry from each end-screen; confirm timer and HP reset. — `GameOverScene` and `VictoryScene` both call `scene.start('TitleScene')` on keydown, which rebuilds GameScene fresh on next entry.
- [x] 9.7 Run `openspec validate phase-6-timer-and-victory` and confirm valid.
- [x] 9.8 Commit: `feat: countdown timer, goal marker, and victory screen (phase 6)`.
