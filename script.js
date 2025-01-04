/************************
 * 1. Constants and Configurations
 ************************/

// Canvas setup
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const grid = 32; // Size of each grid cell

// Piece definitions
const tetrominoes = {
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

// Piece colors
const colors = {
    'I': 'rgba(96, 216, 239, 0.8)',   // Light blue
    'O': 'rgba(247, 215, 148, 0.8)',  // Light yellow
    'T': 'rgba(193, 151, 210, 0.8)',  // Light purple
    'S': 'rgba(123, 237, 159, 0.8)',  // Light green
    'Z': 'rgba(255, 118, 117, 0.8)',  // Light red
    'J': 'rgba(116, 185, 255, 0.8)',  // Light blue
    'L': 'rgba(255, 164, 92, 0.8)'    // Light orange
};

// Game timing constants
const SPEED = {
    START: 1000,
    LEVELS: {
        // Early game (gradual increase)
        0: 1000,    // 1.0 tiles/sec
        1: 833,     // 1.2 tiles/sec
        2: 714,     // 1.4 tiles/sec
        3: 625,     // 1.6 tiles/sec
        4: 556,     // 1.8 tiles/sec
        5: 500,     // 2.0 tiles/sec
        6: 454,     // 2.2 tiles/sec
        7: 417,     // 2.4 tiles/sec
        8: 385,     // 2.6 tiles/sec
        
        // Mid game (faster increase)
        9: 357,     // 2.8 tiles/sec
        10: 333,    // 3.0 tiles/sec
        11: 312,    // 3.2 tiles/sec
        12: 294,    // 3.4 tiles/sec
        13: 278,    // 3.6 tiles/sec
        
        // Late game plateau
        15: 200,    // 5.0 tiles/sec
        16: 167,    // 6.0 tiles/sec
        17: 143,    // 7.0 tiles/sec
        18: 125,    // 8.0 tiles/sec
        19: 100,    // 10.0 tiles/sec
        20: 83,     // 12.0 tiles/sec
        21: 69,     // 14.5 tiles/sec
        22: 50,     // 20.0 tiles/sec
        23: 33,     // ~30 tiles/sec (plateau)
        
        // "Kill screen" speed
        29: 17      // ~60 tiles/sec
    }
};

const MOVE_SPEED = 100;      // Time between moves when holding a direction
const INITIAL_DELAY = 300;   // Initial delay before moving when holding a direction
const SOFT_DROP_SPEED = 50;  // Speed of soft drop
const COMBO_WINDOW = 3000;   // Time window for combos
const LOCK_DELAY = 500;  // 500ms to move piece after landing
const MAX_LOCK_RESETS = 15;  // Maximum number of moves/rotates before forcing lock

/************************
 * 2. Game State Variables
 ************************/

// Feature toggles
const gameFeatures = {
    scoreDisplay: true,
    levelDisplay: true,
    linesDisplay: true,
    holdPiece: true,
    previewPieces: true
};

// Game state
let gameStarted = false;
let isPaused = false;
let score = 0;
let lines = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = SPEED.START;
let lastTime = 0;
let lastMoveSound = 0;

// Piece state
let piece = null;
let heldPiece = null;
let canHold = true;
const pieceQueue = [];
const QUEUE_SIZE = 4;

// Input state
const keys = {
    ArrowLeft: { pressed: false, heldTime: 0, lastMove: 0 },
    ArrowRight: { pressed: false, heldTime: 0, lastMove: 0 },
    ArrowDown: { pressed: false, heldTime: 0, lastMove: 0 }
};

// Initialize game board
const arena = createMatrix(10, 20);  // Standard Tetris dimensions: 10x20

// Visual effects
let particles = [];

// Add high scores object at the top with other game state variables
const highScores = {
    marathon: 0,
    flow: 0
};

// Add lock delay state variables with other game state variables
let lockDelayTimer = 0;
let lockResets = 0;
let isGrounded = false;

/************************
 * 3. Utility Functions
 ************************/

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function rotate(matrix, dir) {
    // Transpose matrix
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    
    // Reverse rows for clockwise, columns for counter-clockwise
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function createPiece(type) {
    return JSON.parse(JSON.stringify(tetrominoes[type]));
}

/************************
 * 4. Audio System
 ************************/

const AudioSystem = {
    context: null,
    muted: false,
    volume: 0.5,
    
    init() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    },
    
    setVolume(value) {
        this.volume = value;
    },
    
    toggleMute() {
        this.muted = !this.muted;
    },
    
    playMove() {
        if (this.muted) return;
        this.playTone(400, 0.1, 'square', 0.2);
    },
    
    playRotate() {
        if (this.muted) return;
        this.playTone(600, 0.1, 'square', 0.2);
    },
    
    playDrop() {
        if (this.muted) return;
        this.playTone(200, 0.2, 'square', 0.3);
    },
    
    playClear() {
        if (this.muted) return;
        this.playTone(800, 0.3, 'sine', 0.4);
    },
    
    playTetris() {
        if (this.muted) return;
        setTimeout(() => this.playTone(400, 0.1, 'square', 0.3), 0);
        setTimeout(() => this.playTone(600, 0.1, 'square', 0.3), 100);
        setTimeout(() => this.playTone(800, 0.2, 'square', 0.3), 200);
    },
    
    playGameOver() {
        if (this.muted) return;
        setTimeout(() => this.playTone(400, 0.2, 'square', 0.3), 0);
        setTimeout(() => this.playTone(300, 0.2, 'square', 0.3), 200);
        setTimeout(() => this.playTone(200, 0.3, 'square', 0.3), 400);
    },
    
    playTone(frequency, duration, type = 'sine', baseVolume = 0.3) {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
        
        const adjustedVolume = baseVolume * this.volume;
        gainNode.gain.setValueAtTime(adjustedVolume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }
};

/************************
 * 5. Core Game Functions
 ************************/

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = player.type;
            }
        });
    });
}

