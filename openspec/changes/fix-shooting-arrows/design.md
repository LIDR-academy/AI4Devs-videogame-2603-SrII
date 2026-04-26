## Context

Phase 3 introduced `Bullet` as a Phaser `Physics.Arcade.Sprite` recycled through a fixed-size group (`BULLET_POOL_MAX_SIZE = 32`). Phase 4 extended the same pool to enemy bullets. The despawn path uses `Body.disableBody(true, true)` everywhere (lifetime expiry, off-screen, ground hit, collision with target). That's the right call — it deactivates the sprite, hides it, and disables physics processing in one go.

The recycle path, however, was written before the team had absorbed how `disableBody` interacts with `Body.reset`. `Body.reset(x, y)` zeros velocity/acceleration and repositions the body but **does not** flip `body.enable` back to true. Result: every reused bullet appears at the spawn position, has its velocity set in code, but stays still because the physics step skips disabled bodies.

The repro: shot 0 (fresh instance from construction) moves 70 px in 100 ms; shots 1–11 (each recycled) all report `body.enable=false` and `Δx=0` despite `body.velocity.x=600`.

## Goals / Non-Goals

**Goals:**
- Recycled bullets behave identically to freshly-constructed ones.
- One implementation idiom that's hard to get wrong if a Phase 9+ ever adds another bullet path (e.g. spread shot).
- No changes to despawn rules, tunings, or pool size.

**Non-Goals:**
- No changes to `Bullet.preUpdate` (lifetime + off-screen checks are working).
- No changes to GameScene wiring or collider callbacks.
- No new spec requirements — this fix brings the implementation in line with existing combat-shooting requirements.

## Decisions

### Decision 1: Use `enableBody(true, x, y, true, true)` instead of the three-call sequence

**Choice:** Replace
```js
this.setActive(true);
this.setVisible(true);
this.body.reset(x, y);
```
with
```js
this.enableBody(true, x, y, true, true);
```

**Why:**
- Phaser's `enableBody(reset, x, y, enableGameObject, showGameObject)` is the documented inverse of `disableBody`. It atomically: re-enables the body, repositions to (x, y) with zero velocity, sets the GameObject active, and makes it visible. No way to forget a step.
- Reading the call site, `enableBody(true, x, y, true, true)` is more obviously the recycle entry point than the three separate calls — when someone scans for the "where does a bullet come back to life" line, this is unambiguous.
- Symmetry with `disableBody(true, true)` on the despawn side. Both calls live in the same file; both are one line.

**Alternatives considered:**
- Adding `this.body.enable = true` after `reset(x, y)` — works, but it's the kind of one-liner that future code touching `fire()` could move/delete without realizing why it's there. Easier to lose during refactors than the explicit `enableBody` call.
- Restructuring the pool to never call `disableBody` (instead just `setActive(false)`) — preserves body state but defeats the purpose of disabling: physics step would still iterate the dead bodies, bullets could still trigger collisions/overlaps while "dead". Wrong direction.

### Decision 2: Set velocity *after* `enableBody`

**Choice:** `enableBody` zeros velocity (its `reset=true` arg). Subsequent `body.setVelocity(dirX * BULLET_SPEED, 0)` sets the desired velocity. Order matters — setting velocity first then calling `enableBody(true, ...)` would zero it back.

**Why:**
- Documented behavior. `enableBody(true)` calls `body.reset()` which resets velocity to (0,0). Calling `setVelocity` after is the only correct order.
- Easy to break in a refactor; a comment in the file explains the order.

### Decision 3: Keep `body.allowGravity = false` setting

**Choice:** After `enableBody`, set `this.body.allowGravity = false` (existing line stays). World gravity is set in `main.js`; bullets must opt out per-body.

**Why:**
- `enableBody`'s reset doesn't change `allowGravity`. The flag persists across enable/disable cycles. So technically setting it once at construction would work — but the explicit per-fire setting is cheap insurance against a future refactor that ever toggles it on a recycled instance.

## Risks / Trade-offs

- **Existing collider callbacks fire on `(bullet, ground)` etc.** — they call `bullet.disableBody(true, true)`. After the fix, those still work. Mitigation: not changing the despawn path.
- **Pool size cap could feel different now that bullets actually persist for their full lifetime** → They already did; the bug only made them appear to despawn instantly. In normal play with cooldown 200 ms and lifetime 1500 ms, max simultaneous bullets is ~7-8 — nowhere near the 32 cap. No tuning change needed.
- **Enemy bullets** use the same `Bullet.fire` path. After the fix, shooter enemies will reliably emit moving arrows where before they often emitted invisible-after-first-wave duds. Difficulty effectively *increases* slightly. Tuning (`shooter.fireIntervalMs`, `hp`) is unchanged; if the new honest behavior feels harder, the fix is in `config.js`, not the bullet code.

## Migration Plan

Single-file diff in `Bullet.js`. No data migration. Rollback = revert the file.

## Open Questions

- **Should we add an automated assertion test?** OpenSpec MVP is "manual playtest is the test suite" — no Jest/Vitest harness exists. The Playwright-driven repro plus a fix-verification screenshot (12 fired bullets all moving) is the validation. If a regression hits this same path again, future investigators can re-run that recipe.
