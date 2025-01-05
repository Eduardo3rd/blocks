import { BOARD_WIDTH, BOARD_HEIGHT } from '../config/constants.js';

class Board {
    constructor() {
        console.log('Creating new board');
        this.grid = this.createMatrix();
        if (!Array.isArray(this.grid)) {
            console.error('Failed to create grid, creating fallback');
            this.grid = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        }
        this.ensureValidGrid(); // Validate grid after creation
        console.log('Grid created:', this.grid);
    }

    createMatrix() {
        try {
            return Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        } catch (error) {
            console.error('Error creating matrix:', error);
            return null;
        }
    }

    ensureValidGrid() {
        if (!Array.isArray(this.grid)) {
            console.warn('Grid is not an array, recreating...');
            this.grid = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
            return;
        }
        
        // Check if grid height is correct
        if (this.grid.length !== BOARD_HEIGHT) {
            console.warn('Grid height is incorrect, recreating...');
            this.grid = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
            return;
        }
        
        // Ensure all rows exist and are valid
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (!Array.isArray(this.grid[y]) || this.grid[y].length !== BOARD_WIDTH) {
                this.grid[y] = new Array(BOARD_WIDTH).fill(0);
            }
            // Ensure all columns in this row exist
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (typeof this.grid[y][x] === 'undefined') {
                    this.grid[y][x] = 0;
                }
            }
        }
    }

    reset() {
        this.ensureValidGrid();
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                this.grid[y][x] = 0;
            }
        }
    }

    isColliding(piece) {
        const matrix = piece.matrix;
        const pos = piece.pos;
        
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] !== 0) {
                    const boardX = x + pos.x + piece.offsetX;
                    const boardY = y + pos.y + piece.offsetY;
                    
                    if (boardX < 0 || boardX >= BOARD_WIDTH || 
                        boardY >= BOARD_HEIGHT ||
                        (boardY >= 0 && this.grid[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    merge(piece) {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    this.grid[y + piece.pos.y][x + piece.pos.x] = piece.type;
                }
            });
        });
    }

    sweep() {
        let linesCleared = 0;
        let combo = 0;
        const newGrid = [];
        
        // Add new empty lines at top
        for (let i = 0; i < BOARD_HEIGHT; i++) {
            newGrid.push(new Array(BOARD_WIDTH).fill(0));
        }
        
        let writeY = BOARD_HEIGHT - 1;
        for (let readY = BOARD_HEIGHT - 1; readY >= 0; readY--) {
            if (!this.grid[readY].every(value => value !== 0)) {
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    newGrid[writeY][x] = this.grid[readY][x];
                }
                writeY--;
            } else {
                linesCleared++;
                combo++;
            }
        }
        
        this.grid = newGrid;
        return { linesCleared, combo: combo > 1 ? combo : 0 };
    }

    isValidPosition(piece, offsetX = 0, offsetY = 0) {
        const matrix = piece.matrix;
        const pos = piece.pos;

        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < matrix[y].length; ++x) {
                if (matrix[y][x] !== 0) {
                    const newX = x + pos.x + offsetX;
                    const newY = y + pos.y + offsetY;

                    if (newX < 0 || newX >= BOARD_WIDTH || 
                        newY >= BOARD_HEIGHT ||
                        (this.grid[newY] && this.grid[newY][newX] !== 0)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // Check if any part of the top row is filled (game over condition)
    isGameOver() {
        return this.grid[0].some(cell => cell !== 0);
    }
}

export default Board;
