# Tools 
- Cursor with Agent Opus 4.5

**Model**: Claude Opus 4.6 


# Prompts

## First prompt: Build a Lightweight Icy Tower–Style Game (HTML, CSS, JS)

### Role
You are an expert platform video game developer.

### Objective
Create a lightweight browser-based game inspired by Icy Tower:
https://www.todojuegosgratis.es/juego/icy-tower

The goal is for the player to climb a tower consisting of **100 platforms**.  
If the character falls off the screen, the game ends.

### Core Mechanics

#### Player Movement
- **Left Arrow (←):** Move character left  
- **Right Arrow (→):** Move character right  
- Movement is constrained within the horizontal bounds of the tower

#### Jumping
- **Space Bar:** Jump  
- Jump height depends on horizontal speed:
  - Higher speed → higher jump

#### Momentum & Wall Interaction
- Preserve momentum as a core mechanic
- If the player hits a wall:
  - They can maintain speed by quickly switching direction (wall-bounce behavior)

### Platforms

- The tower consists of **100 platforms**
- Platforms move upward continuously (camera or world movement)
- Each platform behaves as follows:
  - When stepped on, it remains stable briefly
  - After **5 seconds**, it falls/disappears

### Game Rules

- Player must continuously jump from platform to platform
- If the player falls below the visible area → **Game Over**
- Objective: reach the top (platform 100)

### Technical Requirements

- Use only:
  - **HTML**
  - **CSS**
  - **Vanilla JavaScript**
- Keep implementation lightweight and efficient
- No external libraries or frameworks

### Suggested Features (Optional but Recommended)

- Basic gravity and physics system
- Collision detection (player ↔ platforms, player ↔ walls)
- Simple score system based on height reached
- Smooth upward scrolling effect
- Minimal UI (start/restart screen, game over message)

### Output Expectations

- Clean, readable, and well-structured code
- Separate sections/files for HTML, CSS, and JS
- Comments explaining key logic (physics, collisions, movement)


## Second prompt: Visual Design for Tower Climbing Game

### Role
You are an expert in video game visuals and design.

### Objective
Design the visual style and atmosphere of a tower-climbing platform game to create strong immersion and a clear narrative theme.

### Environment & Setting

- The tower must **visually resemble a real tower**, not just abstract platforms
- The player should feel like they are **inside the tower while playing**
- Visual inspiration: **ancient French castles**
  - Stone walls
  - Narrow vertical architecture
  - Gothic or medieval elements (arches, bricks, torches, windows)

### Atmosphere

- Convey verticality and confinement
- Reinforce the idea of climbing upward inside a tall structure
- Use perspective, lighting, and background details to enhance depth

### Character Design

- The main character is a **knight**
- Visual style: simple but recognizable
- Narrative: the knight is trying to **rescue a Rapunzel-like princess**

### Narrative Visual Cues

- Suggest that the knight is **constantly climbing toward the princess**
- If possible, visually imply:
  - The presence of **Rapunzel’s long hair** extending downward through the tower
  - The knight progressing closer to it as they climb

### Style Guidelines

- Keep visuals lightweight (suitable for HTML/CSS/JS implementation)
- Prefer stylized or minimal art over complex assets
- Ensure readability and clarity during gameplay

### Interaction Between Visuals & Gameplay

- Platforms should feel like part of the tower (e.g., stone ledges, wooden beams)
- Background elements should scroll to reinforce upward movement
- Subtle animations (flickering torches, moving shadows) are encouraged

### Clarification

If any aspect of the design is unclear or requires assumptions, ask questions before proceeding.



## Third prompt: Gameplay & Design Adjustments

### Objective
Refine the existing tower-climbing game by improving character behavior, platform mechanics, and overall gameplay balance.

### Character Adjustments

- The knight should have a **more human-like shape**
  - Improve proportions (head, torso, limbs)
  - Maintain a simple, lightweight visual style

- **Movement speed**
  - Reduce overall horizontal movement speed for better control

### Jump Mechanics

- Adjust jump behavior:
  - **Standing jump (no momentum):**
    - Should reach slightly higher than **one platform**
  - **Running jump (with momentum):**
    - Can reach up to **~3 platforms high**
- Ensure jump height clearly scales with speed, but remains controlled

### Platform Adjustments

- **Spacing**
  - Increase vertical spacing between platforms slightly to improve pacing and challenge

- **Falling behavior**
  - Platforms the player steps on:
    - Fall after **5 seconds** (existing behavior)
  - Additionally:
    - Platforms that move **below the player’s position** should also begin to fall
    - This prevents backtracking and reinforces upward progression

