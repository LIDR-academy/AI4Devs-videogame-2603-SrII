## ADDED Requirements

### Requirement: VictoryScene is registered in main.js

The Phaser game's scene list SHALL include `VictoryScene` after `GameOverScene`.

#### Scenario: Scene order is preserved

- **WHEN** the scene list is inspected
- **THEN** the order is `[BootScene, TitleScene, GameScene, GameOverScene, VictoryScene, ...]`
