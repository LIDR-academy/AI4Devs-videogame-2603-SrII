# Contra-AC Roadmap

Phased build plan for the Contra-AC MVP. Each phase below is sized to be a single `openspec propose` change — one user-visible capability, scoped tight, with explicit non-goals so the proposal stays focused.

Read each phase as: *what the player can do or see after this phase ships.* Implementation order matters — later phases depend on earlier ones.

---

## Phase 1 — Bootstrap: empty game canvas runs in the browser

**Capability:** Open `index.html` in a static server and see a Phaser canvas with a placeholder "Contra-AC" title screen. Pressing any key advances to an empty gameplay scene with a colored background.

**Scope:**
- `index.html`, `styles.css`, `src/main.js`, `src/config.js`.
- Phaser 3 loaded from CDN; ES module entry point.
- Two scenes wired up: `BootScene` (preload nothing yet) → `TitleScene` (text + "Press any key") → `GameScene` (empty colored rect).
- `src/config.js` exports `GAME_WIDTH`, `GAME_HEIGHT`, `LEVEL_DURATION_SECONDS=90`, `PLAYER_MAX_HP=3`.

**Non-goals:**
- No assets loaded yet. No player, no enemies, no input beyond "any key to start".
- No game-over or victory scenes yet.

**Done when:** running a local static server, the page loads, the title appears, a keypress switches to the gameplay scene with a colored background.

---

## Phase 2 — Player: a controllable Soldier on a tiled ground

**Capability:** In `GameScene`, the Soldier sprite spawns on a tiled grass ground, runs left/right with arrow keys *or* WASD, and jumps with Space. Walking and idle animations play.

**Scope:**
- Preload Soldier sprite sheets and `grass tileset.png` in `BootScene`.
- Build a static ground using the grass tileset across ~3 screen widths.
- `src/entities/Player.js` — physics body, walk/idle animations, gravity, jump (single jump only).
- Keyboard controller supporting both arrow keys and WASD; Space = jump.
- Camera follows the player horizontally; player cannot leave the level bounds.
- Tuning constants in `config.js`: `PLAYER_RUN_SPEED`, `PLAYER_JUMP_VELOCITY`, `GRAVITY`, `LEVEL_WIDTH_SCREENS=3`.

**Non-goals:**
- No shooting yet. No crouching. No double jump. No HP UI yet.
- No enemies, no projectiles, no win/lose state.

**Done when:** player can run end-to-end across the level, jump, animations look right, camera follows smoothly.

---

## Phase 3 — Combat: shoot bullets with the gun

**Capability:** Pressing Z / X / left-mouse fires an arrow projectile horizontally in the direction the player is facing. Bullets despawn after leaving the screen or hitting the ground.

**Scope:**
- `src/entities/Bullet.js` — Phaser physics group, recycled via object pool.
- Player attack animation plays on fire.
- Fire rate cap and bullet speed in `config.js` (`PLAYER_FIRE_COOLDOWN_MS`, `BULLET_SPEED`).
- SFX: shoot sound (placeholder beep is fine if no asset yet).

**Non-goals:**
- No power-ups, no spread shot, no aiming up/down/diagonal.
- Bullets do not yet hit anything (no enemies exist yet).

**Done when:** holding fire produces a steady stream of bullets at the configured cooldown, bullets travel in the correct direction, sprite animation plays.

---

## Phase 4 — Enemies: three Orc-based variants spawn and threaten

**Capability:** Three enemy types appear during gameplay using the Orc sprite sheet, distinguished by **tint + scale + behavior**:
- **Grunt** — walks toward the player on the ground.
- **Shooter** — stationary, fires arrow projectiles at the player on a timer.
- **Jumper** — hops along the ground in arcs toward the player.

Spawning is randomized but capped so 3–5 enemies are alive at any time. Enemies and player can collide; enemy bullets exist.

