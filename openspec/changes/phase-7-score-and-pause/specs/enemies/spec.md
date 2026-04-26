## ADDED Requirements

### Requirement: Enemy emits `enemy-killed` on death

When an enemy's death animation completes, the enemy SHALL emit `'enemy-killed'` on `scene.events` with `{ variant: <variantKey> }` before being deactivated.

#### Scenario: Death event includes variant

- **WHEN** a grunt's death animation completes
- **THEN** the scene receives an `'enemy-killed'` event with `{ variant: 'grunt' }`

- **WHEN** a shooter's death animation completes
- **THEN** the scene receives an `'enemy-killed'` event with `{ variant: 'shooter' }`

- **WHEN** a jumper's death animation completes
- **THEN** the scene receives an `'enemy-killed'` event with `{ variant: 'jumper' }`

#### Scenario: Event fires once per death

- **WHEN** an enemy dies
- **THEN** exactly one `'enemy-killed'` event is emitted for that enemy
