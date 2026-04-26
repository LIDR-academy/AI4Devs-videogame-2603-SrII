## ADDED Requirements

### Requirement: Player reads fire input alongside movement input

`Player.update()` SHALL read fire input (`Z`, `X`, left mouse) on the same frame as movement input. Movement and fire SHALL be independent — pressing fire SHALL NOT block movement, and pressing movement SHALL NOT block fire.

#### Scenario: Move and fire simultaneously

- **WHEN** the player holds Right and `Z` at the same time
- **THEN** the player moves right
- **AND** bullets are emitted at the configured cooldown
- **AND** bullets travel rightward (in the facing direction)

#### Scenario: Fire while jumping

- **WHEN** the player presses `Space` and `Z` at the same time while on the ground
- **THEN** the player jumps
- **AND** a bullet is emitted

### Requirement: Fire keys do not interfere with movement keys

Adding `Z`, `X`, and the mouse `pointer` to the player's input map SHALL NOT change the behavior of arrow keys, WASD, or `Space` defined by Phase 2.

#### Scenario: Phase-2 movement still works after fire wiring

- **WHEN** the player uses Left/Right/A/D/Space without pressing any fire input
- **THEN** the movement behavior is identical to Phase 2 (run, jump, idle/walk animations)
