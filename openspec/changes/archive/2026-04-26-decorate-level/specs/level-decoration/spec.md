## ADDED Requirements

### Requirement: Decorations are configurable in `config.js`

`config.js` SHALL export a `DECORATIONS` array and a `DECORATION_SCALE` constant. Each entry SHALL reference a single 16×16 tile from the `grass-tileset` spritesheet via a `frame: N` field, with an optional per-entry `scale` to override `DECORATION_SCALE`. Adding, removing, repositioning, or rescaling a decoration SHALL be possible by editing only this array.

#### Scenario: DECORATIONS array exists with required shape

- **WHEN** `config.js` is imported
- **THEN** `DECORATIONS` is an array
- **AND** every element has a numeric `x` field and a numeric `frame` field
- **AND** an element MAY additionally have a numeric `scale` field that overrides `DECORATION_SCALE`
- **AND** `DECORATION_SCALE` resolves to a positive number

#### Scenario: Editing DECORATIONS changes the rendered level without scene edits

- **WHEN** an entry is added, removed, or its `x`/`frame` is changed in `config.js`
- **AND** the page is reloaded
- **THEN** the rendered level reflects the change with no edit to `GameScene.js`

### Requirement: Each decoration renders bottom-anchored on the grass surface

For every entry in `DECORATIONS`, `GameScene` SHALL place an `Image` GameObject using the `grass-tileset` texture and the entry's `frame`, with origin `(0.5, 1)`, y equal to `GAME_HEIGHT - GROUND_HEIGHT`, and scale equal to the entry's `scale` if present, otherwise `DECORATION_SCALE`.

#### Scenario: Decoration sits on the grass

- **WHEN** a decoration is rendered
- **THEN** its bottom edge is at the same world Y as the top of the grass tile

#### Scenario: Per-entry scale override

- **WHEN** a decoration entry has a `scale` field
- **THEN** the rendered sprite uses that scale instead of `DECORATION_SCALE`

#### Scenario: Default scale applies when no override

- **WHEN** a decoration entry has no `scale` field
- **THEN** the rendered sprite uses `DECORATION_SCALE`

### Requirement: Decorations render between the ground and the player

Decorations SHALL be added to the scene after the ground `TileSprite` objects and before the `Player` is created. They SHALL NOT have a physics body.

#### Scenario: Player draws in front of decorations

- **WHEN** the player runs through the X position of a decoration
- **THEN** the player sprite renders on top of the decoration (the decoration is behind the player)

#### Scenario: Decorations have no physics body

- **WHEN** any decoration GameObject is inspected
- **THEN** it has no `body` property attached
- **AND** colliders/overlaps registered in `GameScene` are not affected by it

### Requirement: Variety across the level

The shipped `DECORATIONS` array SHALL contain at least 12 entries spanning the full level width. The set SHALL include at least one tree (frame 150, larger scale), at least one standalone bush (frame 149), at least one flower (frame 125), and at least one sign (frame 148).

#### Scenario: Every screen has at least one decoration

- **WHEN** the level is divided into three equal-width screens (`x ∈ [0, GAME_WIDTH)`, `[GAME_WIDTH, 2*GAME_WIDTH)`, `[2*GAME_WIDTH, 3*GAME_WIDTH)`)
- **THEN** each screen contains at least one decoration entry

#### Scenario: All four variants appear at least once

- **WHEN** the `frame` field of every entry is collected
- **THEN** the set contains 125 (flower), 148 (sign), 149 (bush), and 150 (tree)
