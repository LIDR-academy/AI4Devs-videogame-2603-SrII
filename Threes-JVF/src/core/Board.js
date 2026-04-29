export class Board {
    constructor(size) {
        this.size = size;
        this.grid = Array(size).fill(null).map(() => Array(size).fill(0));
    }

    getTile(row, col) {
        return this.grid[row][col];
    }

    setTile(row, col, value) {
        this.grid[row][col] = value;
    }

    getEmptyPositions() {
        const positions = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) positions.push({ r, c });
            }
        }
        return positions;
    }

    clone() {
        const newBoard = new Board(this.size);
        newBoard.grid = this.grid.map(row => [...row]);
        return newBoard;
    }

    equals(otherBoard) {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] !== otherBoard.grid[r][c]) return false;
            }
        }
        return true;
    }
}
