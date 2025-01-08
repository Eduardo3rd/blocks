console.log('Main.js loading...');

// Core imports
import Board from './core/board.js';
import Piece from './core/piece.js';
import Scoring from './core/scoring.js';
import menuSystem from './ui/menus.js';
import displaySystem from './ui/display.js';
import PieceRenderer from './ui/pieceRenderer.js';

console.log('All modules imported');
console.log('displaySystem after import:', displaySystem);

// System imports
import audioSystem from './systems/audio.js';
import inputSystem from './systems/input.js';
import storageSystem from './systems/storage.js';
import controllerSystem from './systems/controller.js';

// UI imports
import previewSystem from './ui/preview.js';

// Utility imports
import { createBag, calculateDimensions } from './utils/helpers.js';

// Configuration imports
import { 
    GRID, 
    SPEED, 
    BOARD_WIDTH, 
    BOARD_HEIGHT, 
    QUEUE_SIZE,
    TETROMINOES
} from './config/constants.js';

console.log('Imported TETROMINOES:', TETROMINOES);

class Game {
    constructor() {
        this.canvas = document.getElementById('tetris');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize core game state
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.dropCounter = 0;
        this.pieceQueue = [];
        this.holdPiece = null;
        this.canHold = true;

        // Initialize systems
        this.scoring = new Scoring();
        this.initializeBoard();
    }

