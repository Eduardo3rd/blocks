// Initialize the game
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const grid = 32;
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

const colors = {
    'I': '#00f0f0',
    'O': '#f0f000',
    'T': '#a000f0',
    'S': '#00f000',
    'Z': '#f00000',
    'J': '#0000f0',
    'L': '#f0a000'
};

// Game constants
const PREVIEW_COUNT = 3;
const COMBO_WINDOW = 3000;
const MAX_ZONE_ENERGY = 100;
const ZONE_TIME = 10000;
const DEADZONE = 0.5;
const LOCK_DELAY = 500;  // 500ms to move piece after touching ground
const MAX_LOCK_MOVES = 15;  // Maximum number of moves during lock delay

// Additional game state variables
let gameTime = 0;
let dropScore = 0;
let canHold = true;
let comboCount = 0;
let lastClearTime = 0;
let zoneEnergy = 0;
let inZone = false;
let zoneLines = [];  // Store lines as arrays of row indices
let normalDropInterval;
let gamepadIndex = null;
let lastGamepadState = null;
let gameMode = null;
let lockDelay = 0;
let lockMoves = 0;
let isLocking = false;

// Controller configuration
const controllerConfig = {
    left: 14,      // D-pad left
    right: 15,     // D-pad right
    down: 13,      // D-pad down
    rotate: 0,     // A button
    hardDrop: 3,   // Y button
    hold: 2,       // X button
    zone: 1,       // B button
    pause: 9       // Start button
};

// Theme system
const levelThemes = {
    0: {  // Default theme (blue)
        background: ['#000033', '#000066'],
        gridLines: 'rgba(255, 255, 255, 0.05)',
        particles: '#ffffff'
    },
    5: {  // Purple theme
        background: ['#1a0033', '#330066'],
        gridLines: 'rgba(255, 255, 255, 0.07)',
        particles: '#cc99ff'
    },
    10: {  // Red theme
        background: ['#330000', '#660000'],
        gridLines: 'rgba(255, 255, 255, 0.08)',
        particles: '#ff9999'
    },
    15: {  // Green theme
        background: ['#003300', '#006600'],
        gridLines: 'rgba(255, 255, 255, 0.06)',
        particles: '#99ff99'
    },
    20: {  // Gold theme
        background: ['#332200', '#664400'],
        gridLines: 'rgba(255, 255, 255, 0.1)',
        particles: '#ffcc66'
    }
};

function getCurrentTheme() {
    const thresholds = Object.keys(levelThemes)
        .map(Number)
        .sort((a, b) => b - a);
    
    for (const threshold of thresholds) {
        if (level >= threshold) {
            return levelThemes[threshold];
        }
    }
    return levelThemes[0];
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    return tetrominoes[type];
}

function startGame(mode) {
    // Hide menus
    const startMenu = document.getElementById('start-menu');
    const gameOverScreen = document.getElementById('game-over');
    const pauseText = document.getElementById('pause-text');
    
    if (startMenu) startMenu.style.display = 'none';
    if (gameOverScreen) gameOverScreen.style.display = 'none';
    if (pauseText) pauseText.style.display = 'none';
    
    // Reset game state
    gameMode = mode;
    score = 0;
    lines = 0;
    level = 1;
    dropScore = 0;
    zoneEnergy = 0;
    inZone = false;
    gameTime = 0;
    dropInterval = 1000;
    lastTime = performance.now();
    comboCount = 0;
    lastClearTime = 0;
    hasHeld = false;
    heldPiece = null;
    isPaused = false;
    
    // Clear arena
    arena.forEach(row => row.fill(0));
    
    // Initialize pieces queue
    nextPieces = [];
    for (let i = 0; i < PREVIEW_COUNT; i++) {
        const pieces = 'ILJOTSZ';
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        nextPieces.push({
            matrix: createPiece(type),
            type: type
        });
    }
    
    // Reset piece
    pieceReset();
    
    // Start game
    gameStarted = true;
    update();
}

// Game state
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameStarted = false;
let isPaused = false;
let hasHeld = false;
let score = 0;
let lines = 0;
let level = 1;

