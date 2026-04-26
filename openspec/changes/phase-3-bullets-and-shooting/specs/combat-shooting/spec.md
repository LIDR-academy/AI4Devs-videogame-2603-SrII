## ADDED Requirements

### Requirement: Bullet pool exists and is reused

`GameScene` SHALL maintain a single bullet pool (a Phaser Arcade Physics group with a fixed `maxSize`) defined in `contra-AC/src/entities/Bullet.js`. Firing SHALL recycle dead bullets from the pool rather than allocating new sprites.

#### Scenario: Pool is created on scene start

- **WHEN** `GameScene.create()` runs
- **THEN** a single bullet pool exists with `maxSize` taken from `config.js`
- **AND** all members start in the dead state

#### Scenario: Firing recycles dead bullets

- **WHEN** the player fires
- **THEN** the bullet emitted is a previously-dead member of the pool that is reactivated and repositioned
- **AND** the pool's total member count does not exceed `maxSize`

### Requirement: Fire input fires bullets at a capped cadence

The player SHALL fire a bullet on `Z`, `X`, or left mouse button while at least `PLAYER_FIRE_COOLDOWN_MS` has elapsed since the last fire. Holding a fire input SHALL produce a steady stream at the cooldown rate.

#### Scenario: Single press fires once

- **WHEN** the player taps `Z`
- **THEN** exactly one bullet is emitted

#### Scenario: Held input produces a steady stream

- **WHEN** `Z` is held continuously for one second and `PLAYER_FIRE_COOLDOWN_MS` is `200`
- **THEN** approximately five bullets are emitted (within ±1 due to timing alignment)

#### Scenario: Cooldown gates rapid alternation

- **WHEN** the player presses `Z`, then `X` immediately afterwards within `PLAYER_FIRE_COOLDOWN_MS`
- **THEN** only one bullet is emitted from the pair

#### Scenario: Mouse click fires equivalently

- **WHEN** the left mouse button is pressed
- **THEN** a bullet is emitted using the same cooldown rules as keyboard fire

### Requirement: Bullets travel horizontally in the player's facing direction

A fired bullet SHALL spawn at the player's torso position with a horizontal velocity of `+BULLET_SPEED` if the player faces right or `-BULLET_SPEED` if the player faces left. Bullets SHALL NOT be affected by gravity.

#### Scenario: Bullet inherits facing

- **WHEN** the player fires while facing right
- **THEN** the bullet's velocity is `(+BULLET_SPEED, 0)`

- **WHEN** the player fires while facing left
- **THEN** the bullet's velocity is `(-BULLET_SPEED, 0)`

#### Scenario: Bullets ignore gravity

- **WHEN** a bullet is in flight
- **THEN** its vertical velocity remains zero throughout its lifetime

### Requirement: Bullets despawn when off-screen, on ground, or after lifetime

A bullet SHALL return to the pool (deactivate) when any of:
1. Its position leaves the camera's visible rectangle by more than a small margin.
2. It collides with the ground.
3. `BULLET_LIFETIME_MS` has elapsed since the bullet was spawned.

#### Scenario: Bullet leaving camera

- **WHEN** a bullet's x position exceeds the camera's right edge plus margin
- **THEN** the bullet is returned to the pool (`active = false`, `visible = false`)

#### Scenario: Bullet hitting the ground

- **WHEN** a bullet collides with the level ground
- **THEN** the bullet is returned to the pool

#### Scenario: Bullet exceeding lifetime

- **WHEN** a bullet has been alive for `BULLET_LIFETIME_MS` without otherwise despawning
- **THEN** the bullet is returned to the pool

### Requirement: Attack animation plays on fire

On every successful fire, the Soldier SHALL play the `soldier-attack` animation once and then return to the movement-appropriate animation (walk if moving, idle otherwise).

#### Scenario: Attack animation triggers and resolves

- **WHEN** a bullet is fired
- **THEN** the player's active animation becomes `soldier-attack`
- **AND** when the attack animation completes the active animation is `soldier-walk` (if moving) or `soldier-idle` (if stationary)

### Requirement: Placeholder shoot SFX plays on fire

A short audio cue SHALL play on each successful fire. The asset MAY be a synthesized placeholder in this phase; it is replaced with a real asset in Phase 8.

#### Scenario: Each fire plays one cue

- **WHEN** a bullet is emitted
- **THEN** exactly one shoot-SFX trigger occurs

### Requirement: Combat tuning constants live in `config.js`

`src/config.js` SHALL export `PLAYER_FIRE_COOLDOWN_MS`, `BULLET_SPEED`, `BULLET_LIFETIME_MS`, `BULLET_POOL_MAX_SIZE`, and `BULLET_SCALE` as named constants. No fire-related numeric value SHALL be hard-coded inside `Player.js`, `Bullet.js`, or `GameScene.js`.

#### Scenario: Constants exist with the expected names

- **WHEN** `config.js` is imported
- **THEN** the constants above resolve to numeric values

#### Scenario: No magic numbers in combat code

- **WHEN** `Player.js`, `Bullet.js`, and `GameScene.js` are searched for the literal values of those constants
- **THEN** they appear only as imports from `config.js`
