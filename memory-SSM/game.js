// ===== CONFIGURACIÓN =====
const EMOJIS = ['🦁', '🐯', '🦊', '🐺', '🦝', '🐻', '🦄', '🐲'];
const TOTAL_PAIRS = EMOJIS.length;

// ===== ESTADO DEL JUEGO =====
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timerInterval = null;
let seconds = 0;
let isLocked = false;
let gameStarted = false;

// ===== REFERENCIAS DOM =====
const board       = document.getElementById('board');
const movesEl     = document.getElementById('moves');
const timerEl     = document.getElementById('timer');
const winModal    = document.getElementById('winModal');
const finalMoves  = document.getElementById('finalMoves');
const finalTime   = document.getElementById('finalTime');
const confettiEl  = document.getElementById('confetti');

document.getElementById('restartBtn').addEventListener('click', initGame);
document.getElementById('playAgainBtn').addEventListener('click', () => {
  winModal.classList.remove('visible');
  confettiEl.innerHTML = '';
  initGame();
});

// ===== INICIALIZAR JUEGO =====
function initGame() {
  // Resetear estado
  cards = [];
  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  seconds = 0;
  isLocked = false;
  gameStarted = false;

  movesEl.textContent = '0';
  timerEl.textContent = '00:00';

  clearInterval(timerInterval);
  timerInterval = null;

  // Generar y mezclar cartas
  const pairs = [...EMOJIS, ...EMOJIS];
  shuffle(pairs);

  // Renderizar tablero
  board.innerHTML = '';
  pairs.forEach((emoji, index) => {
    const card = createCard(emoji, index);
    board.appendChild(card);
    cards.push({ element: card, emoji, matched: false });
  });
}

// ===== CREAR CARTA =====
function createCard(emoji, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.index = index;
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-back"></div>
      <div class="card-face card-front">${emoji}</div>
    </div>
  `;
  card.addEventListener('click', () => onCardClick(index));
  return card;
}

// ===== CLICK EN CARTA =====
function onCardClick(index) {
  const cardData = cards[index];

  // Ignorar si: bloqueado, ya volteada, ya encontrada
  if (isLocked) return;
  if (cardData.matched) return;
  if (flippedCards.length === 1 && flippedCards[0].index === index) return;

  // Iniciar timer al primer click
  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }

  // Voltear carta
  flipCard(cardData.element, true);
  flippedCards.push({ index, emoji: cardData.emoji });

  // Si es la segunda carta volteada
  if (flippedCards.length === 2) {
    moves++;
    movesEl.textContent = moves;
    checkMatch();
  }
}

// ===== VOLTEAR CARTA =====
function flipCard(element, faceUp) {
  if (faceUp) {
    element.classList.add('flipped');
  } else {
    element.classList.remove('flipped');
  }
}

// ===== VERIFICAR PAREJA =====
function checkMatch() {
  const [first, second] = flippedCards;

  if (first.emoji === second.emoji) {
    // ¡Pareja encontrada!
    setTimeout(() => {
      cards[first.index].element.classList.add('matched');
      cards[second.index].element.classList.add('matched');
      cards[first.index].matched = true;
      cards[second.index].matched = true;
      flippedCards = [];
      matchedPairs++;

      if (matchedPairs === TOTAL_PAIRS) {
        onWin();
      }
    }, 400);
  } else {
    // No coinciden: bloquear y voltear de vuelta
    isLocked = true;
    setTimeout(() => {
      flipCard(cards[first.index].element, false);
      flipCard(cards[second.index].element, false);
      flippedCards = [];
      isLocked = false;
    }, 1000);
  }
}

// ===== VICTORIA =====
function onWin() {
  clearInterval(timerInterval);
  const timeStr = formatTime(seconds);

  setTimeout(() => {
    finalMoves.textContent = moves;
    finalTime.textContent = timeStr;
    winModal.classList.add('visible');
    launchConfetti();
  }, 600);
}

// ===== TIMER =====
function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// ===== CONFETTI =====
function launchConfetti() {
  confettiEl.innerHTML = '';
  const colors = ['#e94560', '#f5c518', '#c77dff', '#00d4ff', '#7fff00', '#ff6b35'];
  const shapes = ['circle', 'square', 'triangle'];

  for (let i = 0; i < 120; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const duration = 2.5 + Math.random() * 2.5;
    const delay = Math.random() * 1.5;
    const size = 6 + Math.random() * 10;
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    piece.style.cssText = `
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      border-radius: ${shape === 'circle' ? '50%' : shape === 'square' ? '2px' : '0'};
      ${shape === 'triangle' ? `
        width: 0; height: 0;
        background: transparent;
        border-left: ${size/2}px solid transparent;
        border-right: ${size/2}px solid transparent;
        border-bottom: ${size}px solid ${color};
      ` : ''}
    `;
    confettiEl.appendChild(piece);
  }
}

// ===== UTILIDADES =====
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ===== ARRANCAR =====
initGame();
