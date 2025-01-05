import { TETROMINOES } from '../config/colors.js';
import { BOARD_WIDTH } from '../config/constants.js';

class Piece {
    constructor(type) {
        this.type = type;
        this.matrix = JSON.parse(JSON.stringify(TETROMINOES[type]));
        this.pos = {
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(this.matrix[0].length / 2),
            y: 0
        };
        this.offsetX = 0;
        this.offsetY = 0;
    }

    createPiece(type) {
        if (!TETROMINOES[type]) {
            console.error('Invalid piece type:', type);
            return null;
        }
        return JSON.parse(JSON.stringify(TETROMINOES[type]));
    }

    rotate(dir, board) {
        // Save original position and matrix
        const originalPos = { ...this.pos };
        const originalMatrix = this.matrix.map(row => [...row]);

        // Perform rotation
        this.rotateMatrix(dir);

        // Wall kick tests
        const offset = this.getWallKickOffset(board, originalMatrix, dir);
        if (offset) {
            this.pos.x += offset.x;
            this.pos.y += offset.y;
            return true;
        }

        // If no valid position found, revert rotation
        this.pos = originalPos;
        this.matrix = originalMatrix;
        return false;
    }

    rotateMatrix(dir) {
        // Transpose matrix
        for (let y = 0; y < this.matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    this.matrix[x][y],
                    this.matrix[y][x],
                ] = [
                    this.matrix[y][x],
                    this.matrix[x][y],
                ];
            }
        }

        // Reverse rows for clockwise, columns for counter-clockwise
        if (dir > 0) {
            this.matrix.forEach(row => row.reverse());
        } else {
            this.matrix.reverse();
        }
    }

    getWallKickOffset(board, originalMatrix, dir) {
        // Wall kick data (simplified SRS)
        const kicks = this.type === 'I' ? [
            [0, 0],
            [-2, 0],
            [1, 0],
            [-2, -1],
            [1, 2]
        ] : [
            [0, 0],
            [-1, 0],
            [1, 0],
            [0, 1],
            [-1, 1],
            [1, 1]
        ];

        // Try each possible wall kick
        for (let kick of kicks) {
            const offset = {
                x: kick[0],
                y: kick[1]
            };

            if (!board.isColliding(this, offset.x, offset.y)) {
                return offset;
            }
        }

        return null;
    }

    move(dir) {
        this.pos.x += dir;
    }

    drop() {
        this.pos.y++;
    }

    hardDrop(board) {
        while (!board.isColliding(this, 0, 1)) {
            this.drop();
        }
    }

    reset(type) {
        this.type = type;
        this.matrix = this.createPiece(type);
        this.pos.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(this.matrix[0].length / 2);
        this.pos.y = 0;
    }

    clone() {
        const clone = new Piece(this.type);
        clone.matrix = this.matrix.map(row => [...row]);
        clone.pos = { ...this.pos };
        return clone;
    }
}

export default Piece;
