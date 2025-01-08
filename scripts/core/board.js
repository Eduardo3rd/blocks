import { BOARD_WIDTH, BOARD_HEIGHT } from '../config/constants.js';

class Board {
    constructor() {
        this.grid = this.createGrid();
    }

    createGrid() {
        return Array(20).fill().map(() => Array(10).fill(0));
    }

    reset() {
        this.grid = this.createGrid();
    }

    isColliding(piece, offsetX = 0, offsetY = 0) {
        const matrix = piece.matrix;
        const pos = piece.pos;

        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0) {
                    const testX = pos.x + x + offsetX;
                    const testY = pos.y + y + offsetY;
                    
                    if (!this.isInBounds(testX, testY) || this.grid[testY][testX] !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isInBounds(x, y) {
        return x >= 0 && x < this.grid[0].length && y >= 0 && y < this.grid.length;
    }

    merge(piece) {
        const matrix = piece.matrix;
        const pos = piece.pos;

        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    if (this.isInBounds(pos.x + x, pos.y + y)) {
                        this.grid[pos.y + y][pos.x + x] = value;
                    }
                }
            });
        });
    }

    sweep() {
        let linesCleared = 0;
        let combo = 0;
        
        for (let y = this.grid.length - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                // Remove the line
                this.grid.splice(y, 1);
                // Add new empty line at top
                this.grid.unshift(new Array(10).fill(0));
                linesCleared++;
                y++; // Check the same row again
                combo++;
            }
        }

        // Check for Perfect Clear
        const isPerfectClear = this.grid.every(row => row.every(cell => cell === 0));

        return { linesCleared, combo, isPerfectClear };
    }

    isGameOver() {
        // Check if any blocks in top row
        return this.grid[0].some(cell => cell !== 0);
    }

    getCell(x, y) {
        if (this.isInBounds(x, y)) {
            return this.grid[y][x];
        }
        return null;
    }
}

export default Board;
