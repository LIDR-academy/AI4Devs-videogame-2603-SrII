## ADDED Requirements

### Requirement: Recycled bullets fire identically to fresh ones

When `Bullet.fire(x, y, dirX, friendly)` is invoked on a sprite that was previously despawned via `disableBody(true, true)`, the bullet SHALL move at the configured `BULLET_SPEED` exactly as a freshly-constructed bullet would. Recycled bullets SHALL NOT remain stationary at the spawn position.

#### Scenario: First fire after recycle moves at full speed

- **WHEN** a bullet has been despawned (via lifetime, off-screen, or collision)
- **AND** the pool returns that same instance to a subsequent `pool.get()` call
- **AND** `fire(x, y, dirX, friendly)` is invoked on it
- **THEN** the bullet's body has `enable === true`
- **AND** within 100 ms the bullet has moved by approximately `BULLET_SPEED * 0.1` pixels in the `dirX` direction

#### Scenario: Many sequential fires all move

- **WHEN** the player fires 12 bullets in succession with each preceding bullet despawned before the next fire
- **THEN** every one of the 12 bullets travels horizontally at `BULLET_SPEED`
- **AND** none of them remain stuck at the spawn position
