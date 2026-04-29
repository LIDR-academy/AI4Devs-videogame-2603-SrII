const HIGH_SCORE_KEY = "mathChallengeHighScore";
const LEADERBOARD_KEY = "mathChallengeLeaderboard";
const {
  ROUND_SECONDS,
  TIMER_TICK_MS,
  LEVEL_BASE,
  LEVEL_SCORE_DIVISOR,
  DEFAULT_PLAYER_NAME,
  PLAYER_NAME_MIN_LENGTH,
  PLAYER_NAME_MAX_LENGTH,
  HIGH_SCORE_FALLBACK,
  LEADERBOARD_LIMIT,
  FEEDBACK_FLASH_MS,
  CORRECT_SCORE_INCREMENT,
  MACHINE_BASE_SCORE_CHANCE,
  MACHINE_SCORE_CHANCE_MAX,
  MACHINE_SCORE_CHANCE_PER_LEVEL,
  DIFFICULTY,
  STREAK
} = window.GAME_CONFIG;

const state = {
  timeLeft: ROUND_SECONDS,
  playerName: "",
  playerScore: 0,
  level: LEVEL_BASE,
  machineScore: 0,
  streak: 0,
  highScore: loadHighScore(),
  leaderboard: loadLeaderboard(),
  currentQuestion: null,
  timerId: null,
  machineId: null,
  feedbackTimerId: null,
  isRunning: false
};

const timerElement = document.querySelector("#timer");
const playerForm = document.querySelector("#player-form");
const playerNameInput = document.querySelector("#player-name");
const playerScoreElement = document.querySelector("#player-score");
const levelElement = document.querySelector("#level");
const levelCard = document.querySelector(".status-card-level");
const machineScoreElement = document.querySelector("#machine-score");
const streakElement = document.querySelector("#streak");
const highScoreElement = document.querySelector("#high-score");
const challengeArea = document.querySelector("#challenge-area");
const questionElement = document.querySelector("#question");
const feedbackElement = document.querySelector("#feedback");
const leaderboardList = document.querySelector("#leaderboard-list");
const answerForm = document.querySelector("#answer-form");
const answerInput = document.querySelector("#answer-input");
const submitButton = document.querySelector("#submit-button");
const restartButton = document.querySelector("#restart-button");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadHighScore() {
  try {
    const storedHighScore = Number(localStorage.getItem(HIGH_SCORE_KEY));

    if (!Number.isFinite(storedHighScore) || storedHighScore < 0) {
      return HIGH_SCORE_FALLBACK;
    }

    return Math.floor(storedHighScore);
  } catch {
    return HIGH_SCORE_FALLBACK;
  }
}

function loadLeaderboard() {
  try {
    const savedScores = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    return savedScores
      .filter((entry) => entry.name && Number.isFinite(entry.score))
      .sort((first, second) => second.score - first.score)
      .slice(0, LEADERBOARD_LIMIT);
  } catch {
    return [];
  }
}

function normalizePlayerName(name) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function validatePlayerName(rawName, invalidMessage) {
  const cleanedName = normalizePlayerName(rawName);

  if (
    (cleanedName.length > 0 && cleanedName.length < PLAYER_NAME_MIN_LENGTH) ||
    cleanedName.length > PLAYER_NAME_MAX_LENGTH
  ) {
    setFeedback(invalidMessage, "incorrect");
    playerNameInput.focus();
    return null;
  }

  return cleanedName;
}

function saveHighScore() {
  if (state.playerScore > state.highScore) {
    state.highScore = state.playerScore;

    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(state.highScore));
    } catch {
      return false;
    }
  }

  return true;
}

function saveLeaderboardEntry() {
  let storedLeaderboard = state.leaderboard;

  try {
    const savedScores = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];

    if (Array.isArray(savedScores)) {
      storedLeaderboard = savedScores
        .filter((entry) => entry.name && Number.isFinite(entry.score))
        .sort((first, second) => second.score - first.score)
        .slice(0, LEADERBOARD_LIMIT);
    }
  } catch {
    storedLeaderboard = state.leaderboard;
  }

  const nextLeaderboard = [
    ...storedLeaderboard,
    {
      name: state.playerName || DEFAULT_PLAYER_NAME,
      score: state.playerScore
    }
  ];

  state.leaderboard = nextLeaderboard
    .sort((first, second) => second.score - first.score)
    .slice(0, LEADERBOARD_LIMIT);

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(state.leaderboard));
  } catch {
    renderLeaderboard();
    return false;
  }

  renderLeaderboard();
  return true;
}

