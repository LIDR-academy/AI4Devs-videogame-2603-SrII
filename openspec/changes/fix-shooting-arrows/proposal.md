## Why

The bullet pool has a recycle bug: bullets that have been despawned via `disableBody(true, true)` come back from `pool.get()` with `body.enable === false`, so when `Bullet.fire()` sets velocity it has no effect — the sprite renders at the spawn point but never moves.

In normal play this presents as "shoot multiple times, sometimes the arrow goes out, sometimes it just freezes and doesn't go". The first ~7 player bullets work because Phaser's group creates **fresh** instances (whose body defaults to `enable=true`); after those bullets despawn, every subsequent fire pulls a recycled-but-still-disabled instance and the bullet appears stuck. Same path for enemy bullets, which become silent duds after the first fire wave.

Reproduced via Playwright with the live game: shot 0 moved 70 px in 100 ms; shots 1–11 (every recycle) reported `body.enable=false`, `velocity.x=600` (set, not honored), and `Δx=0` over the same 100 ms. Confirmed root cause.

## What Changes

- `Bullet.fire(x, y, dirX, friendly)` SHALL re-enable the body when reusing a recycled instance, so velocity takes effect on every fire — not only the first one out of construction.
- The despawn path stays as-is (`disableBody(true, true)`); the fix is purely in the recycle path. Switch the manual `setActive` / `setVisible` / `body.reset` triplet to a single `enableBody(true, x, y, true, true)` call, which resets position, re-enables the body, and toggles active+visible — Phaser's documented one-shot for pool revival.
- No spec changes (existing combat-shooting requirements already say "bullets travel horizontally at `BULLET_SPEED`" and "firing recycles dead bullets"). The current behavior violates both intermittently — this change makes the implementation match the spec.

## Capabilities

### New Capabilities
<!-- None — bug fix only. -->

### Modified Capabilities
<!-- None — no requirement deltas. The combat-shooting spec already mandates this behavior; the implementation is being brought into line. -->

## Impact

- **Files changed:** `contra-AC/src/entities/Bullet.js` (one method, ~3 lines net).
- **No new files, no constants added, no API changes** for callers (`Player.tryFire`, shooter enemies' `behaviorStandShoot`).
- **Affected behavior:** every recycled bullet will move correctly. Visible improvement: any sustained fire (player held Z, multiple shooter enemies firing) becomes consistent instead of "first wave shoots, rest freeze".
- **Out of scope:** no tuning changes (cooldown, speed, lifetime stay where they are). No bullet-vs-bullet cancel. No new pool semantics.