// Initialize arena
const arena = createMatrix(10, 20);  // Standard Tetris dimensions: 10x20

// Initialize pieces
let piece = null;
let heldPiece = null;
let nextPieces = [];

// Initialize particles
let particles = [];

// Load high scores
let highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [];

// Rest of the code...
// ... existing code ...

// Event Listeners
document.addEventListener('keydown', event => {
    if (!gameStarted) {
        if (event.key === 'Enter') {
            startGame('normal');
        }
        return;
    }
    
    if (event.key === 'p' || event.key === 'P') {
        togglePause();
        return;
    }
    
    if (isPaused) return;
    
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
        case 'ArrowUp':
            playerRotate(1);
            break;
        case ' ':
            playerHardDrop();
            break;
        case 'c':
        case 'C':
            holdPiece();
            break;
        case 'Shift':
            if (zoneEnergy >= MAX_ZONE_ENERGY) {
                activateZone();
            }
            break;
    }
});

// Gamepad support
window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connected:", e.gamepad);
    gamepadIndex = e.gamepad.index;
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnected:", e.gamepad);
    gamepadIndex = null;
});

function pollGamepad() {
    if (gamepadIndex !== null) {
        const gamepad = navigator.getGamepads()[gamepadIndex];
        if (!gamepad) return;
        
        const currentState = {
            left: gamepad.buttons[controllerConfig.left].pressed,
            right: gamepad.buttons[controllerConfig.right].pressed,
            down: gamepad.buttons[controllerConfig.down].pressed,
            rotate: gamepad.buttons[controllerConfig.rotate].pressed,
            hardDrop: gamepad.buttons[controllerConfig.hardDrop].pressed,
            hold: gamepad.buttons[controllerConfig.hold].pressed,
            zone: gamepad.buttons[controllerConfig.zone].pressed
        };
        
        if (!lastGamepadState) {
            lastGamepadState = currentState;
            return;
        }
        
        if (currentState.left && !lastGamepadState.left) playerMove(-1);
        if (currentState.right && !lastGamepadState.right) playerMove(1);
        if (currentState.down && !lastGamepadState.down) playerDrop();
        if (currentState.rotate && !lastGamepadState.rotate) playerRotate(1);
        if (currentState.hardDrop && !lastGamepadState.hardDrop) playerHardDrop();
        if (currentState.hold && !lastGamepadState.hold) holdPiece();
        if (currentState.zone && !lastGamepadState.zone && zoneEnergy >= MAX_ZONE_ENERGY) activateZone();
        
        lastGamepadState = currentState;
    }
}

function holdPiece() {
    if (hasHeld) return;
    
    if (heldPiece === null) {
        // Store current piece type and create a fresh matrix for held piece
        heldPiece = createPiece(piece.type);
        pieceReset();
    } else {
        // Swap with held piece
        const currentType = piece.type;
        const heldType = Object.keys(tetrominoes).find(key => 
            JSON.stringify(tetrominoes[key]) === JSON.stringify(heldPiece));
        
        // Create fresh matrices for both pieces
        heldPiece = createPiece(currentType);
        piece.matrix = createPiece(heldType);
        piece.type = heldType;
        piece.pos.y = 0;
        piece.pos.x = Math.floor(arena[0].length / 2) - 1;
    }
    
    hasHeld = true;
}

function activateZone() {
    if (inZone) return;
    
    inZone = true;
    zoneTimeLeft = ZONE_TIME;
    zoneLines = [];  // Store lines as arrays of row indices
    normalDropInterval = dropInterval;
    dropInterval = dropInterval * 2; // Slow down during zone
    
    // Create zone activation particles
    for (let i = 0; i < 50; i++) {
        particles.push(createParticle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            'zone'
        ));
    }
    
    // Show zone is active
    const zoneIndicator = document.getElementById('zone-indicator');
    if (zoneIndicator) {
        zoneIndicator.classList.add('active');
    }
}

function togglePause() {
    isPaused = !isPaused;
    const pauseText = document.getElementById('pause-text');
    const settingsPanel = document.getElementById('settings-panel');
    
    if (pauseText) pauseText.style.display = isPaused ? 'flex' : 'none';
    if (settingsPanel) settingsPanel.style.display = isPaused ? 'flex' : 'none';
    
    if (!isPaused) {
        lastTime = performance.now();
        update();
    }
}

