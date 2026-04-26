## ADDED Requirements

### Requirement: Countdown timer ticks once per second from `LEVEL_DURATION_SECONDS`

`GameScene` SHALL initialize a per-run countdown to `LEVEL_DURATION_SECONDS` and decrement it by 1 every 1000 milliseconds. The current value SHALL be exposed via a scene event so the HUD can render it.

#### Scenario: Timer initial value

- **WHEN** `GameScene.create()` runs
- **THEN** `this.timeLeftSec === LEVEL_DURATION_SECONDS`

#### Scenario: Timer decrements every second

- **WHEN** 1 second has elapsed since `GameScene.create()`
- **THEN** `this.timeLeftSec === LEVEL_DURATION_SECONDS - 1`
- **AND** the scene has emitted `'timer-changed'` with the new value

#### Scenario: Timer monotonically decreases

- **WHEN** the timer is running
- **THEN** subsequent values of `this.timeLeftSec` are non-increasing

### Requirement: Timer hitting zero transitions to Game Over

When `this.timeLeftSec` reaches 0, the scene SHALL transition to `GameOverScene` with `reason: 'time_up'`. The timer event SHALL stop and no further damage events SHALL transition the player.

#### Scenario: Time-up transition

- **WHEN** `this.timeLeftSec` decrements from 1 to 0
- **THEN** the active scene becomes `GameOverScene`
- **AND** that scene receives `{ reason: 'time_up' }`

#### Scenario: No further timer ticks fire after expiry

- **WHEN** timer expiry has triggered
- **THEN** the timer event has been removed
- **AND** no additional `'timer-changed'` events are emitted

### Requirement: HUD displays the timer

The HUD SHALL render the current timer value as integer seconds, anchored to the camera in a fixed slot defined by `HUD_TIMER_X` and `HUD_MARGIN`. The timer text SHALL use a monospaced font to prevent reflow per digit.

#### Scenario: HUD shows current value

- **WHEN** `this.timeLeftSec` changes
- **THEN** the HUD's timer text displays the new integer value

#### Scenario: HUD does not scroll with the camera

- **WHEN** the camera scrolls horizontally
- **THEN** the timer text's screen-relative position is unchanged

### Requirement: Timer continues during i-frames

The countdown SHALL NOT pause when the player is in i-frames. Only an explicit pause (introduced in Phase 7) SHALL suspend it.

#### Scenario: Timer ticks during i-frames

- **WHEN** the player is in i-frames after a hit
- **AND** 1 second elapses
- **THEN** `this.timeLeftSec` has decreased by 1

### Requirement: Timer tuning constants live in `config.js`

`config.js` SHALL export `HUD_TIMER_X`, `HUD_TIMER_FONT_SIZE`, and a flag/format string controlling timer display (e.g. `HUD_TIMER_PAD = 2`). `LEVEL_DURATION_SECONDS` (declared in Phase 1) SHALL be the only source of the starting value.

#### Scenario: Constants exist with the expected names

- **WHEN** `config.js` is imported
- **THEN** `HUD_TIMER_X`, `HUD_TIMER_FONT_SIZE`, and `LEVEL_DURATION_SECONDS` resolve to numeric values