function getLevelSpeed(level) {
    // If the level is directly defined, use that speed
    if (SPEED.LEVELS[level] !== undefined) {
        return SPEED.LEVELS[level];
    }
    
    // Find the nearest defined levels
    const definedLevels = Object.keys(SPEED.LEVELS)
        .map(Number)
        .sort((a, b) => a - b);
    
    // If beyond max defined level, use the highest speed
    if (level >= definedLevels[definedLevels.length - 1]) {
        return SPEED.LEVELS[definedLevels[definedLevels.length - 1]];
    }
    
    // Find surrounding levels and interpolate
    let lowerLevel = definedLevels.filter(l => l <= level).pop();
    let upperLevel = definedLevels.filter(l => l > level)[0];
    
    // Linear interpolation between speeds
    let ratio = (level - lowerLevel) / (upperLevel - lowerLevel);
    return Math.round(
        SPEED.LEVELS[lowerLevel] + 
        (SPEED.LEVELS[upperLevel] - SPEED.LEVELS[lowerLevel]) * ratio
    );
}

function arenaSweep() {
    let rowCount = 0;
    
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        
        rowCount++;
    }
    
    if (rowCount > 0) {
        const lineScores = [0, 100, 300, 500, 800];
        const baseScore = lineScores[rowCount] || 0;
        score += baseScore * (level + 1);  // Add 1 to level to handle level 0
        
        lines += rowCount;
        
        // Update level - account for starting level
        const startingLevel = parseInt(document.getElementById('starting-level').value) || 0;
        level = Math.max(startingLevel, Math.floor(lines / 10) + startingLevel);
        dropInterval = getLevelSpeed(level);
        
        if (rowCount === 4) {
            AudioSystem.playTetris();
        } else {
            AudioSystem.playClear();
        }
        
        // Update all displays
        updateScoreDisplay();
        
        // Log scoring for debugging
        console.log(`Cleared ${rowCount} lines at level ${level}. Score added: ${baseScore * (level + 1)}`);
    }
    
    return rowCount;
}