function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('lines').textContent = lines;
    document.getElementById('level').textContent = level;
    document.getElementById('combo').textContent = comboCount;
}

function hideControls() {
    const settingsPanel = document.getElementById('settings-panel');
    const startMenu = document.getElementById('start-menu');
    
    if (settingsPanel) settingsPanel.style.display = 'none';
    if (startMenu) startMenu.style.display = 'flex';
}

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvas();
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (gameStarted) {
        draw();
    }
}

// Initial resize
resizeCanvas();

// Start animation loop
update();

// Poll gamepad every frame
setInterval(pollGamepad, 16);

// Show start menu
document.getElementById('start-menu').style.display = 'flex'; 

function update(time = 0) {
    if (!gameStarted) return;
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    // Update game time
    gameTime += deltaTime;
    
    // Update zone meter UI
    const zoneMeter = document.getElementById('zone-meter');
    if (zoneMeter) {
        if (inZone) {
            // During zone, show remaining time
            zoneMeter.style.width = (zoneTimeLeft / ZONE_TIME * 100) + '%';
        } else {
            // Outside zone, show energy
            zoneMeter.style.width = (zoneEnergy / MAX_ZONE_ENERGY * 100) + '%';
        }
    }
    
    // Handle piece locking
    if (piece) {
        const testPos = { ...piece.pos, y: piece.pos.y + 1 };
        if (collide(arena, { ...piece, pos: testPos })) {
            if (!isLocking) {
                isLocking = true;
                lockDelay = LOCK_DELAY;
                lockMoves = 0;
            } else {
                lockDelay -= deltaTime;
                if (lockDelay <= 0 || lockMoves >= MAX_LOCK_MOVES) {
                    piece.pos.y--;
                    merge(arena, piece);
                    pieceReset();
                    arenaSweep();
                    updateScore();
                    isLocking = false;
                }
            }
        } else {
            isLocking = false;
        }
    }
    
    // Handle piece dropping
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
        dropCounter = 0;
    }
    
    // Update zone time if active
    if (inZone) {
        zoneTimeLeft -= deltaTime;
        if (zoneTimeLeft <= 0) {
            endZone();
        }
    }
    
    // Update UI elements
    const scoreElement = document.getElementById('score');
    const linesElement = document.getElementById('lines');
    const levelElement = document.getElementById('level');
    const comboElement = document.getElementById('combo');
    
    if (scoreElement) scoreElement.textContent = score;
    if (linesElement) linesElement.textContent = lines;
    if (levelElement) levelElement.textContent = level;
    if (comboElement) comboElement.textContent = comboCount;
    
    draw();
    requestAnimationFrame(update);
}

// Ensure DOM is loaded before accessing elements
document.addEventListener('DOMContentLoaded', () => {
    // Initial setup
    resizeCanvas();
    
    // Show start menu if it exists
    const startMenu = document.getElementById('start-menu');
    if (startMenu) {
        startMenu.style.display = 'flex';
    }
    
    // Start animation loop
    update();
    
    // Poll gamepad every frame
    setInterval(pollGamepad, 16);
}); 

function pieceReset() {
    // Get next piece from queue
    if (nextPieces.length === 0) {
        // Initialize queue if empty
        const pieces = 'ILJOTSZ';
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        const matrix = createPiece(type);
        nextPieces.push({
            matrix: matrix.map(row => [...row]), // Create deep copy
            type: type
        });
    }

    // Create deep copy of the next piece
    const nextPiece = nextPieces[0];
    piece = {
        pos: {x: Math.floor(arena[0].length / 2) - 1, y: 0},
        matrix: nextPiece.matrix.map(row => [...row]), // Create deep copy
        type: nextPiece.type
    };
    nextPieces.shift();
    
    // Add new piece to queue if needed
    while (nextPieces.length < PREVIEW_COUNT) {
        const pieces = 'ILJOTSZ';
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        const matrix = createPiece(type);
        nextPieces.push({
            matrix: matrix.map(row => [...row]), // Create deep copy
            type: type
        });
    }
    
    // Reset hold ability
    hasHeld = false;
    
    // Check for game over
    if (collide(arena, piece)) {
        gameOver();
    }
}

