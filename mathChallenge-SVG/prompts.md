# Prompts

# Prompt 1
```markdown
I want to build a browser-based Math Challenge game using HTML, CSS and JavaScript.

The game consists of solving random arithmetic operations (addition, subtraction, multiplication) as quickly as possible.

Core gameplay:
- A random math operation is displayed.
- The player types the answer and submits it.
- Immediate feedback is given (correct / incorrect).
- The score increases for correct answers.
- The game runs under a time limit.
- The game must be playable by opening a single HTML file in the browser without any build step

The game should include:
- a visible timer countdown
- a score counter
- dynamic generation of math questions
- input handling and validation
- a restart option when the game ends

Additionally, I want to explore a “player vs machine” mode:
- The player competes against a simulated opponent.
- The opponent gains points automatically over time or based on a simple probability model.
- At the end of the game, both scores are compared to determine the winner.

Before writing any code:
- Propose the simplest architecture and approach to implement this game.
- Explain how to structure the logic (state, game loop, question generation, scoring).
- Suggest how to implement the opponent in a simple but effective way without adding unnecessary complexity.
```

---

# Prompt 2

```markdown
You are an expert frontend game developer.

Create the initial structure for a browser-based Math Challenge game using plain HTML, CSS and JavaScript.

Project structure:

mathChallenge-SVG/
  ├── index.html
  ├── styles.css
  └── script.js

Game concept:
The player competes against a simulated machine by solving random arithmetic operations before the timer reaches zero.

Initial version requirements:
- Show a title.
- Show a countdown timer.
- Show player score.
- Show machine score.
- Show a random arithmetic question.
- Provide an input for the player answer.
- Provide a submit button.
- Provide a restart button.
- Generate questions using addition, subtraction and multiplication.
- Validate the player answer.
- Add 1 point for each correct answer.
- Show immediate feedback after each answer.
- The machine should gain points automatically using a simple probability-based system.
- When time reaches zero, stop the game and show whether the player won, lost or tied.

Technical constraints:
- Use separate files: index.html, styles.css and script.js.
- Do not use external frameworks or libraries.
- Do not use build tools.
- The game must run directly in the browser by opening index.html.
- Keep the code simple, readable and easy to extend.

Please create the full content for each file.
```

---

# Prompt 3

```markdown
You are an expert frontend game developer.

Improve the existing Math Challenge game by adding the following features without rewriting the whole codebase:

1. Streak system:
- Track consecutive correct answers.
- Add bonus points for streaks (e.g., +2 extra points at 3 streak, +5 at 5 streak).
- Display the current streak on screen.

2. Progressive difficulty:
- Increase number ranges and include more multiplication as the player's score increases.
- Keep questions readable and avoid negative results.

3. Visual feedback:
- Briefly highlight correct answers in green and incorrect ones in red.
- Keep it simple using CSS classes.

4. High score:
- Store and retrieve the best score using localStorage.
- Display it on screen.

Constraints:
- Keep the code simple and readable.
- Do not introduce any frameworks.
- Do not break existing functionality.
- Modify only what is necessary.

Provide only the updated parts of the code and clearly explain where to place them.
```

---

# Prompt 4

```markdown
You are an expert frontend game developer.

Enhance the existing Math Challenge game by introducing a lightweight level system and simple visual improvements.

Add the following features:

1. Level system:
- Define a level based on the player's score (e.g., level = Math.floor(score / 5) + 1).
- Display the current level on screen.
- Show a brief "Level Up!" message when the player reaches a new level.

2. Gameplay impact:
- Increase difficulty as the level increases:
  - Expand number ranges.
  - Introduce multiplication at higher levels.
- Increase the machine scoring probability slightly with each level.

3. Visual feedback:
- Add a temporary visual effect when leveling up (e.g., highlight, color change, or animation using CSS).
- Improve clarity of the UI so level, score, and timer are easy to read.

Constraints:
- Keep everything in the existing structure.
- Do not introduce new screens or complex navigation.
- Keep the code simple and maintainable.
- Use only HTML, CSS, and JavaScript (no frameworks).

Provide only the necessary code changes and explain where to integrate them.

```

---

# Prompt 5

```markdown
You are an expert frontend game developer.

Enhance the existing Math Challenge game by adding a lightweight level system and simple visual polish.

Add the following features:

1. Level system:
- Calculate the level from the player score:
  level = Math.floor(playerScore / 5) + 1
- Display the current level on screen.
- Show a brief "Level Up!" message whenever the player reaches a new level.

2. Difficulty progression:
- Increase number ranges as the level increases.
- Keep subtraction results non-negative.
- Introduce multiplication more often from level 3 onward.
- Keep all questions readable.

3. Machine progression:
- Slightly increase the machine scoring probability as the level increases.
- Keep the machine balanced so the player still has a fair chance to win.

4. Visual polish:
- Add a short CSS animation or highlight when the level increases.
- Improve the visibility of timer, scores, level and feedback.

Constraints:
- Do not rewrite the whole codebase.
- Do not introduce frameworks or external libraries.
- Keep the existing file structure.
- Keep the implementation simple and readable.
- Preserve all existing functionality, especially score, timer, restart and machine mode.

Provide only the necessary changes and explain exactly where to apply them.
```

---

# Prompt 6

```markdown
You are an expert frontend game developer.

Enhance the existing Math Challenge game by adding a simple high score system with a top 3 leaderboard.

Add the following features:

1. Player name:
- Ask the player for a short name (2–3 characters) before starting the game.
- Store this name in the game state.

2. High score system:
- At the end of the game, save the player's score and name in localStorage.
- Maintain a list of top 3 scores.
- Sort scores in descending order.
- Keep only the best 3 entries.

3. Display leaderboard:
- Show the top 3 scores on screen.
- Display name + score.
- Update it after each game.

4. UI behavior:
- Keep it simple and integrated in the existing screen.
- No new pages or complex navigation.

Constraints:
- Use localStorage only.
- Do not introduce external libraries.
- Do not rewrite the entire codebase.
- Keep the implementation simple and readable.

Provide only the necessary code changes and explain where to integrate them.
```

---

# Prompt 7

```markdown
You are an expert frontend game developer.

Enhance the existing Math Challenge game with a simple leaderboard system and final UX polish.

Add the following features:

1. Player name:
- Ask the player for a short name (2–3 characters) before starting the game.
- Store the name in the game state.
- If no name is provided, default to "YOU".

2. Leaderboard (Top 3):
- At the end of the game, save the player's name and score in localStorage.
- Maintain a top 3 ranking sorted by score (highest first).
- Keep only the best 3 scores.
- Persist the leaderboard between sessions.

3. Leaderboard display:
- Show the top 3 scores on screen (name + score).
- Update it immediately after each game ends.
- Keep it integrated in the main UI (no new screens).

4. End game summary:
- When the game ends, clearly display:
  - Player score
  - Machine score
  - Result (Win / Lose / Draw)
- Highlight the result visually.

5. UX polish:
- Allow submitting answers with the Enter key.
- Automatically clear and refocus the input after each answer.
- Ensure all UI elements (score, level, timer, leaderboard) are clearly visible.

Constraints:
- Do not rewrite the whole codebase.
- Do not introduce external libraries or frameworks.
- Keep the implementation simple and readable.
- Reuse the existing structure and state as much as possible.

Provide only the necessary code changes and clearly explain where to integrate them.
```

---
