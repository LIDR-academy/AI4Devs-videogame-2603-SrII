## Context

Phase 1 left the project with a working Phaser shell and a placeholder `GameScene`. Phase 2 must turn that into a real level: a Soldier that responds to input, gravity, and a tiled ground spanning ~3 screens. Every later phase (combat, enemies, damage, win condition) calibrates against the player's run speed, jump arc, and the level's pixel layout — so getting these tuned and centralized in `config.js` is the most important durable outcome of this phase, alongside the runnable feature itself.

Constraints carried over from Phase 1: no build step, no frameworks beyond Phaser 3 + pure CSS, all code under `/contra-AC`, tuning constants live in `src/config.js`.

## Goals / Non-Goals

**Goals:**
- A Soldier sprite that runs left/right with arrow keys *or* WASD and jumps with Space, with walking and idle animations.
- A static ground built from `grass tileset.png`, spanning `LEVEL_WIDTH_SCREENS × GAME_WIDTH` pixels horizontally.
- Camera follows the player horizontally, clamped to the level's left/right bounds.
- All physics tuning (run speed, jump velocity, gravity) lives in `config.js`.

**Non-Goals:**
- No shooting (Phase 3), enemies (Phase 4), damage/HP UI (Phase 5), timer/win/lose (Phases 5–6).
- No double jump, wall jump, crouch, prone, or any aerial control beyond a single horizontal run-while-airborne.
- No vertical platforms or pits — the ground is a flat strip.
- No background parallax (post-MVP).

## Decisions

### Decision 1: Phaser Arcade Physics, not Matter

**Choice:** Enable Phaser's built-in Arcade Physics in the game config (`physics: { default: 'arcade', arcade: { gravity: { y: GRAVITY }, debug: false } }`).

**Why:**
- Arcade is what every Contra-style game ships on: AABB colliders, simple gravity, fast. Matter is overkill for a flat-floor side-scroller and is harder to tune.
- Setting world gravity on the physics world (rather than per-body) means `Player.js` doesn't need to apply gravity manually — it just sets `body.allowGravity = true`.
- Debug rendering is a one-flag flip during physics tuning sessions.

**Alternatives considered:** Matter (rejected — heavier, no benefit at this scope); custom integration (rejected — reinventing what Phaser ships).

### Decision 2: Ground built from a `TileSprite`, not a tilemap

**Choice:** Build the ground as a single horizontally-tiled `Phaser.GameObjects.TileSprite` whose width is `LEVEL_WIDTH_SCREENS * GAME_WIDTH` and whose height is the tile's height. Add a static physics body to it covering the same rectangle.

**Why:**
- The provided art is a single `grass tileset.png` strip, not a multi-tile authored map. There's no level data to load — just "grass repeats horizontally for 3 screens".
- A `TileSprite` is one game object, one physics body, one collider. A tilemap would require authoring a JSON/CSV layout and adding Tilemap parsing for a single repeating tile — pure ceremony.
- If Phase 6 later wants pits or platforms, *that* phase can introduce a tilemap. Doing it now is speculative.

**Alternatives considered:** Phaser tilemap (rejected — adds tooling and JSON for no current benefit); programmatically placing many `Image` instances (rejected — more bodies, slower).

### Decision 3: One `Player.js` class; input handled inline (for now)

**Choice:** `contra-AC/src/entities/Player.js` exports a class extending `Phaser.Physics.Arcade.Sprite`. It owns its keys (created from `this.scene.input.keyboard.addKeys('LEFT,RIGHT,UP,A,D,W,SPACE')`) and reads them in its own `update(delta)` method.

**Why:**
- The player is the only input consumer in Phase 2. Spinning up a separate `InputController` module now is premature; one file is easier to reason about.
- When Phase 3 adds fire input, `Player.js` extends to read fire keys too. If input grows further, a future phase can extract it — the cost of doing it then is small; the cost of doing it now is one extra abstraction with one consumer.

**Alternatives considered:** Separate input controller (rejected — premature); store keys on `GameScene` and pass to player (rejected — more plumbing for the same thing).

### Decision 4: Walk and Idle animations only — no Attack/Hurt/Death yet