function gameOver() {
    // Update high scores
    if (score > 0) {
        highScores.push({
            score,
            lines,
            level,
            date: new Date().toISOString()
        });
        highScores.sort((a, b) => b.score - a.score);
        highScores = highScores.slice(0, 5); // Keep top 5
        localStorage.setItem('tetrisHighScores', JSON.stringify(highScores));
    }
    
    // Show game over screen
    const gameOverScreen = document.getElementById('game-over');
    const finalScore = document.getElementById('final-score');
    const finalLines = document.getElementById('final-lines');
    const finalLevel = document.getElementById('final-level');
    const finalTime = document.getElementById('final-time');
    
    if (gameOverScreen) gameOverScreen.style.display = 'flex';
    if (finalScore) finalScore.textContent = score;
    if (finalLines) finalLines.textContent = lines;
    if (finalLevel) finalLevel.textContent = level;
    if (finalTime) finalTime.textContent = new Date(gameTime).toISOString().substr(14, 5);
    
    // Stop the game
    gameStarted = false;
    
    // Create game over particles
    for (let i = 0; i < 100; i++) {
        particles.push(createParticle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            'gameOver'
        ));
    }
}

function collide(arena, piece) {
    const [matrix, pos] = [piece.matrix, piece.pos];
    
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < matrix[y].length; ++x) {
            if (matrix[y][x] !== 0 &&
                (arena[y + pos.y] &&
                arena[y + pos.y][x + pos.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
} 

function draw() {
    const theme = getCurrentTheme();
    
    // Create gradient background with theme colors
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, theme.background[0]);
    gradient.addColorStop(1, theme.background[1]);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawParticles();
    
    // Draw game board outline
    const boardWidth = arena[0].length * grid;
    const boardHeight = arena.length * grid;
    const boardX = (canvas.width - boardWidth) / 2;
    const boardY = (canvas.height - boardHeight) / 2;
    
    // Draw semi-transparent background for game board
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(boardX - 2, boardY - 2, boardWidth + 4, boardHeight + 4);
    
    // Draw board border
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    context.strokeRect(boardX - 2, boardY - 2, boardWidth + 4, boardHeight + 4);
    
    // Draw grid pattern with theme color
    context.strokeStyle = theme.gridLines;
    context.lineWidth = 1;
    
    // Draw vertical grid lines
    for (let x = 0; x <= boardWidth; x += grid) {
        context.beginPath();
        context.moveTo(boardX + x, boardY);
        context.lineTo(boardX + x, boardY + boardHeight);
        context.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y <= boardHeight; y += grid) {
        context.beginPath();
        context.moveTo(boardX, boardY + y);
        context.lineTo(boardX + boardWidth, boardY + y);
        context.stroke();
    }
    
    // Save context state
    context.save();
    // Translate to board position
    context.translate(boardX, boardY);
    
    // Draw game elements
    drawMatrix(arena, {x: 0, y: 0});
    drawGhost();
    drawMatrix(piece.matrix, piece.pos);
    
    // Restore context
    context.restore();
    
    drawNextPieces();
    drawHeldPiece();
}

function drawMatrix(matrix, offset) {
    if (!matrix) return;
    
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const pieceType = Object.keys(tetrominoes).find(key => 
                    JSON.stringify(tetrominoes[key]) === JSON.stringify(matrix)) || 'I';
                
                // During Zone, draw pieces as outlines if they're part of a complete line
                if (inZone) {
                    const isCompleteLine = arena[y + offset.y].every(cell => cell !== 0);
                    if (isCompleteLine) {
                        context.strokeStyle = colors[pieceType];
                        context.lineWidth = 2;
                        context.shadowBlur = 15;
                        context.shadowColor = colors[pieceType];
                        
                        const xPos = (x + offset.x) * grid;
                        const yPos = (y + offset.y) * grid;
                        const size = grid - 1;
                        
                        context.beginPath();
                        context.roundRect(xPos, yPos, size, size, 5);
                        context.stroke();
                        context.shadowBlur = 0;
                        return;
                    }
                }
                
                context.shadowBlur = 15;
                context.shadowColor = colors[pieceType];
                context.fillStyle = colors[pieceType];
                
                const xPos = (x + offset.x) * grid;
                const yPos = (y + offset.y) * grid;
                const size = grid - 1;
                
                context.beginPath();
                context.roundRect(xPos, yPos, size, size, 5);
                context.fill();
                context.shadowBlur = 0;
            }
        });
    });
}