function playerDrop() {
    piece.pos.y++;
    if (collide(arena, piece)) {
        piece.pos.y--;
        
        // Start lock delay when piece first touches ground
        if (!isGrounded) {
            isGrounded = true;
            lockDelayTimer = LOCK_DELAY;
            lockResets = 0;
        }
        
        // Only merge and reset if lock delay is up or max resets reached
        if (lockDelayTimer <= 0 || lockResets >= MAX_LOCK_RESETS) {
            merge(arena, piece);
            pieceReset();
            arenaSweep();
            AudioSystem.playDrop();
            isGrounded = false;
        }
    } else {
        isGrounded = false;
        // Add points for soft drop
        score += 1;
        updateScoreDisplay();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    piece.pos.x += dir;
    if (collide(arena, piece)) {
        piece.pos.x -= dir;
        return false;
    }
    
    // Reset lock delay if piece is grounded and hasn't exceeded max resets
    if (isGrounded && lockResets < MAX_LOCK_RESETS) {
        lockDelayTimer = LOCK_DELAY;
        lockResets++;
    }
    
    AudioSystem.playMove();
    return true;
}

function playerRotate(dir) {
    const pos = piece.pos.x;
    let offset = 1;
    rotate(piece.matrix, dir);
    
    while (collide(arena, piece)) {
        piece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > piece.matrix[0].length) {
            rotate(piece.matrix, -dir);
            piece.pos.x = pos;
            return;
        }
    }
    
    // Reset lock delay if piece is grounded and hasn't exceeded max resets
    if (isGrounded && lockResets < MAX_LOCK_RESETS) {
        lockDelayTimer = LOCK_DELAY;
        lockResets++;
    }
    
    AudioSystem.playRotate();
}

function pieceReset() {
    fillQueue();  // Ensure queue is filled
    const nextPiece = pieceQueue.shift();  // Take first piece from queue
    
    piece = {
        matrix: nextPiece.matrix,
        type: nextPiece.type,
        pos: {
            x: Math.floor(arena[0].length / 2) - Math.floor(nextPiece.matrix[0].length / 2),
            y: 0
        }
    };
    
    // Check for game over
    if (collide(arena, piece)) {
        gameOver();
    }
    
    canHold = true;
    updatePreviewDisplay();
}

function fillQueue() {
    while (pieceQueue.length < QUEUE_SIZE) {
        const pieces = 'ILJOTSZ';
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        pieceQueue.push({
            type,
            matrix: createPiece(type)
        });
    }
}

function gameOver() {
    gameStarted = false;
    
    // Check for new high score
    if (score > highScores.marathon) {
        highScores.marathon = score;
        localStorage.setItem('tetrisHighScore', score.toString());
    }
    
    // Show game over screen with final score and high score
    const gameOverScreen = document.createElement('div');
    gameOverScreen.className = 'game-over';
    gameOverScreen.innerHTML = `
        <h1>GAME OVER</h1>
        <p>Score: ${score}</p>
        <p>High Score: ${highScores.marathon}</p>
        <button onclick="startGame()">Play Again</button>
    `;
    document.body.appendChild(gameOverScreen);
}

function startGame() {
    try {
        // Initialize audio first
        AudioSystem.init();
        
        // Hide start menu
        document.getElementById('start-menu').style.display = 'none';
        
        // Reset game state
        score = 0;
        lines = 0;
        
        // Get starting level from selector
        const levelSelector = document.getElementById('starting-level');
        level = levelSelector ? parseInt(levelSelector.value) : 1;
        
        dropCounter = 0;
        dropInterval = getLevelSpeed(level);
        lastTime = performance.now();
        gameStarted = true;
        isPaused = false;
        heldPiece = null;
        canHold = true;
        
        // Clear arena
        arena.forEach(row => row.fill(0));
        
        // Initialize piece queue
        pieceQueue.length = 0;
        fillQueue();
        
        // Reset piece
        pieceReset();
        
        // Load high score first
        loadHighScore();
        
        // Force initial display updates and ensure visibility
        const displays = ['score-display', 'high-score-display', 'level-display', 'lines-display'];
        displays.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('visible');
                element.style.opacity = '1';
            }
        });
        
        updateScoreDisplay();
        updatePreviewDisplay();
        drawHeldPiece();
        
        // Start game loop
        lastTime = performance.now();
        requestAnimationFrame(update);
        
        // Force an initial draw
        draw();
        
    } catch (e) {
        console.error('Error starting game:', e);
    }
}

