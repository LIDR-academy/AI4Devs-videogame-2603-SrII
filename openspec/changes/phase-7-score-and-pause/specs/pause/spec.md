## ADDED Requirements

### Requirement: PauseScene exists and is registered

A new scene `contra-AC/src/scenes/PauseScene.js` SHALL exist with key `'PauseScene'` and SHALL be registered in `main.js`.

#### Scenario: Scene is registered

- **WHEN** the Phaser game instance is constructed
- **THEN** `'PauseScene'` is in the scene list

### Requirement: P or Esc opens the pause overlay

While `GameScene` is active, pressing `P` or `Esc` SHALL launch `PauseScene` as an overlay and pause `GameScene`. The world SHALL remain rendered (visible) but frozen (`update` halted, time system suspended).

#### Scenario: P opens pause

- **WHEN** the player presses `P` while `GameScene` is active
- **THEN** `PauseScene` is launched (active alongside `GameScene`)
- **AND** `GameScene` is paused (its `update` does not run)

#### Scenario: Esc opens pause

- **WHEN** the player presses `Esc` while `GameScene` is active
- **THEN** `PauseScene` is launched and `GameScene` is paused

#### Scenario: World remains rendered while paused

- **WHEN** `PauseScene` is active
- **THEN** the underlying `GameScene` is still rendered (player, enemies, level visible)
- **AND** the timer text shows the value at pause time and does not change

### Requirement: PauseScene displays the overlay

`PauseScene` SHALL render a translucent dark overlay across the canvas with centered text indicating the pause state and the available actions.

#### Scenario: Overlay content

- **WHEN** `PauseScene` is active
- **THEN** the canvas shows a translucent dark layer over the gameplay
- **AND** displays "PAUSED" prominently
- **AND** displays "Press P or Esc to resume" and "Press Q to quit"

### Requirement: Resume from pause

Pressing `P` or `Esc` while `PauseScene` is active SHALL stop `PauseScene` and resume `GameScene`.

#### Scenario: P resumes

- **WHEN** the player presses `P` while `PauseScene` is active
- **THEN** `PauseScene` stops
- **AND** `GameScene` resumes (its `update` runs again, timer ticks again)

#### Scenario: Esc resumes

- **WHEN** the player presses `Esc` while `PauseScene` is active
- **THEN** `PauseScene` stops and `GameScene` resumes

### Requirement: Quit to title

Pressing `Q` while `PauseScene` is active SHALL stop both `PauseScene` and `GameScene` and start `TitleScene`.

#### Scenario: Q returns to title

- **WHEN** the player presses `Q` while `PauseScene` is active
- **THEN** the active scene becomes `TitleScene`
- **AND** `GameScene` is no longer running (state will rebuild on next run)

### Requirement: Game inputs are gated while paused

While `PauseScene` is active, gameplay inputs (movement, jump, fire) SHALL NOT take effect on the player.

#### Scenario: Input ignored during pause

- **WHEN** the player holds Right or presses Z during pause
- **THEN** the player's velocity does not change
- **AND** no bullet is emitted

### Requirement: Timer is suspended during pause

The Phase-6 countdown timer SHALL NOT decrement while `PauseScene` is active.

#### Scenario: Timer holds value during pause

- **WHEN** the timer reads `45` and the player pauses for 5 seconds
- **THEN** on resume the timer still reads `45`