function drawGhost() {
    if (!piece) return;
    
    // Create a ghost piece
    const ghostPiece = {
        pos: { x: piece.pos.x, y: piece.pos.y },
        matrix: piece.matrix
    };

    // Move ghost piece to bottom
    while (!collide(arena, ghostPiece)) {
        ghostPiece.pos.y++;
    }
    ghostPiece.pos.y--;

    ghostPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const pieceType = piece.type || 'I';
                
                context.fillStyle = `${colors[pieceType]}33`; // 33 is hex for 20% opacity
                const xPos = (x + ghostPiece.pos.x) * grid;
                const yPos = (y + ghostPiece.pos.y) * grid;
                const size = grid - 1;
                
                context.beginPath();
                context.roundRect(xPos, yPos, size, size, 5);
                context.fill();
            }
        });
    });
}

function drawNextPieces() {
    if (!nextPieces.length) return;

    const boardWidth = arena[0].length * grid;
    const boardX = (canvas.width - boardWidth) / 2;
    const boardY = (canvas.height - arena.length * grid) / 2;

    // Draw "NEXT" text at the top
    context.save();
    context.translate(boardX + boardWidth + 20, boardY + 20);
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    context.font = '16px Arial';
    context.textAlign = 'left';
    context.fillText('NEXT', 0, 0);
    context.restore();

    // Draw each piece in the preview
    nextPieces.forEach((piece, index) => {
        context.save();
        context.translate(boardX + boardWidth + 20, boardY + 80 + (index * 100));
        context.scale(0.8, 0.8);

        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = colors[piece.type];
                    context.shadowBlur = 15;
                    context.shadowColor = colors[piece.type];
                    context.beginPath();
                    context.roundRect(x * grid, y * grid, grid - 1, grid - 1, 5);
                    context.fill();
                    context.shadowBlur = 0;
                }
            });
        });
        context.restore();
    });
}

function drawHeldPiece() {
    if (!heldPiece) return;

    const boardWidth = arena[0].length * grid;
    const boardX = (canvas.width - boardWidth) / 2;
    const boardY = (canvas.height - arena.length * grid) / 2;

    // Calculate piece dimensions
    const pieceWidth = heldPiece[0].length * grid;
    const pieceHeight = heldPiece.length * grid;

    // Draw held piece centered above HOLD text
    context.save();
    context.translate(
        boardX - boardWidth/2 - 60,  // Move further left of the board
        boardY + 60  // Move down from top
    );
    context.scale(0.8, 0.8);

    // Center the piece
    const xOffset = (120 - pieceWidth) / 2;  // 120 is hold box width
    const yOffset = (120 - pieceHeight) / 2;  // Center in hold box

    heldPiece.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const pieceType = Object.keys(tetrominoes).find(key => 
                    tetrominoes[key] === heldPiece) || 'I';
                
                context.fillStyle = colors[pieceType];
                context.shadowBlur = 15;
                context.shadowColor = colors[pieceType];
                context.beginPath();
                context.roundRect(
                    x * grid + xOffset,
                    y * grid + yOffset,
                    grid - 1,
                    grid - 1,
                    5
                );
                context.fill();
                context.shadowBlur = 0;
            }
        });
    });
    context.restore();
}

function drawParticles() {
    // Add ambient particles
    if (Math.random() < 0.1) {
        particles.push(createParticle(
            Math.random() * canvas.width,
            canvas.height,
            'ambient'
        ));
    }
    
    // Update and draw all particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= p.type === 'ambient' ? 0.01 : 0.02;
        
        context.save();
        if (p.glow) {
            context.shadowBlur = 10;
            context.shadowColor = p.color;
        }
        context.fillStyle = `${p.color}${Math.floor(p.life * 255).toString(16).padStart(2, '0')}`;
        context.beginPath();
        context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context.fill();
        context.restore();
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
} 