// Add function to load high score
function loadHighScore() {
    const savedHighScore = localStorage.getItem('tetrisHighScore');
    if (savedHighScore) {
        highScores.marathon = parseInt(savedHighScore);
        document.querySelector('#high-score-display .score-value').textContent = highScores.marathon.toLocaleString();
    }
}

// Update the updateScoreDisplay function
function updateScoreDisplay() {
    if (!gameFeatures.scoreDisplay) return;
    
    // Update score display
    const scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
        scoreDisplay.classList.add('visible');
        scoreDisplay.style.opacity = '1';
        scoreDisplay.querySelector('.score-value').textContent = score.toLocaleString();
    }
    
    // Update high score display
    const highScoreDisplay = document.getElementById('high-score-display');
    if (highScoreDisplay) {
        highScoreDisplay.classList.add('visible');
        highScoreDisplay.style.opacity = '1';
        
        // Update high score if current score is higher
        if (score > highScores.marathon) {
            highScores.marathon = score;
            localStorage.setItem('tetrisHighScore', score.toString());
        }
        highScoreDisplay.querySelector('.score-value').textContent = highScores.marathon.toLocaleString();
    }
    
    // Update level display
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay) {
        levelDisplay.classList.add('visible');
        levelDisplay.style.opacity = '1';
        levelDisplay.querySelector('.score-value').textContent = level.toString();
    }
    
    // Update lines display
    const linesDisplay = document.getElementById('lines-display');
    if (linesDisplay) {
        linesDisplay.classList.add('visible');
        linesDisplay.style.opacity = '1';
        linesDisplay.querySelector('.score-value').textContent = lines.toString();
    }
}

/************************
 * 6. Drawing Functions
 ************************/

function draw() {
    // Clear the canvas
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate board dimensions and position
    const boardWidth = arena[0].length * grid;
    const boardHeight = arena.length * grid;
    const boardX = (canvas.width - boardWidth) / 2;
    const boardY = (canvas.height - boardHeight) / 2;
    
    // Draw board background
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(boardX - 2, boardY - 2, boardWidth + 4, boardHeight + 4);
    
    // Draw board outline
    context.strokeStyle = 'rgba(255, 255, 255, 0.8)';  // Brighter white outline
    context.lineWidth = 2;
    context.strokeRect(boardX - 2, boardY - 2, boardWidth + 4, boardHeight + 4);
    
    // Draw grid
    context.strokeStyle = 'rgba(255, 255, 255, 0.2)';  // Stronger grid lines
    context.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= arena[0].length; x++) {
        context.beginPath();
        context.moveTo(boardX + x * grid, boardY);
        context.lineTo(boardX + x * grid, boardY + boardHeight);
        context.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= arena.length; y++) {
        context.beginPath();
        context.moveTo(boardX, boardY + y * grid);
        context.lineTo(boardX + boardWidth, boardY + y * grid);
        context.stroke();
    }
    
    // Draw the game board
    context.save();
    context.translate(boardX, boardY);
    drawMatrix(arena, {x: 0, y: 0});
    
    // Draw the current piece
    if (piece) {
        drawGhost();
        drawMatrix(piece.matrix, piece.pos);
    }
    
    // Restore context
    context.restore();
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const xPos = x * grid + offset.x * grid;
                const yPos = y * grid + offset.y * grid;
                
                const pieceType = typeof value === 'string' ? value : matrix.type;
                context.fillStyle = colors[pieceType];
                context.fillRect(xPos, yPos, grid - 1, grid - 1);
                
                // Draw black outline
                context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                context.lineWidth = 1;
                context.strokeRect(xPos, yPos, grid - 1, grid - 1);
            }
        });
    });
}

