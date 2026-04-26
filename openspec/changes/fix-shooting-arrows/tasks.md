## 1. Reproduce the bug

- [x] 1.1 Confirm the symptom in the live game via Playwright. — Reproduced: shot 0 (fresh) moved 70 px in 100 ms; shots 1–11 (recycled) all reported `body.enable=false` and `Δx=0` despite `velocity.x=600`. Recipe: spawn bullets via `gs.bullets.get().fire(...)`, immediately `disableBody(true, true)`, repeat. Sample velocity + position 100 ms after each fire.

## 2. Fix

- [x] 2.1 In `contra-AC/src/entities/Bullet.js`, replace the recycle setup in `fire(x, y, dirX, friendly)` — `setActive(true)` + `setVisible(true)` + `body.reset(x, y)` — with `this.enableBody(true, x, y, true, true)`. Keep the subsequent `body.allowGravity = false` and `body.setVelocity(...)` lines, in that order (velocity must be set *after* `enableBody`'s reset zeros it).
- [x] 2.2 Add a one-line comment above the velocity assignment noting that it must follow `enableBody`, since `enableBody(true, ...)` zeros velocity as part of its reset. — Inline comment placed above the `enableBody` call explaining the recycle issue and the velocity-after-reset requirement.

## 3. Verify

- [x] 3.1 **Repro test (Playwright):** re-run the same script that reproduced the bug — fire 12 bullets in succession with `disableBody` between each. Every shot should report `body.enable=true` and `Δx ≈ 60–80 px` over the 100 ms sample window. — All 12 shots: `bodyEnabled=true`, `vx=600`, `moved=60–70 px`. (Pre-fix: shots 1–11 reported `bodyEnabled=false`, `moved=0`.)
- [x] 3.2 **In-browser playtest:** start a fresh run, hold Z continuously for ~5 seconds. Every emitted arrow should travel forward at the same speed; no frozen arrows next to the player. — Held Z for 1.5 s (shorter due to lifetime/off-screen despawning the leading edge); 6 active bullets sampled, all with `velocity.x=600`, all `body.enable=true`.
- [x] 3.3 **Enemy-bullet check:** advance the camera to bring a shooter enemy on-screen; observe its arrows over ~10 seconds. Each emitted arrow should travel toward the player; none should freeze. — Spawned a shooter at x=1100 with the player parked at x=100; observed enemy bullet `vx=-600`, body enabled, traveling leftward toward player. Subsequent samples returned 0 because each bullet hit the (invulnerable) player and despawned via the existing player↔bullet overlap.
- [x] 3.4 Run `openspec validate fix-shooting-arrows` and confirm valid.
- [x] 3.5 Commit: `fix: re-enable bullet body on recycle so reused arrows actually move`.