**Choice:** `BootScene` loads only `Soldier/Idle.png` and `Soldier/Walk.png`. Animation keys: `'soldier-idle'`, `'soldier-walk'`. The other Soldier sheets (Attack01, Hurt, Death) wait for the phases that use them.

**Why:**
- Loading every sheet upfront is "no harm" technically but bloats `BootScene` and tempts the player class to wire animations it isn't using. Each later phase already preloads the assets *it* introduces.
- Frame counts vary per sheet — wiring one well-tested animation in Phase 2 is faster than wiring five at once.

**Alternatives considered:** Preload all Soldier sheets now (rejected — Phase 3+ owns those animations).

### Decision 5: Camera follows X only, clamped via `setBounds`

**Choice:** `this.cameras.main.setBounds(0, 0, LEVEL_WIDTH_SCREENS * GAME_WIDTH, GAME_HEIGHT)` and `this.cameras.main.startFollow(player, true, 0.1, 0)`. Vertical lerp is 0 because the camera doesn't track Y in Phase 2.

**Why:**
- Setting bounds prevents the camera from showing area outside the level (gray void) when the player is near the edges.
- A small horizontal lerp (0.1) softens the follow so a held jump doesn't whip the camera. Vertical lerp 0 keeps the horizon stable — useful when Phase 5 lays out a HUD.
- `setBounds` also gives `body.world.bounds` the right dimensions for clamping the player to the level.

### Decision 6: Single jump, ground-only, instant-velocity

**Choice:** On Space press, if `body.blocked.down` is true, set `body.setVelocityY(-PLAYER_JUMP_VELOCITY)`. No double jump, no variable height.

**Why:**
- Roadmap explicitly: "single jump only".
- Instant-velocity (set, not accumulate) is the standard arcade-platformer feel and the simplest to tune. Variable jump (cut velocity on key release) can land in a polish phase if needed; it's not a Phase 2 commitment.
- `body.blocked.down` is the Arcade-Physics way to detect "on the ground"; it's set when the body collided downward last frame.

### Decision 7: Tuning constants are uppercase named exports in `config.js`

**Choice:** Add `PLAYER_RUN_SPEED`, `PLAYER_JUMP_VELOCITY`, `GRAVITY`, `LEVEL_WIDTH_SCREENS = 3`, plus animation framerates as named constants.

**Why:**
- Consistent with Phase 1's pattern (named exports, not a config object). Keeps grep-ability and explicitness.
- Animation framerates centralized means a designer can adjust feel by editing one file. Otherwise they'd hide in scene/entity code.

## Risks / Trade-offs

- **Sprite sheet frame dimensions** → Mitigation: the `Characters(100x100)/Soldier/` set is named for 100×100 frames, but actual frame counts must be checked against the PNG before wiring `frameWidth`/`frameHeight`/`frames`. Tasks include a step to inspect the sheet and confirm dimensions before writing animation configs.
- **Ground collider height** → Mitigation: derive ground top-edge from `GAME_HEIGHT - GROUND_HEIGHT` (a new config constant). The player's spawn Y comes from the same constant so spawn-on-ground is a one-place tuning.
- **Camera follow jitter at level edges** → Mitigation: `setBounds` plus `setLerp(0.1, 0)` produces a stable feel; the small lerp covers tiny-pixel Y oscillation if any. If jitter shows up in playtest, the lerp value is the knob to turn.
- **CDN Phaser-version drift** → Already mitigated in Phase 1 (pinned URL). No change here.
- **Scope creep into "load all the assets while we're here"** → Mitigation: tasks list explicitly forbids preloading sprites this phase doesn't render.

## Migration Plan

Adding to a Phase-1 codebase. No data migration. Rollback = revert this change's diff; the Phase 1 placeholder still works.

## Open Questions

- **Exact `PLAYER_RUN_SPEED` and `PLAYER_JUMP_VELOCITY` values** are tuned by feel during playtest. Starting points: `RUN_SPEED = 220 px/s`, `JUMP_VELOCITY = 520 px/s`, `GRAVITY = 1400 px/s²`. The first playtest's job is to dial these to feel right — adjust in `config.js`, no code edits.
- **Air control**: should pressing Left/Right while airborne change horizontal velocity? Default to "yes, full control" since Contra historically allowed mid-air steering. If playtest disagrees, add a config toggle later.
