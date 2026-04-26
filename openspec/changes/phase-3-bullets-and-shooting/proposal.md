## Why

Phase 2 puts a Soldier on the ground. Phase 3 gives that Soldier its core verb: **shoot**. Without a working bullet system, Phases 4–8 cannot be built — enemies need something to die to, and shooter-type enemies need to reuse the same projectile pool. Establishing the bullet implementation now (object pool, fire cadence, despawn rules) sets the contract every later projectile relies on.

This is also the first place where input *during gameplay* (not just menu navigation) gets wired up, so the input handling pattern Phase 2 used for movement extends to a discrete "fire" action with cooldown.

## What Changes

- New entity module `contra-AC/src/entities/Bullet.js` exposing a Phaser physics group with a recycle/object-pool pattern. Bullets travel horizontally in the direction the player faces.
- `Player.js` gains a fire input (`Z`, `X`, or left mouse button), an attack animation that plays on each shot, and a fire-cooldown gate so holding the button fires at a steady cadence rather than every frame.
- `BootScene` preloads the Arrow projectile sprite from `contra-AC/resources/Arrow(Projectile)/` and the Soldier `Attack01` sprite sheet for the firing animation.
- Bullets despawn (return to the pool) when they leave the camera view or collide with the ground.
- A placeholder shoot SFX is wired (a `jsfxr`-style synthesized blip is acceptable for this phase; real SFX lands in Phase 8).
- `src/config.js` gains: `PLAYER_FIRE_COOLDOWN_MS`, `BULLET_SPEED`, `BULLET_LIFETIME_MS` (safety net so off-screen bullets always die), and the bullet sprite scale factor.

## Capabilities

### New Capabilities
- `combat-shooting`: the bullet pool, the player's fire input + cooldown + animation, projectile lifetime/cleanup, and the placeholder shoot SFX wiring.

### Modified Capabilities
- `player-movement`: the player class now also handles fire input and plays an attack animation. Movement and facing are unchanged, but the input map widens.

## Impact

- **New files:** `contra-AC/src/entities/Bullet.js`.
- **Modified files:** `contra-AC/src/entities/Player.js`, `contra-AC/src/scenes/BootScene.js`, `contra-AC/src/scenes/GameScene.js`, `contra-AC/src/config.js`.
- **Assets used (read-only):** `contra-AC/resources/Arrow(Projectile)/Arrow01(100x100).png` (or the 32×32 variant — chosen at task time), `contra-AC/resources/Characters(100x100)/Soldier/Attack01.png`.
- **Performance:** the bullet group is instantiated once in `GameScene.create` with a max-size cap and reused via `getFirstDead(true)` to avoid per-shot allocation.
- **Constraints honored:** code remains under `/contra-AC`, no build step, no new frameworks.
- **Out of scope:** no enemies to hit (Phase 4 owns enemy collision), no spread/diagonal fire, no power-ups, no real shoot SFX (Phase 8).
