## ADDED Requirements

### Requirement: GameOverScene branches headline on `reason`

`GameOverScene.create()` SHALL inspect `this.reason` (set by `init`) and render a different headline for `'killed'` vs `'time_up'`.

#### Scenario: Killed reason shows GAME OVER

- **WHEN** `GameOverScene` is started with `{ reason: 'killed' }`
- **THEN** the headline text is "GAME OVER"

#### Scenario: Time-up reason shows OUT OF TIME

- **WHEN** `GameOverScene` is started with `{ reason: 'time_up' }`
- **THEN** the headline text is "OUT OF TIME"

#### Scenario: Retry prompt is unchanged

- **WHEN** `GameOverScene` is active under either reason
- **THEN** the "Press any key to retry" prompt is rendered
- **AND** any keypress returns to `TitleScene`
