## ADDED Requirements

### Requirement: Each enemy variant has a `scoreValue`

`ENEMY_VARIANTS` SHALL include a `scoreValue` integer for each of `grunt`, `shooter`, and `jumper`.

#### Scenario: Variants have score values

- **WHEN** `ENEMY_VARIANTS` is read
- **THEN** `grunt.scoreValue`, `shooter.scoreValue`, and `jumper.scoreValue` are positive integers

### Requirement: Killing an enemy adds its `scoreValue` to the run score

When an enemy's death animation completes, `GameScene.score` SHALL increase by that enemy's `scoreValue`. The scene SHALL emit `'score-changed'` with the new score so the HUD can update.

#### Scenario: Killing a grunt awards grunt score

- **WHEN** a grunt's death animation completes
- **THEN** `GameScene.score` increases by `ENEMY_VARIANTS.grunt.scoreValue`
- **AND** `'score-changed'` is emitted with the new total

#### Scenario: Killing a shooter awards shooter score

- **WHEN** a shooter's death animation completes
- **THEN** `GameScene.score` increases by `ENEMY_VARIANTS.shooter.scoreValue`

#### Scenario: Killing a jumper awards jumper score

- **WHEN** a jumper's death animation completes
- **THEN** `GameScene.score` increases by `ENEMY_VARIANTS.jumper.scoreValue`

### Requirement: HUD shows the live score

The HUD's score field (placeholder since Phase 5) SHALL display the current `GameScene.score`.

#### Scenario: HUD updates on score change

- **WHEN** `'score-changed'` is emitted
- **THEN** the HUD's score text shows the new value

#### Scenario: HUD score starts at zero

- **WHEN** `GameScene.create()` finishes
- **THEN** the HUD score text reads `0`

### Requirement: GameOverScene and VictoryScene display final score

Both end scenes SHALL accept `{ score }` via `init(data)` and display the final score on the screen.

#### Scenario: VictoryScene shows score

- **WHEN** `VictoryScene` is started with `{ score: 1500 }`
- **THEN** the canvas displays "Score: 1500" (or equivalent)

#### Scenario: GameOverScene shows score

- **WHEN** `GameOverScene` is started with `{ score: 700, reason: 'killed' }`
- **THEN** the canvas displays "Score: 700"

### Requirement: Score resets between runs

Starting a new run via `TitleScene` → `GameScene` SHALL reset `GameScene.score` to 0.

#### Scenario: Retry resets score

- **WHEN** a run ends with a non-zero score and the player starts a new run from the title
- **THEN** `GameScene.score === 0` at the new run's start