function renderLeaderboard() {
  leaderboardList.replaceChildren();

  if (state.leaderboard.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No scores yet";
    leaderboardList.append(emptyItem);
    return;
  }

  state.leaderboard.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = `${normalizePlayerName(entry.name)} - ${entry.score}`;
    leaderboardList.append(item);
  });
}

function getLevel(score) {
  return Math.floor(score / LEVEL_SCORE_DIVISOR) + LEVEL_BASE;
}

function getDifficulty() {
  const addMax = DIFFICULTY.ADD_BASE_MAX + state.level * DIFFICULTY.ADD_PER_LEVEL;
  const subtractMax = DIFFICULTY.SUBTRACT_BASE_MAX + state.level * DIFFICULTY.SUBTRACT_PER_LEVEL;
  const multiplyMax = Math.min(
    DIFFICULTY.MULTIPLY_MAX_CAP,
    DIFFICULTY.MULTIPLY_BASE_MAX + state.level * DIFFICULTY.MULTIPLY_PER_LEVEL
  );

  if (state.level >= DIFFICULTY.MULTIPLY_HEAVY_LEVEL) {
    return {
      addMax,
      subtractMax,
      multiplyMax,
      operators: DIFFICULTY.LATE_OPERATORS
    };
  }

  if (state.level >= DIFFICULTY.MULTIPLY_UNLOCK_LEVEL) {
    return {
      addMax,
      subtractMax,
      multiplyMax,
      operators: DIFFICULTY.MID_OPERATORS
    };
  }

  return {
    addMax,
    subtractMax,
    multiplyMax,
    operators: DIFFICULTY.EARLY_OPERATORS
  };
}

function generateQuestion() {
  const difficulty = getDifficulty();
  const operators = difficulty.operators;
  const operator = operators[randomInt(0, operators.length - 1)];
  let left;
  let right;
  let answer;

  if (operator === "+") {
    left = randomInt(DIFFICULTY.ADD_MIN_OPERAND, difficulty.addMax);
    right = randomInt(DIFFICULTY.ADD_MIN_OPERAND, difficulty.addMax);
    answer = left + right;
  }

  if (operator === "-") {
    left = randomInt(DIFFICULTY.SUBTRACT_MIN_LEFT, difficulty.subtractMax);
    right = randomInt(DIFFICULTY.SUBTRACT_MIN_RIGHT, left);
    answer = left - right;
  }

  if (operator === "*") {
    left = randomInt(DIFFICULTY.MULTIPLY_MIN_OPERAND, difficulty.multiplyMax);
    right = randomInt(DIFFICULTY.MULTIPLY_MIN_OPERAND, difficulty.multiplyMax);
    answer = left * right;
  }

  return {
    text: `${left} ${operator} ${right}`,
    answer
  };
}

function updateDisplay() {
  timerElement.textContent = state.timeLeft;
  playerScoreElement.textContent = state.playerScore;
  levelElement.textContent = state.level;
  machineScoreElement.textContent = state.machineScore;
  streakElement.textContent = state.streak;
  highScoreElement.textContent = state.highScore;
  questionElement.textContent = state.currentQuestion ? state.currentQuestion.text : "-";
}

function setFeedback(message, type) {
  feedbackElement.textContent = message;
  feedbackElement.className = `feedback ${type || ""}`.trim();
}

function flashChallenge(type) {
  clearTimeout(state.feedbackTimerId);
  challengeArea.classList.remove("flash-correct", "flash-incorrect", "flash-level-up");
  challengeArea.classList.add(`flash-${type}`);

  state.feedbackTimerId = setTimeout(() => {
    challengeArea.classList.remove("flash-correct", "flash-incorrect", "flash-level-up");
  }, FEEDBACK_FLASH_MS);
}

function showLevelUp() {
  levelCard.classList.remove("level-up");
  void levelCard.offsetWidth;
  levelCard.classList.add("level-up");
  flashChallenge("level-up");
}

function getStreakBonus() {
  if (state.streak > 0 && state.streak % STREAK.HIGH_THRESHOLD === 0) {
    return STREAK.HIGH_BONUS;
  }

  if (state.streak > 0 && state.streak % STREAK.MEDIUM_THRESHOLD === 0) {
    return STREAK.MEDIUM_BONUS;
  }

  return 0;
}

function nextQuestion() {
  state.currentQuestion = generateQuestion();
  answerInput.value = "";
  updateDisplay();
  answerInput.focus();
}

