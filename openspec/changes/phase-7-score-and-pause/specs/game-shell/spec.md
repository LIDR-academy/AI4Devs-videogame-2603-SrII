## ADDED Requirements

### Requirement: PauseScene is registered in main.js

The Phaser game's scene list SHALL include `PauseScene` after `VictoryScene`.

#### Scenario: Scene order is preserved

- **WHEN** the scene list is inspected
- **THEN** the order is `[BootScene, TitleScene, GameScene, GameOverScene, VictoryScene, PauseScene]`