function playerMove(dir) {
    piece.pos.x += dir;
    if (collide(arena, piece)) {
        piece.pos.x -= dir;
        return false;
    }
    return true;
}

function playerDrop() {
    piece.pos.y++;
    if (collide(arena, piece)) {
        piece.pos.y--;
        merge(arena, piece);
        pieceReset();
        arenaSweep();
        updateScore();
        return false;
    }
    dropScore += 1;
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
}

function rotate(matrix, dir) {
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
    
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function merge(arena, piece) {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + piece.pos.y][x + piece.pos.x] = value;
            }
        });
    });
}

function arenaSweep() {
    let rowCount = 0;
    let combo = 0;
    
    if (inZone) {
        // During Zone, just identify complete lines but don't clear them
        // We scan from top to bottom to maintain correct indices
        for (let y = 0; y < arena.length; y++) {
            let complete = true;
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    complete = false;
                    break;
                }
            }
            if (complete && !zoneLines.includes(y)) {
                zoneLines.push(y);
                rowCount++;
                
                // Add outline effect particles
                for (let x = 0; x < arena[0].length; x++) {
                    particles.push(createParticle(
                        (x * grid) + (canvas.width - arena[0].length * grid) / 2,
                        (y * grid) + (canvas.height - arena.length * grid) / 2,
                        'zone'
                    ));
                }
            }
        }
    } else {
        // Normal line clearing (scan from bottom to top)
        outer: for (let y = arena.length - 1; y > 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    continue outer;
                }
            }
            
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            ++y;
            
            rowCount++;
            combo++;
            
            // Create line clear particles
            for (let x = 0; x < arena[0].length; x++) {
                particles.push(createParticle(
                    (x * grid) + (canvas.width - arena[0].length * grid) / 2,
                    (y * grid) + (canvas.height - arena.length * grid) / 2,
                    'clear'
                ));
            }
        }
    }
    
    // Update combo
    if (combo > 0) {
        comboCount++;
        lastClearTime = Date.now();
        
        // Add zone energy based on combo and lines cleared
        if (!inZone) {
            const energyGain = (rowCount * 20) * (1 + (comboCount * 0.1)); // Base energy + combo bonus
            zoneEnergy = Math.min(MAX_ZONE_ENERGY, zoneEnergy + energyGain);
        }
        
        // Add combo particles
        for (let i = 0; i < combo * 5; i++) {
            particles.push(createParticle(
                piece.pos.x * grid + (canvas.width - arena[0].length * grid) / 2,
                piece.pos.y * grid + (canvas.height - arena.length * grid) / 2,
                'combo'
            ));
        }
    } else if (Date.now() - lastClearTime > COMBO_WINDOW) {
        comboCount = 0;
    }
    
    // Calculate score
    if (rowCount > 0) {
        if (!inZone) {
            score += Math.pow(2, rowCount - 1) * 100;
            lines += rowCount;
            
            // Level up every 10 lines
            if (Math.floor(lines / 10) > level - 1) {
                level = Math.floor(lines / 10) + 1;
                dropInterval = Math.max(50, 1000 - (level * 50)); // Speed up drop rate
            }
        }
    }
}

function playerHardDrop() {
    while (playerDrop()) {
        dropScore += 2;
    }
}

function restartGame() {
    // Hide game over screen
    const gameOverScreen = document.getElementById('game-over');
    if (gameOverScreen) {
        gameOverScreen.style.display = 'none';
    }
    
    // Show start menu
    const startMenu = document.getElementById('start-menu');
    if (startMenu) {
        startMenu.style.display = 'flex';
    }
    
    // Reset game state
    gameStarted = false;
    piece = null;
    particles = [];
} 

function showControls() {
    // Hide start menu
    const startMenu = document.getElementById('start-menu');
    if (startMenu) {
        startMenu.style.display = 'none';
    }
    
    // Show settings panel
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) {
        settingsPanel.style.display = 'flex';
    }
} 

