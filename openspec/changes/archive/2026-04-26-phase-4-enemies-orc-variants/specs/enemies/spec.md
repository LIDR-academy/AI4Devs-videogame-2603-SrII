## ADDED Requirements

### Requirement: Three enemy variants are defined

`config.js` SHALL export an `ENEMY_VARIANTS` map with exactly three keys: `grunt`, `shooter`, `jumper`. Each entry SHALL contain `tint`, `scale`, `hp`, `speed`, and `behaviorId`, plus any variant-specific tuning. All three variants SHALL render using the Orc sprite set with no new art added.

#### Scenario: Three variants exist with required keys

- **WHEN** `ENEMY_VARIANTS` is read
- **THEN** it has exactly the keys `grunt`, `shooter`, `jumper`
- **AND** each entry has at least `tint`, `scale`, `hp`, `speed`, `behaviorId`

#### Scenario: All variants share the Orc sprite set

- **WHEN** any enemy is rendered
- **THEN** its texture is one of the loaded Orc sprite sheets (`orc-idle`, `orc-walk`, `orc-attack`, `orc-hurt`, `orc-death`)

### Requirement: Grunt walks toward the player on the ground

The grunt variant SHALL move horizontally toward the player at its configured speed and play the walk animation while moving. It SHALL NOT jump or fire projectiles.

#### Scenario: Grunt approaches the player

- **WHEN** a grunt is alive and the player is to its right
- **THEN** the grunt's horizontal velocity is `+grunt.speed`
- **AND** the grunt's walk animation plays

- **WHEN** the player is to the grunt's left
- **THEN** the grunt's horizontal velocity is `-grunt.speed`

#### Scenario: Grunt does not jump or fire

- **WHEN** a grunt is alive
- **THEN** no enemy bullet is emitted by the grunt
- **AND** the grunt's vertical velocity is zero except under gravity (no upward impulses)

### Requirement: Shooter is stationary and fires arrows on a timer

The shooter variant SHALL remain stationary and SHALL emit an enemy bullet every `shooter.fireIntervalMs` while it is within the camera's visible bounds. The emitted bullet SHALL come from the same bullet pool as player bullets, with `friendly: false`, tinted to indicate enemy origin, and travel horizontally toward the player.

#### Scenario: Shooter stays put

- **WHEN** a shooter is alive
- **THEN** its horizontal velocity is zero
- **AND** its position does not change horizontally over time

#### Scenario: Shooter fires periodically when on-screen

- **WHEN** a shooter is alive and inside the camera's visible bounds
- **THEN** an enemy bullet is emitted every `shooter.fireIntervalMs`

#### Scenario: Shooter does not fire off-screen

- **WHEN** a shooter is alive but outside the camera's visible bounds
- **THEN** no enemy bullet is emitted

#### Scenario: Enemy bullets are visually distinct

- **WHEN** an enemy bullet is rendered
- **THEN** it is tinted differently from player bullets (e.g. red vs. white)

### Requirement: Jumper hops along the ground toward the player

The jumper variant SHALL move horizontally toward the player at its configured speed while applying a vertical impulse every `jumper.jumpIntervalMs` whenever it is on the ground.

#### Scenario: Jumper hops periodically

- **WHEN** a jumper is alive and on the ground
- **THEN** every `jumper.jumpIntervalMs`, its vertical velocity becomes `-jumper.jumpVelocity`

#### Scenario: Jumper homes horizontally

- **WHEN** a jumper is alive
- **THEN** its horizontal velocity points toward the player at `±jumper.speed`

### Requirement: Variants are visually distinct via tint and scale

Each variant SHALL apply its `tint` and `scale` to its sprite at construction. The three variants SHALL be visually distinguishable at a glance during playtest.

#### Scenario: Tint and scale applied at spawn

- **WHEN** an enemy is spawned with variant `grunt`
- **THEN** its sprite tint equals `ENEMY_VARIANTS.grunt.tint`
- **AND** its scale equals `ENEMY_VARIANTS.grunt.scale`

- **WHEN** an enemy is spawned with variant `shooter`
- **THEN** its sprite tint equals `ENEMY_VARIANTS.shooter.tint`
- **AND** its scale equals `ENEMY_VARIANTS.shooter.scale`

- **WHEN** an enemy is spawned with variant `jumper`
- **THEN** its sprite tint equals `ENEMY_VARIANTS.jumper.tint`
- **AND** its scale equals `ENEMY_VARIANTS.jumper.scale`

### Requirement: Spawner caps live enemies at `ENEMY_MAX_ON_SCREEN`

`EnemySpawner` SHALL attempt to spawn one enemy every `ENEMY_SPAWN_INTERVAL_MS`. If the live enemy count is at or above `ENEMY_MAX_ON_SCREEN`, the spawn attempt SHALL be skipped (not queued). Spawns SHALL occur just outside the camera's left or right edge, clamped to the level bounds.

#### Scenario: Cap is respected under sustained spawning

- **WHEN** the spawner has been running for any duration with `ENEMY_MAX_ON_SCREEN = 5`
- **THEN** the count of active enemies never exceeds `5`

#### Scenario: Spawn position is just off-screen

- **WHEN** an enemy spawns
- **THEN** its initial x is within a small margin outside the camera's left or right edge
- **AND** its initial x is inside the level bounds `[0, LEVEL_WIDTH_SCREENS * GAME_WIDTH]`

#### Scenario: Variant choice is randomized

- **WHEN** the spawner emits 100 enemies
- **THEN** all three variants have appeared at least once

### Requirement: Player bullets damage enemies

A bullet with `friendly: true` overlapping an enemy SHALL reduce the enemy's HP by 1 and trigger the hurt animation. The bullet SHALL despawn on hit.

#### Scenario: Single hit reduces HP

- **WHEN** a friendly bullet overlaps a 2-HP enemy
- **THEN** the bullet despawns
- **AND** the enemy's HP becomes 1
- **AND** the enemy plays its hurt animation

#### Scenario: Lethal hit kills the enemy

- **WHEN** a friendly bullet overlaps a 1-HP enemy
- **THEN** the bullet despawns
- **AND** the enemy plays its death animation
- **AND** on death-animation completion the enemy is deactivated

### Requirement: Player and enemies collide physically

`GameScene` SHALL register a collider between the player and the enemy group so their bodies do not overlap.

#### Scenario: Player and enemy bodies do not pass through

- **WHEN** the player walks into a grunt
- **THEN** the player's position is constrained by the grunt's body (and vice versa)
- **AND** neither body penetrates the other

### Requirement: Enemy tuning constants live in `config.js`

`config.js` SHALL export `ENEMY_MAX_ON_SCREEN = 5`, `ENEMY_SPAWN_INTERVAL_MS`, and `ENEMY_VARIANTS` (with all per-variant tuning). No enemy-related numeric value SHALL be hard-coded in `Enemy.js`, `EnemySpawner.js`, or `GameScene.js`.

#### Scenario: All tuning is centralized

- **WHEN** `Enemy.js`, `EnemySpawner.js`, and `GameScene.js` are searched for enemy-related magic numbers
- **THEN** none are found; all values come from `config.js`
