import { TETROMINOES } from '../config/colors.js';
import { BOARD_WIDTH } from '../config/constants.js';

class Piece {
    constructor(type) {
        this.type = type;
        this.matrix = this.createPiece(type);
        this.pos = { x: 0, y: 0 };
        this.lastRotation = null;  // Track last rotation for T-spin detection
        this.lockDelay = 500;     // 500ms lock delay
        this.lockTimer = null;    // Timer for piece locking
        this.moveResets = 0;      // Count of move resets
        this.maxMoveResets = 15;  // Maximum number of move resets
    }

    rotate(dir, board) {
        const originalX = this.pos.x;
        let offset = 1;
        this.lastRotation = null;  // Reset last rotation

        // Store original position and matrix
        const originalPos = { ...this.pos };
        const originalMatrix = this.matrix.map(row => [...row]);

        // Perform rotation
        this._rotateMatrix(dir);

        // Try basic rotation
        if (!board.isColliding(this)) {
            this.lastRotation = { dir, kicks: 0 };
            return true;
        }

        // Wall kicks - try different offsets
        const kicks = [
            [0, 0],
            [-1, 0],
            [1, 0],
            [0, -1],
            [-1, -1],
            [1, -1]
        ];

        for (let i = 0; i < kicks.length; i++) {
            const [kickX, kickY] = kicks[i];
            this.pos.x = originalX + kickX;
            this.pos.y = originalPos.y + kickY;

            if (!board.isColliding(this)) {
                this.lastRotation = { dir, kicks: i + 1 };
                return true;
            }
        }

        // If no valid position found, restore original state
        this.pos = { ...originalPos };
        this.matrix = originalMatrix;
        return false;
    }

    _rotateMatrix(dir) {
        const N = this.matrix.length;
        const matrix = this.matrix;
        
        // Transpose matrix
        for (let i = 0; i < N; i++) {
            for (let j = i; j < N; j++) {
                [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
            }
        }
        
        // Reverse rows for clockwise, columns for counter-clockwise
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    isTSpin(board) {
        // Only check for T-spins if this is a T piece and was just rotated
        if (this.type !== 'T' || !this.lastRotation) return false;

        // Check the four corners around the T piece
        const corners = [
            { x: this.pos.x, y: this.pos.y },             // Top-left
            { x: this.pos.x + 2, y: this.pos.y },         // Top-right
            { x: this.pos.x, y: this.pos.y + 2 },         // Bottom-left
            { x: this.pos.x + 2, y: this.pos.y + 2 }      // Bottom-right
        ];

        // Count blocked corners
        let blockedCorners = 0;
        corners.forEach(corner => {
            if (!board.isInBounds(corner.x, corner.y) || 
                board.grid[corner.y]?.[corner.x] !== 0) {
                blockedCorners++;
            }
        });

        // T-spin requires at least 3 corners to be blocked
        return blockedCorners >= 3;
    }

    move(dir) {
        this.pos.x += dir;
    }

    drop() {
        this.pos.y++;
    }

    clone() {
        const clone = new Piece(this.type);
        clone.matrix = this.matrix.map(row => [...row]);
        clone.pos = { ...this.pos };
        return clone;
    }

    createPiece(type) {
        const pieces = {
            'I': [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            'L': [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0],
            ],
            'J': [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0],
            ],
            'O': [
                [1, 1],
                [1, 1],
            ],
            'T': [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0],
            ],
            'S': [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0],
            ],
            'Z': [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0],
            ]
        };
        return pieces[type].map(row => [...row]);
    }

    resetLockDelay() {
        if (this.moveResets < this.maxMoveResets) {
            this.lockTimer = this.lockDelay;
            this.moveResets++;
            return true;
        }
        return false;
    }

    updateLockDelay(deltaTime) {
        if (this.lockTimer !== null) {
            this.lockTimer -= deltaTime;
            return this.lockTimer > 0;
        }
        return false;
    }

    startLockDelay() {
        this.lockTimer = this.lockDelay;
        this.moveResets = 0;
    }

    shouldLock() {
        return this.lockTimer !== null && this.lockTimer <= 0;
    }
}

export default Piece;