function createParticle(x, y, type = 'ambient') {
    const theme = getCurrentTheme();
    const baseParticle = {
        x,
        y,
        life: 1,
        type
    };

    switch(type) {
        case 'lineClear':
            return {
                ...baseParticle,
                size: Math.random() * 4 + 2,
                speedY: -Math.random() * 3 - 2,
                speedX: (Math.random() - 0.5) * 6,
                color: theme.particles,
                glow: true
            };
        case 'piecePlace':
            return {
                ...baseParticle,
                size: Math.random() * 2 + 1,
                speedY: -Math.random() * 2,
                speedX: (Math.random() - 0.5) * 4,
                color: colors[piece.type],
                glow: true
            };
        case 'combo':
            return {
                ...baseParticle,
                size: Math.random() * 6 + 3,
                speedY: (Math.random() - 0.5) * 8,
                speedX: (Math.random() - 0.5) * 8,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                glow: true,
                life: 2
            };
        case 'zone':
            return {
                ...baseParticle,
                size: Math.random() * 8 + 4,
                speedY: (Math.random() - 0.5) * 10,
                speedX: (Math.random() - 0.5) * 10,
                color: `hsl(${Math.random() * 60 + 180}, 100%, 50%)`,
                glow: true,
                life: 2
            };
        case 'gameOver':
            return {
                ...baseParticle,
                size: Math.random() * 6 + 3,
                speedY: (Math.random() - 0.5) * 8,
                speedX: (Math.random() - 0.5) * 8,
                color: '#ff0000',
                glow: true,
                life: 2
            };
        default: // ambient particles
            return {
                ...baseParticle,
                size: Math.random() * 2,
                speedY: -Math.random() * 1,
                speedX: (Math.random() - 0.5) * 1,
                color: theme.particles,
                glow: false
            };
    }
} 

// Add this function to handle Zone end
function endZone() {
    if (!inZone) return;
    
    inZone = false;
    dropInterval = normalDropInterval;
    
    // Sort lines in descending order to clear from bottom to top
    zoneLines.sort((a, b) => b - a);
    
    // Clear all stored lines at once
    let clearedCount = 0;
    let offset = 0; // Track how many lines we've cleared to adjust indices
    
    zoneLines.forEach(y => {
        // Adjust the line index based on how many lines we've already cleared
        const adjustedY = y - offset;
        if (adjustedY >= 0) { // Make sure we don't go out of bounds
            const row = arena.splice(adjustedY, 1)[0].fill(0);
            arena.unshift(row);
            clearedCount++;
            offset++;
            
            // Create line clear particles
            for (let x = 0; x < arena[0].length; x++) {
                particles.push(createParticle(
                    (x * grid) + (canvas.width - arena[0].length * grid) / 2,
                    (adjustedY * grid) + (canvas.height - arena.length * grid) / 2,
                    'clear'
                ));
            }
        }
    });
    
    // Calculate bonus score for Zone clear
    if (clearedCount > 0) {
        // Bonus multiplier increases exponentially with number of lines
        const bonus = Math.pow(2, clearedCount) * 100 * level; // Add level multiplier
        score += bonus;
        lines += clearedCount;
        
        // Create bonus particles
        for (let i = 0; i < clearedCount * 10; i++) {
            particles.push(createParticle(
                canvas.width / 2 + (Math.random() - 0.5) * 200,
                canvas.height / 2 + (Math.random() - 0.5) * 200,
                'zone'
            ));
        }
        
        // Level up check
        if (Math.floor(lines / 10) > level - 1) {
            level = Math.floor(lines / 10) + 1;
            dropInterval = Math.max(50, 1000 - (level * 50));
        }
    }
    
    // Reset zone energy and lines
    zoneEnergy = 0;
    zoneLines = [];
    
    // Update zone UI
    const zoneIndicator = document.getElementById('zone-indicator');
    if (zoneIndicator) {
        zoneIndicator.classList.remove('active');
    }
    
    // Update zone meter UI
    const zoneMeter = document.getElementById('zone-meter');
    if (zoneMeter) {
        zoneMeter.style.width = '0%';
    }
} 