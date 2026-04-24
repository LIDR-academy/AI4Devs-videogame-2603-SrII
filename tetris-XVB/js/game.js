(() => {
  const COLS = 10
  const ROWS = 20
  const BLOCK_SIZE = 30
  const NEXT_BLOCK_SIZE = 24
  const BASE_DROP_MS = 850
  const MIN_DROP_MS = 100

  const LINE_SCORE = {
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  }

  const PIECES = {
    I: {
      color: '#33e0ff',
      matrix: [[1, 1, 1, 1]],
    },
    O: {
      color: '#ffd43b',
      matrix: [
        [1, 1],
        [1, 1],
      ],
    },
    T: {
      color: '#b576ff',
      matrix: [
        [0, 1, 0],
        [1, 1, 1],
      ],
    },
    S: {
      color: '#61e27a',
      matrix: [
        [0, 1, 1],
        [1, 1, 0],
      ],
    },
    Z: {
      color: '#ff6b6b',
      matrix: [
        [1, 1, 0],
        [0, 1, 1],
      ],
    },
    J: {
      color: '#4c6fff',
      matrix: [
        [1, 0, 0],
        [1, 1, 1],
      ],
    },
    L: {
      color: '#ff9f43',
      matrix: [
        [0, 0, 1],
        [1, 1, 1],
      ],
    },
  }

  const PIECE_TYPES = Object.keys(PIECES)

  const gameCanvas = document.getElementById('gameCanvas')
  const gameCtx = gameCanvas.getContext('2d')
  const nextCanvas = document.getElementById('nextCanvas')
  const nextCtx = nextCanvas.getContext('2d')

  const scoreValue = document.getElementById('scoreValue')
  const levelValue = document.getElementById('levelValue')
  const linesValue = document.getElementById('linesValue')
  const overlayMessage = document.getElementById('overlayMessage')
  const startButton = document.getElementById('startButton')

  const state = {
    board: createBoard(),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    level: 1,
    lines: 0,
    isRunning: false,
    isPaused: false,
    isGameOver: false,
    dropAccumulator: 0,
    lastTime: 0,
  }

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  }

  function cloneMatrix(matrix) {
    return matrix.map((row) => [...row])
  }

  function getDropInterval() {
    return Math.max(MIN_DROP_MS, BASE_DROP_MS - (state.level - 1) * 70)
  }

  function randomType() {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]
  }

  function createPiece(type = randomType()) {
    const template = PIECES[type]
    const matrix = cloneMatrix(template.matrix)
    return {
      type,
      color: template.color,
      matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: 0,
    }
  }

  function collides(piece, xOffset = 0, yOffset = 0, matrix = piece.matrix) {
    for (let y = 0; y < matrix.length; y += 1) {
      for (let x = 0; x < matrix[y].length; x += 1) {
        if (!matrix[y][x]) continue

        const boardX = piece.x + x + xOffset
        const boardY = piece.y + y + yOffset

        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true
        if (boardY >= 0 && state.board[boardY][boardX]) return true
      }
    }
    return false
  }

  function mergePiece(piece) {
    piece.matrix.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (!cell) return
        const boardX = piece.x + x
        const boardY = piece.y + y
        if (boardY >= 0) state.board[boardY][boardX] = piece.color
      })
    })
  }

  function clearFullLines() {
    let cleared = 0
    for (let y = ROWS - 1; y >= 0; y -= 1) {
      const isFull = state.board[y].every((cell) => cell !== null)
      if (!isFull) continue

      state.board.splice(y, 1)
      state.board.unshift(Array(COLS).fill(null))
      cleared += 1
      y += 1
    }

    if (!cleared) return

    state.lines += cleared
    state.level = Math.floor(state.lines / 10) + 1
    state.score += (LINE_SCORE[cleared] || 0) * state.level
    updateHud()
  }

  function rotateMatrixClockwise(matrix) {
    const rows = matrix.length
    const cols = matrix[0].length
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0))

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        rotated[x][rows - 1 - y] = matrix[y][x]
      }
    }
    return rotated
  }

  function tryRotateWithWallKick() {
    if (!state.currentPiece || state.currentPiece.type === 'O') return

    const rotated = rotateMatrixClockwise(state.currentPiece.matrix)
    const kicks = [0, -1, 1, -2, 2]

    for (let i = 0; i < kicks.length; i += 1) {
      const kickX = kicks[i]
      if (!collides(state.currentPiece, kickX, 0, rotated)) {
        state.currentPiece.matrix = rotated
        state.currentPiece.x += kickX
        return
      }
    }
  }

  function spawnPiece() {
    state.currentPiece = state.nextPiece || createPiece()
    state.nextPiece = createPiece()
    state.currentPiece.x = Math.floor((COLS - state.currentPiece.matrix[0].length) / 2)
    state.currentPiece.y = 0

    if (collides(state.currentPiece, 0, 0)) {
      endGame()
    }
  }

  function softDrop() {
    if (!state.currentPiece || state.isPaused || state.isGameOver) return

    if (!collides(state.currentPiece, 0, 1)) {
      state.currentPiece.y += 1
      state.score += 1
      updateHud()
      return
    }

    lockPiece()
  }

  function hardDrop() {
    if (!state.currentPiece || state.isPaused || state.isGameOver) return

    let distance = 0
    while (!collides(state.currentPiece, 0, 1)) {
      state.currentPiece.y += 1
      distance += 1
    }
    state.score += distance * 2
    updateHud()
    lockPiece()
  }

  function lockPiece() {
    mergePiece(state.currentPiece)
    clearFullLines()
    spawnPiece()
  }

  function movePiece(deltaX) {
    if (!state.currentPiece || state.isPaused || state.isGameOver) return
    if (!collides(state.currentPiece, deltaX, 0)) state.currentPiece.x += deltaX
  }

  function endGame() {
    state.isGameOver = true
    state.isRunning = false
    showOverlay('GAME OVER\nPulsa Enter para reiniciar')
  }

  function togglePause() {
    if (!state.isRunning || state.isGameOver) return
    state.isPaused = !state.isPaused
    if (state.isPaused) {
      showOverlay('PAUSA')
      return
    }
    hideOverlay()
    state.lastTime = performance.now()
    requestAnimationFrame(gameLoop)
  }

  function resetGame() {
    state.board = createBoard()
    state.currentPiece = null
    state.nextPiece = null
    state.score = 0
    state.level = 1
    state.lines = 0
    state.isRunning = true
    state.isPaused = false
    state.isGameOver = false
    state.dropAccumulator = 0
    state.lastTime = performance.now()
    hideOverlay()
    updateHud()
    spawnPiece()
    draw()
    requestAnimationFrame(gameLoop)
  }

  function updateHud() {
    scoreValue.textContent = state.score
    levelValue.textContent = state.level
    linesValue.textContent = state.lines
  }

  function showOverlay(message) {
    overlayMessage.textContent = message
    overlayMessage.classList.add('visible')
  }

  function hideOverlay() {
    overlayMessage.textContent = ''
    overlayMessage.classList.remove('visible')
  }

  function drawCell(ctx, x, y, size, color) {
    ctx.fillStyle = color
    ctx.fillRect(x * size, y * size, size, size)
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.strokeRect(x * size, y * size, size, size)
  }

  function drawBoard() {
    gameCtx.fillStyle = '#0a1120'
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height)

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const color = state.board[y][x]
        if (color) drawCell(gameCtx, x, y, BLOCK_SIZE, color)
      }
    }
  }

  function drawPiece(piece, ctx, blockSize, offsetX = 0, offsetY = 0) {
    piece.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return
        drawCell(ctx, piece.x + x + offsetX, piece.y + y + offsetY, blockSize, piece.color)
      })
    })
  }

  function drawCurrentPiece() {
    if (!state.currentPiece) return
    drawPiece(state.currentPiece, gameCtx, BLOCK_SIZE)
  }

  function drawNextPiece() {
    nextCtx.fillStyle = '#0a1120'
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height)
    if (!state.nextPiece) return

    const matrix = state.nextPiece.matrix
    const width = matrix[0].length
    const height = matrix.length
    const offsetX = (nextCanvas.width / NEXT_BLOCK_SIZE - width) / 2
    const offsetY = (nextCanvas.height / NEXT_BLOCK_SIZE - height) / 2

    const preview = {
      ...state.nextPiece,
      x: 0,
      y: 0,
    }
    drawPiece(preview, nextCtx, NEXT_BLOCK_SIZE, offsetX, offsetY)
  }

  function drawGrid() {
    gameCtx.strokeStyle = 'rgba(255,255,255,0.06)'
    for (let x = 0; x <= COLS; x += 1) {
      gameCtx.beginPath()
      gameCtx.moveTo(x * BLOCK_SIZE, 0)
      gameCtx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE)
      gameCtx.stroke()
    }
    for (let y = 0; y <= ROWS; y += 1) {
      gameCtx.beginPath()
      gameCtx.moveTo(0, y * BLOCK_SIZE)
      gameCtx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE)
      gameCtx.stroke()
    }
  }

  function draw() {
    drawBoard()
    drawGrid()
    drawCurrentPiece()
    drawNextPiece()
  }

  function gameLoop(timestamp) {
    if (!state.isRunning || state.isPaused || state.isGameOver) return

    const deltaTime = timestamp - state.lastTime
    state.lastTime = timestamp
    state.dropAccumulator += deltaTime

    if (state.dropAccumulator >= getDropInterval()) {
      softDrop()
      state.dropAccumulator = 0
    }

    draw()
    requestAnimationFrame(gameLoop)
  }

  function onKeydown(event) {
    const key = event.key
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'Enter'].includes(key)) {
      event.preventDefault()
    }

    if (key === 'Enter') {
      resetGame()
      return
    }

    if (key.toLowerCase() === 'p') {
      togglePause()
      return
    }

    if (!state.isRunning || state.isPaused || state.isGameOver) return

    if (key === 'ArrowLeft') movePiece(-1)
    if (key === 'ArrowRight') movePiece(1)
    if (key === 'ArrowDown') softDrop()
    if (key === 'ArrowUp') tryRotateWithWallKick()
    if (key === ' ') hardDrop()
    draw()
  }

  startButton.addEventListener('click', resetGame)
  document.addEventListener('keydown', onKeydown)

  updateHud()
  draw()
  showOverlay('Pulsa Enter para iniciar')
})()
