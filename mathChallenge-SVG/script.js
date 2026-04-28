const ROUND_SECONDS = 45;
const MACHINE_SCORE_CHANCE = 0.38;
const HIGH_SCORE_KEY = "mathChallengeHighScore";
const LEADERBOARD_KEY = "mathChallengeLeaderboard";

const state = {
  timeLeft: ROUND_SECONDS,
  playerName: "",
  playerScore: 0,
  level: 1,
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
  return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
}

function loadLeaderboard() {
  try {
    const savedScores = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    return savedScores
      .filter((entry) => entry.name && Number.isFinite(entry.score))
      .sort((first, second) => second.score - first.score)
      .slice(0, 3);
  } catch {
    return [];
  }
}

function normalizePlayerName(name) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function saveHighScore() {
  if (state.playerScore > state.highScore) {
    state.highScore = state.playerScore;
    localStorage.setItem(HIGH_SCORE_KEY, String(state.highScore));
  }
}

function saveLeaderboardEntry() {
  const nextLeaderboard = [
    ...state.leaderboard,
    {
      name: state.playerName || "YOU",
      score: state.playerScore
    }
  ];

  state.leaderboard = nextLeaderboard
    .sort((first, second) => second.score - first.score)
    .slice(0, 3);

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(state.leaderboard));
  renderLeaderboard();
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
  return Math.floor(score / 5) + 1;
}

function getDifficulty() {
  const addMax = 25 + state.level * 8;
  const subtractMax = 35 + state.level * 10;
  const multiplyMax = Math.min(15, 6 + state.level);

  if (state.level >= 5) {
    return {
      addMax,
      subtractMax,
      multiplyMax,
      operators: ["+", "-", "*", "*", "*"]
    };
  }

  if (state.level >= 3) {
    return {
      addMax,
      subtractMax,
      multiplyMax,
      operators: ["+", "-", "*"]
    };
  }

  return {
    addMax,
    subtractMax,
    multiplyMax,
    operators: ["+", "-"]
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
    left = randomInt(1, difficulty.addMax);
    right = randomInt(1, difficulty.addMax);
    answer = left + right;
  }

  if (operator === "-") {
    left = randomInt(5, difficulty.subtractMax);
    right = randomInt(1, left);
    answer = left - right;
  }

  if (operator === "*") {
    left = randomInt(2, difficulty.multiplyMax);
    right = randomInt(2, difficulty.multiplyMax);
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
  }, 260);
}

function showLevelUp() {
  levelCard.classList.remove("level-up");
  void levelCard.offsetWidth;
  levelCard.classList.add("level-up");
  flashChallenge("level-up");
}

function getStreakBonus() {
  if (state.streak > 0 && state.streak % 5 === 0) {
    return 5;
  }

  if (state.streak > 0 && state.streak % 3 === 0) {
    return 2;
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

  const machineChance = Math.min(0.72, MACHINE_SCORE_CHANCE + (state.level - 1) * 0.025);

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
  const cleanedName = normalizePlayerName(playerNameInput.value);

  if (cleanedName.length === 1 || cleanedName.length > 3) {
    setFeedback("Enter a 2 or 3 character name to start.", "incorrect");
    playerNameInput.focus();
    return;
  }

  state.playerName = cleanedName || "YOU";
  playerNameInput.value = state.playerName;

  clearInterval(state.timerId);
  clearInterval(state.machineId);

  state.timeLeft = ROUND_SECONDS;
  state.playerScore = 0;
  state.level = 1;
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

  state.timerId = setInterval(tickTimer, 1000);
  state.machineId = setInterval(scoreMachinePoint, 1000);
  answerInput.focus();
}

function handlePlayerSubmit(event) {
  event.preventDefault();

  const cleanedName = normalizePlayerName(playerNameInput.value);

  if (cleanedName.length === 1 || cleanedName.length > 3) {
    setFeedback("Use 2 or 3 characters, or leave it empty for YOU.", "incorrect");
    playerNameInput.focus();
    return;
  }

  state.playerName = cleanedName || "YOU";
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
    state.playerScore += 1 + bonus;
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