**Scope:**
- `src/entities/Enemy.js` base class + grunt/shooter/jumper variants (parameterized in `config.js`, not subclassed unless behavior diverges).
- Enemy spawner module: random pick from variants, spawn at off-screen edges, respect on-screen cap.
- Enemy projectile reuses the `Bullet` pool with a different tint.
- Hurt / death animations play; enemy is removed after death animation.
- Tuning in `config.js`: `ENEMY_MAX_ON_SCREEN=5`, `ENEMY_SPAWN_INTERVAL_MS`, per-variant speed and HP.

**Non-goals:**
- No score yet. No damage to player yet (enemies are visible and mobile but cannot hurt the Soldier).
- No boss. No enemy variety beyond the three.

**Done when:** play the level and see all three Orc variants spawning, behaving differently, and dying when shot.

---

## Phase 5 — Damage, lives, and game-over loop

**Capability:** Player takes 1 HP of damage on contact with an enemy or enemy bullet (with a brief invulnerability window). HP UI is visible. At 0 HP the game transitions to the Game Over screen, which can restart the run.

**Scope:**
- Player HP state in `Player.js`; brief i-frames after a hit (config: `PLAYER_HIT_IFRAMES_MS`).
- Hurt / death animations and SFX.
- HUD: HP indicator (3 hearts or pips) and score placeholder, drawn by `GameScene`.
- `GameOverScene` with "Press any key to retry" → returns to `TitleScene`.

**Non-goals:**
- No persistent score. No leaderboards. No checkpoints.

**Done when:** player can take 3 hits, dies on the third, sees a Game Over screen, and can retry from the title.

---

## Phase 6 — Win condition, timer, and Victory screen

**Capability:** A countdown timer ticks down from 90 seconds in the HUD. A goal marker exists at the right edge of the level — touching it transitions to the Victory screen. If the timer hits 0 before reaching the goal, transition to Game Over.

**Scope:**
- HUD timer wired to `LEVEL_DURATION_SECONDS`.
- Goal marker entity at the right edge; collision triggers victory.
- `VictoryScene` — "Level cleared!" + score readout + "Press any key to play again".
- Game Over wiring updated to also fire on timer expiry.

**Non-goals:**
- No multiple levels. No persistence between runs.

**Done when:** finishing the level shows the Victory screen; running out the timer shows Game Over.

---

## Phase 7 — Score and pause

**Capability:** Killing an enemy increments a score shown in the HUD. Pressing P or Escape during gameplay opens a Pause overlay; resuming returns to gameplay with the timer paused.

**Scope:**
- Score state in `GameScene`; per-variant score values in `config.js`.
- `PauseScene` rendered as an overlay (does not stop the underlying scene's render but stops its update).
- Score is displayed on Victory and Game Over screens.

**Non-goals:**
- No `localStorage` high score (out of MVP scope per design doc).
- No pause-menu controls beyond resume / quit-to-title.

**Done when:** score updates as enemies die; P/Esc pauses and resumes correctly; final score appears on end screens.

---

## Phase 8 — Audio polish and final pass

**Capability:** SFX play for shoot, enemy hit, player hit, player death, and victory. Sprite tinting and timing tuned so the three enemy variants are visually distinct.

**Scope:**
- Source short, royalty-free SFX (or generate placeholders via `jsfxr`-style snippets).
- Add audio mute toggle (M key).
- Visual tuning pass: enemy tint colors, hitbox sizes, screen-shake on player damage, animation speeds.
- Final playtest checklist: golden path (start → run → shoot → win) and at least one death path.

**Non-goals:**
- No background music (per design).
- No graphical settings menu.

**Done when:** the full game loop feels coherent end-to-end; an outside playtester can start the game and complete or die without instructions beyond what's on the title screen.

---

## Cut from MVP (explicit non-goals for the whole project)

- Multiple levels / world map.
- Power-ups, weapon upgrades, spread shot, multi-direction aim.
- Boss fights.
- Background music.
- Persistent high scores or accounts.
- Mobile / touch controls.
- Co-op or multiplayer.
- Cutscenes or story.

These are deliberately out of scope so the MVP ships. They become candidates for follow-up `openspec propose` rounds *after* Phase 8 is archived.
