import { Board } from './Board.js';
import { MoveResolver } from './MoveResolver.js';

export class GameEngine {
    constructor(size, ui, rankingService) {
        this.size = size;
        this.ui = ui;
        this.rankingService = rankingService;
        this.board = new Board(size);
        this.score = 0;
        this.isGameOver = false;
    }

    start() {
        this.score = 0;
        this.isGameOver = false;
        this.board = new Board(this.size);
        
        // Initial tiles: 2 to 3 tiles
        this.addRandomTile();
        this.addRandomTile();
        if (this.size > 3) this.addRandomTile();
        
        this.updateUI();
    }

    stop() {
        // Cleanup if needed
    }

    move(direction) {
        if (this.isGameOver) return;

        const result = MoveResolver.resolve(this.board, direction);
        
        if (result.moved) {
            this.board = result.board;
            this.score += result.scoreGain;
            this.addRandomTile();
            this.updateUI();
            
            if (this.checkGameOver()) {
                this.isGameOver = true;
                this.ui.showGameOver(this.score, this.rankingService.isTopScore(this.score));
            }
        }
    }

    addRandomTile() {
        const emptyPos = this.board.getEmptyPositions();
        if (emptyPos.length === 0) return;

        const { r, c } = emptyPos[Math.floor(Math.random() * emptyPos.length)];
        const value = Math.random() < 0.5 ? 1 : 2;
        this.board.setTile(r, c, value);
    }

    checkGameOver() {
        const directions = ['up', 'down', 'left', 'right'];
        for (const dir of directions) {
            const result = MoveResolver.resolve(this.board, dir);
            if (result.moved) return false;
        }
        return true;
    }

    updateUI() {
        this.ui.renderBoard(this.board);
        this.ui.updateScore(this.score);
    }

    saveScore(name) {
        this.rankingService.addScore(name, this.score);
        this.ui.hideModals();
        this.ui.showRanking(this.rankingService.getTopScores());
    }
}
