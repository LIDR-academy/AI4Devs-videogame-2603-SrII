## ADDED Requirements

### Requirement: BootScene preloads Phase-2 assets

`BootScene.preload()` SHALL load the Soldier `Idle` and `Walk` sprite sheets and the grass tileset image. Other Soldier sheets (Attack, Hurt, Death) SHALL NOT be loaded in this phase.

#### Scenario: Required Phase-2 assets load

- **WHEN** `BootScene.preload()` runs
- **THEN** `Soldier/Idle.png` is loaded as a sprite sheet with the correct frame size
- **AND** `Soldier/Walk.png` is loaded as a sprite sheet with the correct frame size
- **AND** `grass tileset.png` is loaded as an image

#### Scenario: Other sheets are not preloaded yet

- **WHEN** `BootScene.preload()` is inspected
- **THEN** it does not load `Attack01.png`, `Attack02.png`, `Attack03.png`, `Hurt.png`, or `Death.png`

### Requirement: Arcade Physics is enabled

The Phaser `Game` config SHALL enable Arcade Physics with world gravity set from `config.js`.

#### Scenario: Physics is configured at game-config time

- **WHEN** the Phaser game instance is constructed
- **THEN** `physics.default === 'arcade'`
- **AND** `physics.arcade.gravity.y === GRAVITY`

### Requirement: GameScene hosts the level, not a placeholder

`GameScene.create()` SHALL build the playable level (ground + player + camera bounds) and SHALL NOT render the Phase-1 placeholder rectangle or label.

#### Scenario: Placeholder is removed

- **WHEN** `GameScene.create()` runs
- **THEN** there is no centered "Game Scene (placeholder)" text on the canvas
- **AND** the camera background color is the sky color, not the Phase-1 placeholder color

#### Scenario: Player and ground are present

- **WHEN** `GameScene.create()` finishes
- **THEN** the scene contains a Player entity and a tiled ground covering the full level width
