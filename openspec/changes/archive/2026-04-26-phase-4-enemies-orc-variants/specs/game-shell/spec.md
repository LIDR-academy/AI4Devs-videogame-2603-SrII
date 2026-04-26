## ADDED Requirements

### Requirement: BootScene preloads Orc sprite set

`BootScene.preload()` SHALL load the Orc `Idle`, `Walk`, `Attack01`, `Hurt`, and `Death` sprite sheets and SHALL register `orc-idle`, `orc-walk`, `orc-attack`, `orc-hurt`, and `orc-death` animations.

#### Scenario: Orc assets and animations are registered

- **WHEN** the title scene is reached
- **THEN** all five Orc sprite sheets have loaded
- **AND** each has a corresponding registered animation key
