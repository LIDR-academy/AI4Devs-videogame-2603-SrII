## ADDED Requirements

### Requirement: Goal marker exists at the level's right edge

`GameScene` SHALL include a goal-marker entity occupying the rightmost `GOAL_MARKER_WIDTH` pixels of the level (built from primitives, not new art). It SHALL participate in physics overlap with the player.

#### Scenario: Goal position

- **WHEN** `GameScene.create()` finishes
- **THEN** a goal entity exists with x in the range `[levelWidth - GOAL_MARKER_WIDTH, levelWidth]`
- **AND** the entity has a static physics body

#### Scenario: Goal is visually distinct

- **WHEN** the player approaches the right edge of the level
- **THEN** the goal marker is rendered as a colored vertical bar (or equivalent primitive-built marker) clearly distinct from the ground

### Requirement: Touching the goal triggers VictoryScene

The player overlapping the goal marker SHALL transition the active scene to `VictoryScene`. The transition SHALL fire exactly once per run.

#### Scenario: Overlap triggers transition

- **WHEN** the player's body overlaps the goal entity for the first time in a run
- **THEN** the active scene transitions to `VictoryScene`

#### Scenario: Overlap does not retrigger

- **WHEN** a victory transition has already fired in this run
- **THEN** subsequent overlaps with the goal do not start additional transitions

### Requirement: VictoryScene exists and is registered

A new scene `contra-AC/src/scenes/VictoryScene.js` SHALL exist with key `'VictoryScene'` and SHALL be registered in `main.js`.

#### Scenario: Scene is registered

- **WHEN** the Phaser game instance is constructed
- **THEN** `'VictoryScene'` is in the scene list

### Requirement: VictoryScene displays the win screen

`VictoryScene` SHALL render "LEVEL CLEARED!" prominently, a final-score placeholder (filled by Phase 7), and a "Press any key to play again" prompt. Pressing any key SHALL transition to `TitleScene`.

#### Scenario: Win-screen content

- **WHEN** `VictoryScene` is the active scene
- **THEN** the canvas displays "LEVEL CLEARED!"
- **AND** displays a final-score line (placeholder content acceptable in Phase 6)
- **AND** displays "Press any key to play again"

#### Scenario: Any key returns to title

- **WHEN** any keyboard key is pressed in `VictoryScene`
- **THEN** the active scene becomes `TitleScene`

### Requirement: Win SFX placeholder plays on transition

A short audio cue SHALL play as the Victory transition begins. The asset MAY be a synthesized placeholder; Phase 8 replaces it.

#### Scenario: Cue fires on victory

- **WHEN** the goal-overlap transition fires
- **THEN** exactly one win-SFX trigger occurs
