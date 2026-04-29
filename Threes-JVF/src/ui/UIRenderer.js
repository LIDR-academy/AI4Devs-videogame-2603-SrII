export class UIRenderer {
    constructor() {
        this.boardElement = document.getElementById('board');
        this.scoreElement = document.getElementById('current-score');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.rankingModal = document.getElementById('ranking-modal');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.rankingBody = document.getElementById('ranking-body');
        this.finalScoreElement = document.getElementById('final-score');
        this.newRecordInput = document.getElementById('new-record-input');
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('close-ranking').onclick = () => this.hideModals();
        document.getElementById('restart-after-gameover').onclick = () => {
            this.hideModals();
            document.getElementById('reset-btn').click();
        };
    }

    renderBoard(board) {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${board.size}, 1fr)`;

        for (let r = 0; r < board.size; r++) {
            for (let c = 0; c < board.size; c++) {
                const val = board.getTile(r, c);
                const tileDiv = document.createElement('div');
                tileDiv.className = 'tile';
                
                if (val === 0) {
                    tileDiv.classList.add('tile-empty');
                } else if (val === 1) {
                    tileDiv.classList.add('tile-1');
                    tileDiv.textContent = '1';
                } else if (val === 2) {
                    tileDiv.classList.add('tile-2');
                    tileDiv.textContent = '2';
                } else {
                    tileDiv.classList.add('tile-n');
                    tileDiv.textContent = val;
                }
                
                this.boardElement.appendChild(tileDiv);
            }
        }
    }

    updateScore(score) {
        this.scoreElement.textContent = score;
    }

    showRanking(scores) {
        this.rankingBody.innerHTML = '';
        scores.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.score}</td>
                <td>${entry.name}</td>
                <td>${entry.date}</td>
            `;
            this.rankingBody.appendChild(row);
        });
        this.modalOverlay.classList.remove('hidden');
        this.rankingModal.classList.remove('hidden');
        this.gameOverModal.classList.add('hidden');
    }

    showGameOver(score, isNewRecord) {
        this.finalScoreElement.textContent = score;
        this.modalOverlay.classList.remove('hidden');
        this.gameOverModal.classList.remove('hidden');
        this.rankingModal.classList.add('hidden');

        if (isNewRecord) {
            this.newRecordInput.classList.remove('hidden');
            const saveBtn = document.getElementById('save-score');
            const nameInput = document.getElementById('player-name');
            
            saveBtn.onclick = () => {
                const name = nameInput.value.trim() || 'ANON';
                // This will be handled by main.js through engine.saveScore
                window.dispatchEvent(new CustomEvent('save-score', { detail: { name } }));
            };
        } else {
            this.newRecordInput.classList.add('hidden');
        }
    }

    hideModals() {
        this.modalOverlay.classList.add('hidden');
        this.rankingModal.classList.add('hidden');
        this.gameOverModal.classList.add('hidden');
    }
}
