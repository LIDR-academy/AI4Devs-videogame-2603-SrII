## ADDED Requirements

### Requirement: Ground visual is built from atlas tiles, not the whole tileset bitmap

The level ground SHALL be rendered using individual cells from the `grass-tileset` atlas — a grass-top tile across the top edge and a dirt-fill tile across the body — rather than tiling the entire 384×128 source PNG.

#### Scenario: Demo-mockup content does not appear in the playfield

- **WHEN** the player runs from the leftmost edge of the level to the rightmost edge
- **THEN** the visible ground shows only flat grass on dirt
- **AND** no signs, crates, trees, flowers, or floating platforms from the source PNG's mockup section appear in the ground strip

#### Scenario: Ground tile indexes are configurable

- **WHEN** `config.js` is inspected
- **THEN** the indexes for the grass-top tile and the dirt fill tile are exported as named constants
- **AND** changing those constants visibly changes the ground without requiring edits to scene code

#### Scenario: Collision body is unchanged

- **WHEN** the player walks across the new visual ground
- **THEN** the player rests on the same world Y as before the visual change
- **AND** the player still cannot fall through any part of the ground