function drawGhost() {
    const ghost = {
        matrix: piece.matrix,
        pos: { x: piece.pos.x, y: piece.pos.y }
    };
    
    while (!collide(arena, ghost)) {
        ghost.pos.y++;
    }
    ghost.pos.y--;
    
    ghost.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const xPos = x * grid + ghost.pos.x * grid;
                const yPos = y * grid + ghost.pos.y * grid;
                
                // Draw ghost with piece color but very transparent
                context.fillStyle = colors[piece.type].replace('0.8', '0.2');
                context.fillRect(xPos, yPos, grid - 1, grid - 1);
                context.strokeStyle = colors[piece.type].replace('0.8', '0.3');
                context.strokeRect(xPos, yPos, grid - 1, grid - 1);
            }
        });
    });
}

function drawHeldPiece() {
    const holdDisplay = document.getElementById('hold-display');
    if (!holdDisplay || !gameFeatures.holdPiece) return;
    
    // Update visibility
    const shouldBeVisible = gameFeatures.holdPiece && gameStarted && !isPaused;
    holdDisplay.classList.toggle('visible', shouldBeVisible);
    
    const container = holdDisplay.querySelector('.hold-piece-container');
    if (!container) return;
    
    // Clear existing blocks
    container.innerHTML = '';
    if (!heldPiece) return;
    
    drawPieceInContainer(heldPiece, container);
}

function updatePreviewDisplay() {
    const previewDisplay = document.getElementById('preview-display');
    if (!previewDisplay || !gameFeatures.previewPieces) return;
    
    // Update visibility
    const shouldBeVisible = gameFeatures.previewPieces && gameStarted && !isPaused;
    previewDisplay.classList.toggle('visible', shouldBeVisible);
    
    // Get all preview containers
    const containers = previewDisplay.querySelectorAll('.preview-piece-container');
    
    // Clear and update each container
    containers.forEach((container, index) => {
        container.innerHTML = '';
        if (index >= pieceQueue.length) return;
        
        const previewPiece = pieceQueue[index];
        drawPieceInContainer(previewPiece, container);
    });
}

function drawPieceInContainer(piece, container) {
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Find piece bounds
    let minX = piece.matrix[0].length;
    let maxX = 0;
    let minY = piece.matrix.length;
    let maxY = 0;
    
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        });
    });
    
    const pieceWidth = maxX - minX + 1;
    const pieceHeight = maxY - minY + 1;
    const pieceDimension = Math.max(pieceWidth, pieceHeight);
    
    const blockSize = Math.floor(Math.min(containerWidth, containerHeight) * 0.8 / pieceDimension);
    
    const totalWidth = pieceWidth * blockSize;
    const totalHeight = pieceHeight * blockSize;
    
    const xCenter = (containerWidth - totalWidth) / 2;
    const yCenter = (containerHeight - totalHeight) / 2;
    
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const block = document.createElement('div');
                block.className = 'tetris-block';
                
                const relativeX = x - minX;
                const relativeY = y - minY;
                
                Object.assign(block.style, {
                    position: 'absolute',
                    width: `${blockSize}px`,
                    height: `${blockSize}px`,
                    left: `${xCenter + (relativeX * blockSize)}px`,
                    top: `${yCenter + (relativeY * blockSize)}px`,
                    backgroundColor: colors[piece.type],
                    border: '1px solid rgba(0, 0, 0, 0.5)',
                    boxShadow: 'none'  // Remove glow effect
                });
                
                container.appendChild(block);
            }
        });
    });
}

/************************
 * 7. Input Handling
 ************************/

function handleKeyDown(event) {
    if (!gameStarted || isPaused) return;
    
    if (event.key in keys) {
        event.preventDefault();
        if (!keys[event.key].pressed) {
            keys[event.key].pressed = true;
            keys[event.key].heldTime = 0;
            keys[event.key].lastMove = performance.now();
            
            // Immediate action
            switch (event.key) {
                case 'ArrowLeft':
                    playerMove(-1);
                    break;
                case 'ArrowRight':
                    playerMove(1);
                    break;
                case 'ArrowDown':
                    playerDrop();
                    break;
            }
        }
    } else {
        switch (event.key) {
            case 'ArrowUp':
                playerRotate(1);
                break;
            case ' ':  // Space
                hardDrop();
                break;
            case 'c':
            case 'C':
                holdPiece();
                break;
            case 'Escape':
                togglePause();
                break;
        }
    }
}