    initializeBoard() {
        try {
            console.log('Initializing board...');
            this.board = new Board();
            
            // Verify grid was created properly
            if (!Array.isArray(this.board?.grid)) {
                throw new Error('Board grid not properly initialized');
            }
            
            // Verify grid dimensions
            if (this.board.grid.length !== BOARD_HEIGHT || 
                !this.board.grid.every(row => Array.isArray(row) && row.length === BOARD_WIDTH)) {
                throw new Error('Board grid has incorrect dimensions');
            }
            
            console.log('Board initialized successfully');
        } catch (error) {
            console.error('Board initialization failed:', error);
            // Create a minimal board implementation
            this.board = {
                grid: Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)),
                reset: function() {
                    this.grid = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
                },
                isColliding: function() { return false; },
                merge: function() {},
                sweep: function() { return { linesCleared: 0, combo: 0 }; },
                isGameOver: function() { return false; }
            };
        }
    }

    // Add recovery method
    recoverBoardState() {
        if (!this.board?.grid) {
            console.warn('Attempting to recover board state');
            this.initializeBoard();
            return true;
        }
        return false;
    }

    async init() {
        try {
            console.log('Game init started');
            
            // Initialize systems
            await audioSystem.init();
            console.log('Audio initialized');
            
            displaySystem.init();
            console.log('Display initialized');
            
            previewSystem.init();
            console.log('Preview initialized');

            // Initialize input system
            inputSystem.init();
            console.log('Input initialized');

            // Set up canvas
            const dimensions = calculateDimensions(GRID, BOARD_WIDTH, BOARD_HEIGHT);
            this.canvas.width = dimensions.width;
            this.canvas.height = dimensions.height;

            // Load features and settings
            this.features = storageSystem.getFeatures();
            const settings = storageSystem.getSettings();
            this.scoring.setStartingLevel(settings.startingLevel);

            // Set up menu callbacks
            console.log('Setting up menu callbacks');
            menuSystem.setCallbacks({
                onStart: () => {
                    console.log('Start callback triggered');
                    this.start();
                },
                onResume: () => {
                    console.log('Resume callback triggered');
                    this.togglePause();
                },
                onRestart: () => {
                    console.log('Restart callback triggered');
                    this.restart();
                },
                onSettingsChanged: (features) => {
                    console.log('Settings changed:', features);
                    this.updateFeatures(features);
                }
            });

            // Initialize menu system last
            console.log('Initializing menu system');
            menuSystem.init();
            
            console.log('Game init completed');
        } catch (error) {
            console.error('Error during game initialization:', error);
        }
    }

    start() {
        console.log('Game start called');
        
        // Ensure board is properly initialized
        if (!this.board?.grid) {
            console.error('Board not properly initialized');
            this.board = new Board();
        }
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        this.board.reset();
        this.scoring.reset();
        this.resetPieceQueue();
        
        // Verify board state after reset
        if (!this.board.grid) {
            console.error('Board reset failed');
            return;
        }
        
        this.spawnPiece();
        inputSystem.reset();
        
        menuSystem.hideAllMenus();
        document.querySelectorAll('.game-overlay').forEach(overlay => {
            overlay.classList.add('visible');
        });
        
        this.update();
    }

    update(time = 0) {
        if (!this.isRunning || this.isPaused) {
            requestAnimationFrame(time => this.update(time));
            return;
        }

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        // Update input
        inputSystem.update(deltaTime);
        const actions = inputSystem.getActions();
        
        if (this.currentPiece) {
            this.handleInput(actions);

            // Update drop counter
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.scoring.getDropSpeed()) {
                this.dropPiece();
                this.dropCounter = 0;
            }

            // Check for lock delay
            if (this.isGrounded()) {
                if (this.currentPiece.lockTimer === null) {
                    this.currentPiece.startLockDelay();
                } else {
                    // Update lock delay timer
                    if (!this.currentPiece.updateLockDelay(deltaTime)) {
                        this.lockPiece();
                    }
                }
            }
        }
        
        this.draw();
        requestAnimationFrame(time => this.update(time));
    }

    handleInput(actions) {
        if (!this.currentPiece || this.isPaused) return;

        // Handle piece holding
        if (actions.hold && this.canHold && this.features.holdPiece !== false) {
            const currentType = this.currentPiece.type;
            
            // If there's no held piece, hold current and get next piece
            if (!this.holdPiece) {
                this.holdPiece = currentType;
                previewSystem.updateHoldPiece(currentType);
                this.spawnPiece();
            } else {
                // Swap current piece with held piece
                const heldType = this.holdPiece;
                this.holdPiece = currentType;
                previewSystem.updateHoldPiece(currentType);
                
                // Create new piece from previously held piece
                this.currentPiece = new Piece(heldType);
                this.currentPiece.pos.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(this.currentPiece.matrix[0].length / 2);
                this.currentPiece.pos.y = 0;

                // If the swapped piece can't be placed, game over
                if (this.board.isColliding(this.currentPiece)) {
                    this.gameOver();
                    return;
                }
            }

            try {
                audioSystem.play('hold');
            } catch (error) {
                console.warn('Audio not available');
            }
            
            this.canHold = false; // Prevent holding until next piece
            return;
        }

        // Only log when actions change from none to some or vice versa
        const hasActions = Object.values(actions).some(v => v);
        if (hasActions !== this._lastHadActions) {
            console.log('Actions:', hasActions ? 'active' : 'none');
            this._lastHadActions = hasActions;
        }

        if (actions.moveLeft) this.movePiece(-1);
        if (actions.moveRight) this.movePiece(1);
        if (actions.softDrop) this.dropPiece();
        if (actions.hardDrop) this.hardDrop();
        if (actions.rotateClockwise) this.rotatePiece(1);
        if (actions.rotateCounter) this.rotatePiece(-1);
        if (actions.pause) this.togglePause();
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board and pieces
        this.drawBoard();
        
        // Draw ghost piece if enabled
        if (this.features?.ghostPiece && this.currentPiece) {
            this.drawGhostPiece();
        }
        
        // Update preview and score displays
        displaySystem.updateScore(this.scoring.score);
        displaySystem.updateLevel(this.scoring.level);
        displaySystem.updateLines(this.scoring.lines);
        
        // Update preview if enabled
        if (this.features?.previewPieces) {
            previewSystem.updatePreviewQueue(this.pieceQueue.slice(0, QUEUE_SIZE));
        }
        
        // Update hold piece display if enabled
        if (this.features?.holdPiece) {
            previewSystem.updateHoldPiece(this.holdPiece);
        }
    }

    movePiece(dir) {
        if (!this.currentPiece) return false;

        this.currentPiece.pos.x += dir;
        if (this.board.isColliding(this.currentPiece)) {
            this.currentPiece.pos.x -= dir;
            return false;
        }

        // Reset lock delay if piece is grounded
        if (this.isGrounded() && this.currentPiece.lockTimer !== null) {
            this.currentPiece.resetLockDelay();
        }

        try {
            audioSystem.play('move');
        } catch (error) {
            console.warn('Audio not available');
        }
        return true;
    }

    rotatePiece(dir) {
        if (!this.currentPiece) return false;

        const result = this.currentPiece.rotate(dir, this.board);
        
        // Reset lock delay if rotation is successful and piece is grounded
        if (result && this.isGrounded() && this.currentPiece.lockTimer !== null) {
            this.currentPiece.resetLockDelay();
        }

        if (result) {
            try {
                audioSystem.play('rotate');
            } catch (error) {
                console.warn('Audio not available');
            }
        }
        return result;
    }

    dropPiece() {
        if (!this.currentPiece) {
            console.log('No current piece to drop');
            return false;
        }

        this.currentPiece.pos.y++;
        
        if (this.board.isColliding(this.currentPiece)) {
            this.currentPiece.pos.y--;
            
            // Start lock delay when piece lands
            if (this.currentPiece.lockTimer === null) {
                this.currentPiece.startLockDelay();
            }
            return false;
        }
        
        // Reset lock delay if piece is moving down
        this.currentPiece.lockTimer = null;
        return true;
    }

    hardDrop() {
        let dropCount = 0;
        while (this.dropPiece()) {
            dropCount++;
        }
        
        // Force immediate lock on hard drop
        this.currentPiece.lockTimer = 0;
        this.lockPiece();

        // Add controller feedback for hard drop
        controllerSystem.vibrate(50, 0.2, 0.2);
        try {
            audioSystem.play('drop');
        } catch (error) {
            console.warn('Audio not available');
        }
        this.scoring.updateScore(0, dropCount);
        displaySystem.updateAll(this.scoring.getState());
    }

    holdPiece() {
        if (!this.canHold || !this.features.holdPiece) return;

        audioSystem.play('move');
        const currentType = this.currentPiece.type;
        
        if (this.holdPiece === null) {
            this.holdPiece = currentType;
            this.spawnPiece();
        } else {
            const holdType = this.holdPiece;
            this.holdPiece = currentType;
            this.currentPiece = new Piece(holdType);
        }

        previewSystem.updateHoldPiece(this.holdPiece);
        this.canHold = false;
    }

    lockPiece() {
        if (!this.currentPiece) {
            console.log('No piece to lock');
            return;
        }

        // Check for T-spin before merging
        const isTSpin = this.currentPiece.isTSpin(this.board);
        const isMini = false; // TODO: Implement mini T-spin detection
        
        this.board.merge(this.currentPiece);
        
        const { linesCleared, combo, isPerfectClear } = this.board.sweep();
        console.log('Lines cleared:', linesCleared, 'T-spin:', isTSpin, 'Perfect Clear:', isPerfectClear);
        
        if (linesCleared > 0) {
            this.scoring.updateScore(linesCleared, 0, isTSpin, isMini, isPerfectClear);
            displaySystem.updateAll(this.scoring.getState());
            
            // Add controller feedback
            if (isPerfectClear) {
                controllerSystem.vibrate(500, 1.0, 1.0);
                audioSystem.play('perfectClear');
            } else if (isTSpin) {
                controllerSystem.vibrate(300, 0.8, 0.8);
                audioSystem.play('tspin');
            } else if (linesCleared === 4) {
                controllerSystem.vibrate(400, 0.7, 0.7);
                audioSystem.play('tetris');
            } else {
                controllerSystem.vibrate(100 * linesCleared, 0.3, 0.3);
                audioSystem.play('clear');
            }
        }

        if (this.board.isGameOver()) {
            console.log('Game over detected');
            this.gameOver();
            return;
        }

        this.spawnPiece();
        this.canHold = true;
    }

    spawnPiece() {
        // Check if we need to refill the queue
        if (this.pieceQueue.length <= QUEUE_SIZE) {
            const newPieces = createBag();
            this.pieceQueue.push(...newPieces);
        }

        const type = this.pieceQueue.shift();
        if (!type) {
            console.error('No piece type available');
            return false;
        }

        // Update the preview display
        previewSystem.updatePreviewQueue(this.pieceQueue.slice(0, QUEUE_SIZE));
        
        // Create and position the new piece
        this.currentPiece = new Piece(type);
        this.currentPiece.pos.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(this.currentPiece.matrix[0].length / 2);
        this.currentPiece.pos.y = 0;

        // Check if the new piece can be placed
        if (this.board.isColliding(this.currentPiece)) {
            return false;
        }

        return true;
    }

    drawBoard() {
        if (!this.ctx) {
            console.error('Canvas context not available');
            return;
        }

        // Clear the board area
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines
        displaySystem.drawGridLines(this.ctx, this.canvas.width, this.canvas.height);

        // Draw the grid
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            const row = this.board.grid[y];
            if (!Array.isArray(row)) continue;
            
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const value = row[x];
                if (value !== 0) {
                    displaySystem.drawBlock(this.ctx, x, y, value);
                }
            }
        }

        // Draw ghost piece
        if (this.currentPiece && this.features.ghostPiece !== false) {
            this.drawGhostPiece();
        }

        // Draw current piece
        if (this.currentPiece?.matrix) {
            this.drawPiece(this.currentPiece);
        }
    }

    drawPiece(piece, ghost = false) {
        PieceRenderer.drawPiece(
            this.ctx,
            piece,
            piece.pos.x * GRID,
            piece.pos.y * GRID,
            1,
            ghost ? 0.3 : 1
        );
    }

    drawGhostPiece() {
        const ghost = this.currentPiece.clone();
        while (!this.board.isColliding(ghost)) {
            ghost.pos.y++;
        }
        ghost.pos.y--;
        this.drawPiece(ghost, true);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        console.log('Game pause toggled:', this.isPaused);
        
        if (this.isPaused) {
            menuSystem.showMenu('pause');
        } else {
            menuSystem.hideAllMenus();
            this.lastTime = performance.now(); // Reset the time to prevent large delta
            requestAnimationFrame(this.update.bind(this)); // Restart the game loop
        }
    }

    gameOver() {
        console.log('=== GAME OVER ===');
        console.log('Final score:', this.scoring.score);
        console.log('High score:', this.scoring.highScore);
        this.isRunning = false;
        
        // Strong vibration for game over
        controllerSystem.vibrate(1000, 1.0, 1.0);
        
        // Update display with current high score
        displaySystem.updateHighScore(this.scoring.highScore);
        
        // Show game over screen
        const gameOverScreen = document.querySelector('.game-over');
        console.log('Game over screen element:', gameOverScreen);
        
        if (gameOverScreen) {
            // Remove any inline display style
            gameOverScreen.style.removeProperty('display');
            
            // Update final score
            const finalScoreElement = gameOverScreen.querySelector('.final-score');
            console.log('Final score element:', finalScoreElement);
            if (finalScoreElement) {
                finalScoreElement.textContent = this.scoring.score.toLocaleString();
            }
            
            // Update high score
            const finalHighScoreElement = gameOverScreen.querySelector('#final-high-score');
            console.log('Final high score element:', finalHighScoreElement);
            if (finalHighScoreElement) {
                finalHighScoreElement.textContent = this.scoring.highScore.toLocaleString();
            }
            
            // Update other stats
            const finalLinesElement = gameOverScreen.querySelector('#final-lines');
            if (finalLinesElement) {
                finalLinesElement.textContent = this.scoring.lines.toString();
            }
            
            const finalLevelElement = gameOverScreen.querySelector('#final-level');
            if (finalLevelElement) {
                finalLevelElement.textContent = this.scoring.level.toString();
            }
            
            // Show the screen
            console.log('Adding active class to game over screen');
            gameOverScreen.classList.add('active');
            console.log('Game over screen display style:', gameOverScreen.style.display);
            console.log('Game over screen classes:', gameOverScreen.classList.toString());
        } else {
            console.error('Game over screen element not found');
        }

        // Play game over sound
        try {
            audioSystem.play('gameOver');
        } catch (error) {
            console.warn('Audio not available');
        }
    }

    restart() {
        menuSystem.hideAllMenus();
        this.start();
    }

    updateFeatures(features) {
        this.features = features;
        if (!features.previewPieces) {
            previewSystem.hidePreview();
        }
        if (!features.holdPiece) {
            previewSystem.hideHold();
        }
    }

    resetPieceQueue() {
        console.log('Resetting piece queue');
        this.pieceQueue = [];
        this.holdPiece = null;
        this.canHold = true;
        previewSystem.reset();
        
        // Fill the queue with two bags initially to ensure we always have enough pieces
        const initialPieces = [...createBag(), ...createBag()];
        console.log('Initial pieces:', initialPieces);
        this.pieceQueue.push(...initialPieces);
    }

    isGrounded() {
        if (!this.currentPiece) return false;
        
        // Check if piece would collide if moved down
        this.currentPiece.pos.y++;
        const wouldCollide = this.board.isColliding(this.currentPiece);
        this.currentPiece.pos.y--;
        
        return wouldCollide;
    }
}

// Create game instance
const game = new Game();

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded in main.js');
    try {
        await game.init();
        // Show start menu after initialization
        const startMenu = document.getElementById('start-menu');
        if (startMenu) {
            startMenu.style.display = 'block';
            console.log('Start menu displayed');
        } else {
            console.error('Start menu element not found');
        }
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});

// Export game instance for debugging
window.game = game;