### Game Over Condition

- The game ends when:
  - The player falls to a point where **no platforms remain below**
  - Not just when exiting the screen, but when recovery is impossible

### Goal

- Improve game feel, control, and fairness
- Encourage forward/upward momentum
- Maintain a clear difficulty curve without making controls frustrating



## Fourth prompt: Additional Gameplay Fixes & Tuning

### Jump Behavior Adjustment

- When the character is **standing still (no horizontal movement)**:
  - The jump height should be sufficient to **consistently reach the next platform above**
  - Ensure this is reliable and does not depend on perfect timing

### Game Over Logic Fix

- Current issue:
  - The player sometimes dies even when there are still platforms below that have not fallen

- Required fix:
  - The game should **only trigger Game Over if recovery is truly impossible**

- Update logic to ensure:
  - If there are still **reachable platforms below the player**, the game continues
  - Death should occur only when:
    - The player falls beyond a threshold where **no platforms remain within reachable distance**

### Goal

- Improve fairness and consistency
- Avoid frustrating or incorrect deaths
- Ensure gameplay feels predictable and skill-based



## Fifth prompt: Coin Collection & Alternate Win Condition

### Objective
Introduce a collectible system that adds a secondary requirement for winning the game.

### Coins System

- Distribute **coins across platforms** throughout the tower
- Coins should be:
  - Clearly visible
  - Positioned to encourage risk/reward decisions during climbing

### New Goal Requirement

- Reaching the top is no longer sufficient on its own
- The player must collect **at least 20 coins** during the climb

### Endgame Conditions

- **Successful Ending:**
  - Player reaches the top platform
  - AND has collected **≥ 20 coins**
  - → The knight can escape with Rapunzel

- **Failure Ending:**
  - Player reaches the top platform
  - BUT has collected **< 20 coins**
  - → The knight cannot afford the escape
  - → Rapunzel rejects him
  - → Game Over

### Goal

- Add strategic depth to climbing
- Encourage exploration and risk-taking
- Create a meaningful win/lose variation beyond just reaching the top


## Sixth prompt: Coin System Difficulty Adjustment

### Objective
Increase difficulty by tightening the margin for success in the coin collection system.

### Updated Coin Rules

- Total number of coins in the game: **25 (maximum)**
- Coins remain distributed across platforms to encourage exploration and risk

### Win Condition Update

- To successfully complete the game:
  - The player must collect **at least 20 out of 25 coins**

### Design Implications

- High collection requirement (~80%) increases challenge
- Players must:
  - Take calculated risks
  - Optimize movement and pathing
- Missing too many coins will result in failure even if the top is reached

### Goal

- Create tension and strategic decision-making
- Reward skillful and efficient climbing
- Make success feel earned and intentional


## Seventh prompt: Difficulty Levels System

### Objective
Introduce selectable difficulty levels that dynamically adjust platform behavior.

### Difficulty Selection

- At the start of the game, the player can choose between:
  - **Easy**
  - **Medium**
  - **Hard**

### Difficulty Effects

- The selected difficulty determines how long platforms remain stable before falling:

| Difficulty | Platform Fall Time |
|-----------|------------------|
| Easy      | 5 seconds        |
| Medium    | 3 seconds        |
| Hard      | 1 second         |

### Gameplay Impact

- **Easy**
  - More forgiving
  - Allows slower, more strategic climbing

- **Medium**
  - Balanced challenge
  - Requires moderate pace and decision-making

- **Hard**
  - Highly reactive gameplay
  - Forces fast movement and precise jumps

### Integration Notes

- Apply the selected timer consistently to:
  - Platforms stepped on by the player
  - Platforms falling after moving below the player

### Goal

- Provide replayability and scalability for different player skill levels
- Allow players to self-select challenge intensity



## Eight Prompt: Post-Win Difficulty Selection

### Objective
Allow continued gameplay after a successful run by letting the player reselect difficulty.

### Behavior on Win

- When the player **successfully completes the game** (reaches the top with ≥ required coins):
  - Display a **win screen**
  - Provide an option to **choose a difficulty level again**

### Difficulty Reselection

- Present the same options:
  - **Easy**
  - **Medium**
  - **Hard**

- Upon selection:
  - Restart the game from the beginning
  - Apply the selected difficulty settings (platform fall timing)

### Goal

- Encourage replayability
- Allow players to try higher or different difficulty levels after winning
- Maintain engagement beyond a single successful run

