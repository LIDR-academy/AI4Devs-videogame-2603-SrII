## ADDED Requirements

### Requirement: Bullet pool supports a `friendly` flag

`Bullet.fire()` SHALL accept a boolean `friendly` parameter. The pool SHALL allow both player-origin (`friendly: true`) and enemy-origin (`friendly: false`) bullets to coexist as members of the same group.

#### Scenario: Friendly flag is set on fire

- **WHEN** the player fires
- **THEN** the emitted bullet's `friendly` is `true`

- **WHEN** a shooter enemy fires
- **THEN** the emitted bullet's `friendly` is `false`

#### Scenario: Tint reflects friendliness

- **WHEN** a bullet is rendered with `friendly: true`
- **THEN** its tint corresponds to the player-bullet color

- **WHEN** a bullet is rendered with `friendly: false`
- **THEN** its tint corresponds to the enemy-bullet color

### Requirement: Player bullets target enemies via overlap

`GameScene` SHALL register a `physics.add.overlap` between the bullet pool (filtered to friendly bullets) and the enemy group. Friendly bullets that overlap an enemy SHALL despawn on impact.

#### Scenario: Friendly bullet hits enemy

- **WHEN** a friendly bullet overlaps an active enemy
- **THEN** the bullet returns to the pool (active and visible become false)
- **AND** the enemy's hurt logic runs (HP decrement and hurt animation)

#### Scenario: Enemy bullets do not damage other enemies

- **WHEN** an enemy bullet overlaps another enemy
- **THEN** neither the enemy nor the bullet is affected