function scoreMachinePoint() {
  if (!state.isRunning) {
    return;
  }

  const machineChance = Math.min(
    MACHINE_SCORE_CHANCE_MAX,
    MACHINE_BASE_SCORE_CHANCE + (state.level - LEVEL_BASE) * MACHINE_SCORE_CHANCE_PER_LEVEL
  );

  if (Math.random() < machineChance) {
    state.machineScore += 1;
    updateDisplay();
  }
}

function getEndGameSummary() {
  if (state.playerScore > state.machineScore) {
    return {
      type: "win",
      text: `Win! Player ${state.playerScore} - Machine ${state.machineScore}`
    };
  }

  if (state.playerScore < state.machineScore) {
    return {
      type: "loss",
      text: `Lose. Player ${state.playerScore} - Machine ${state.machineScore}`
    };
  }

  return {
    type: "draw",
    text: `Draw. Player ${state.playerScore} - Machine ${state.machineScore}`
  };
}

function endGame() {
  state.isRunning = false;
  clearInterval(state.timerId);
  clearInterval(state.machineId);
  submitButton.disabled = true;
  answerInput.disabled = true;
  playerNameInput.disabled = false;
  playerForm.classList.remove("is-locked");
  saveLeaderboardEntry();

  const summary = getEndGameSummary();
  setFeedback(`Time is up. ${summary.text}`, summary.type);
}

function tickTimer() {
  state.timeLeft -= 1;
  updateDisplay();

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    updateDisplay();
    endGame();
  }
}

function startGame() {
  const cleanedName = validatePlayerName(
    playerNameInput.value,
    "Enter a 2 or 3 character name to start."
  );

  if (cleanedName === null) {
    return;
  }

  state.playerName = cleanedName || DEFAULT_PLAYER_NAME;
  playerNameInput.value = state.playerName;

  clearInterval(state.timerId);
  clearInterval(state.machineId);

  state.timeLeft = ROUND_SECONDS;
  state.playerScore = 0;
  state.level = LEVEL_BASE;
  state.machineScore = 0;
  state.streak = 0;
  state.highScore = loadHighScore();
  state.leaderboard = loadLeaderboard();
  state.isRunning = true;
  state.currentQuestion = generateQuestion();

  playerForm.classList.add("is-locked");
  playerNameInput.disabled = true;
  submitButton.disabled = false;
  answerInput.disabled = false;
  setFeedback("Enter an answer before the machine pulls ahead.", "");
  updateDisplay();

  state.timerId = setInterval(tickTimer, TIMER_TICK_MS);
  state.machineId = setInterval(scoreMachinePoint, TIMER_TICK_MS);
  answerInput.focus();
}

function handlePlayerSubmit(event) {
  event.preventDefault();

  const cleanedName = validatePlayerName(
    playerNameInput.value,
    "Use 2 or 3 characters, or leave it empty for YOU."
  );

  if (cleanedName === null) {
    return;
  }

  state.playerName = cleanedName || DEFAULT_PLAYER_NAME;
  playerNameInput.value = state.playerName;
  startGame();
}

function handleAnswerSubmit(event) {
  event.preventDefault();

  if (!state.isRunning) {
    return;
  }

  const playerAnswer = Number(answerInput.value.trim());

  if (answerInput.value.trim() === "" || Number.isNaN(playerAnswer)) {
    setFeedback("Please enter a valid number.", "incorrect");
    answerInput.focus();
    return;
  }

  if (playerAnswer === state.currentQuestion.answer) {
    const previousLevel = state.level;
    state.streak += 1;
    const bonus = getStreakBonus();
    state.playerScore += CORRECT_SCORE_INCREMENT + bonus;
    state.level = getLevel(state.playerScore);
    saveHighScore();

    if (state.level > previousLevel) {
      showLevelUp();
      setFeedback(`Level Up! You reached level ${state.level}.`, "correct");
    } else {
      flashChallenge("correct");
      setFeedback(
        bonus > 0
          ? `Correct. Streak bonus +${bonus}!`
          : "Correct. One point for you.",
        "correct"
      );
    }
  } else {
    state.streak = 0;
    flashChallenge("incorrect");
    setFeedback(`Incorrect. The answer was ${state.currentQuestion.answer}.`, "incorrect");
  }

  nextQuestion();
}

playerForm.addEventListener("submit", handlePlayerSubmit);
answerForm.addEventListener("submit", handleAnswerSubmit);
restartButton.addEventListener("click", startGame);

submitButton.disabled = true;
answerInput.disabled = true;
updateDisplay();
renderLeaderboard();
setFeedback("Enter your initials to start.", "");
playerNameInput.focus();