function handleKeyUp(event) {
    if (event.key in keys) {
        event.preventDefault();
        keys[event.key].pressed = false;
        keys[event.key].heldTime = 0;
    }
}

function hardDrop() {
    let dropDistance = 0;
    while (!collide(arena, piece)) {
        piece.pos.y++;
        dropDistance++;
    }
    piece.pos.y--;
    
    // Add points for hard drop (2 points per cell dropped)
    score += dropDistance * 2;
    
    merge(arena, piece);
    pieceReset();
    arenaSweep();
    AudioSystem.playDrop();
    updateScoreDisplay();
}

function holdPiece() {
    if (!gameFeatures.holdPiece || !canHold) return;
    
    const currentType = piece.type;
    const currentMatrix = createPiece(currentType);
    
    if (heldPiece) {
        // Swap with held piece
        piece = {
            matrix: createPiece(heldPiece.type),
            type: heldPiece.type,
            pos: {
                x: Math.floor(arena[0].length / 2) - Math.floor(tetrominoes[heldPiece.type][0].length / 2),
                y: 0
            }
        };
    } else {
        // No held piece, get next from queue
        pieceReset();
    }
    
    heldPiece = {
        type: currentType,
        matrix: currentMatrix
    };
    
    canHold = false;
    drawHeldPiece();
}

function togglePause() {
    if (!gameStarted) return;
    
    isPaused = !isPaused;
    document.getElementById('pause-menu').style.display = isPaused ? 'block' : 'none';
    
    if (!isPaused) {
        lastTime = performance.now();
        requestAnimationFrame(update);
    }
}

// Add these gamepad functions
let gamepadIndex = null;

function pollGamepad() {
    const gamepads = navigator.getGamepads();
    
    // Find first connected gamepad
    if (gamepadIndex === null) {
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && gamepads[i].connected) {
                gamepadIndex = i;
                break;
            }
        }
        return;  // No gamepad found
    }
    
    const gamepad = gamepads[gamepadIndex];
    if (!gamepad) {
        gamepadIndex = null;
        return;
    }
    
    // D-pad
    if (gamepad.buttons[12].pressed) {  // Up
        playerRotate(1);
    }
    if (gamepad.buttons[13].pressed) {  // Down
        playerDrop();
    }
    if (gamepad.buttons[14].pressed) {  // Left
        playerMove(-1);
    }
    if (gamepad.buttons[15].pressed) {  // Right
        playerMove(1);
    }
    
    // Action buttons
    if (gamepad.buttons[0].pressed) {  // A - Rotate
        playerRotate(1);
    }
    if (gamepad.buttons[1].pressed) {  // B - Hard Drop
        hardDrop();
    }
    if (gamepad.buttons[2].pressed) {  // X - Hold
        holdPiece();
    }
    if (gamepad.buttons[9].pressed) {  // Start - Pause
        togglePause();
    }
}

// Add gamepad connection handlers
window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connected:", e.gamepad);
    gamepadIndex = e.gamepad.index;
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnected:", e.gamepad);
    if (gamepadIndex === e.gamepad.index) {
        gamepadIndex = null;
    }
});

/************************
 * 8. Game Loop
 ************************/

function update(time = 0) {
    if (!gameStarted || isPaused) return;
    
    const deltaTime = time - lastTime;
    
    // Update drop counter
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
        dropCounter = 0;
    }
    
    // Update lock delay timer if piece is grounded
    if (isGrounded && lockDelayTimer > 0) {
        lockDelayTimer -= deltaTime;
        if (lockDelayTimer <= 0) {
            playerDrop();  // Force the piece to lock
        }
    }
    
    // Handle held movement keys
    Object.keys(keys).forEach(key => {
        if (keys[key].pressed) {
            keys[key].heldTime += deltaTime;
            if (keys[key].heldTime >= INITIAL_DELAY) {
                const timeSinceLastMove = time - keys[key].lastMove;
                if (timeSinceLastMove >= MOVE_SPEED) {
                    switch (key) {
                        case 'ArrowLeft':
                            playerMove(-1);
                            break;
                        case 'ArrowRight':
                            playerMove(1);
                            break;
                        case 'ArrowDown':
                            playerDrop();
                            break;
                    }
                    keys[key].lastMove = time;
                }
            }
        }
    });
    
    lastTime = time;
    draw();
    requestAnimationFrame(update);
}

