# Cross Sums — Claude + Claude Code


## First: Investigation

Do you know about the game cross sums?

---

## Second: Role and work

You are an expert product technical manager. I need to create a game like cross sums. I want to create it in Vanilla Javascript using Claude Code. Give me a plan to follow in Claude Code to complete this task

---

## Third: Make a plan

Give me all the prompts of each phase to follow in my Claude Code. Ask me about any definitions that might be needed to create the project

### Interaction 1:
- **P: What grid sizes do you want to support?**
R: Let me specify custom sizes
- **P: How should the player input numbers?**
R: Both keyboard + number pad
- **P: Which features matter most to you? (rank by priority)**
R: Clasificación: 1. Puzzle generator (infinite puzzles), 2. Animations & polish, 3. Pencil/notes mode, 4. Timer + localStorage save

### Interaction 2:
- **P: For custom grid sizes — how should the player choose?**
R: Free input (player types any NxM)
- **P: What color theme direction?**
R: Match system preference
- **P: Do you want a single-file app or a multi-file project structure?**
R: Multi-file (html + css/ + js/ folders)

---

## Fourth: Testing

Now create the instructions to animate testing with playwright

---

## Fifth: Run in one terminal

About the first MD. I don't want to run everything at a time I just want to give to Claude Code the file with the instructions and say it to run one by one. Can you give me an step by step to do that?

---

## Sixth: Run all

now combine both Md and give me a plan to follow

---

# In Claude Code

## First: Run
```Read the file PLAN.md. This is the complete development and testing plan for a Cross Sums puzzle game.

Execute the prompts ONE AT A TIME in order, starting with Prompt 1.1. After completing each prompt:
1. Confirm what you built.
2. Note any issues or assumptions.
3. Stop and wait for me to say "continue" before moving to the next prompt.

When you reach a ">>> CHECKPOINT" line, tell me what to verify in the browser. Do NOT skip ahead. Start now with Prompt 1.
```

## Follow instructions in terminal:
**After each prompt, say:**

- "continue" — move to the next prompt
- "fix: [issue]" — fix something before advancing
- "skip to prompt X.X" — jump ahead
- "run tests" — run npm test at any checkpoint