/************************
 * 9. Event Listeners
 ************************/

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initial setup
    resizeCanvas();
    
    // Initialize feature toggles
    initializeFeatureToggles();
    
    // Initialize gamepad polling
    setInterval(pollGamepad, 16);
    
    // Show start menu
    const startMenu = document.getElementById('start-menu');
    if (startMenu) {
        startMenu.style.display = 'block';
        console.log('Showing start menu');
        
        const playButton = startMenu.querySelector('.menu-btn');
        if (playButton) {
            playButton.onclick = function() {
                console.log('Play button clicked');
                AudioSystem.init();
                startGame();
            };
        }
    }
    initializeTouchControls();
    
    initializeLevelSelector();
});

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
});

// Input handlers
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Canvas resize function
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/************************
 * 6. Feature Functions
 ************************/

function initializeFeatureToggles() {
    // Score toggle
    document.getElementById('toggle-score').checked = gameFeatures.scoreDisplay;
    document.getElementById('toggle-score').addEventListener('change', (e) => {
        gameFeatures.scoreDisplay = e.target.checked;
        updateScoreDisplay();
    });
    
    // Level toggle
    document.getElementById('toggle-level').checked = gameFeatures.levelDisplay;
    document.getElementById('toggle-level').addEventListener('change', (e) => {
        gameFeatures.levelDisplay = e.target.checked;
        updateScoreDisplay();
    });

    // Lines toggle
    document.getElementById('toggle-lines').checked = gameFeatures.linesDisplay;
    document.getElementById('toggle-lines').addEventListener('change', (e) => {
        gameFeatures.linesDisplay = e.target.checked;
        updateScoreDisplay();
    });

    // Hold piece toggle
    document.getElementById('toggle-hold').checked = gameFeatures.holdPiece;
    document.getElementById('toggle-hold').addEventListener('change', (e) => {
        gameFeatures.holdPiece = e.target.checked;
        drawHeldPiece();
    });

    // Preview toggle
    document.getElementById('toggle-preview').checked = gameFeatures.previewPieces;
    document.getElementById('toggle-preview').addEventListener('change', (e) => {
        gameFeatures.previewPieces = e.target.checked;
        updatePreviewDisplay();
    });
}

// Add this to your initialization code
function initializeTouchControls() {
    const touchButtons = {
        'touch-left': () => playerMove(-1),
        'touch-right': () => playerMove(1),
        'touch-down': () => playerDrop(),
        'touch-rotate': () => playerRotate(1),
        'touch-drop': () => hardDrop(),
        'touch-hold': () => holdPiece()
    };

    // Handle both touch and mouse events for each button
    Object.keys(touchButtons).forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!gameStarted || isPaused) return;
                touchButtons[id]();
            });

            // Mouse events
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (!gameStarted || isPaused) return;
                touchButtons[id]();
            });
        }
    });

    // Prevent default touch behaviors
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('#mobile-controls')) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Add this to your initialization code where you set up the start menu
function initializeLevelSelector() {
    const levelSelector = document.getElementById('starting-level');
    if (!levelSelector) return;

    // Clear existing options
    levelSelector.innerHTML = '';
    
    // Add levels 0-29
    for (let i = 0; i <= 29; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        levelSelector.appendChild(option);
    }
}

// Add reset high score function
function resetHighScore() {
    // Reset high score in memory
    highScores.marathon = 0;
    
    // Clear from localStorage
    localStorage.removeItem('tetrisHighScore');
    
    // Update display
    const highScoreDisplay = document.getElementById('high-score-display');
    if (highScoreDisplay) {
        highScoreDisplay.querySelector('.score-value').textContent = '0';
    }
}