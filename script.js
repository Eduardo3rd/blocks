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
let gameMode = null;
let lockDelay = 0;
let lockMoves = 0;
let isLocking = false;

// Add these to the game state variables at the top
const gamepadState = {
    left: { pressed: false, heldTime: 0, lastMove: 0 },
    right: { pressed: false, heldTime: 0, lastMove: 0 },
    down: { pressed: false, heldTime: 0, lastMove: 0 }
};

// Controller configuration
const controllerConfig = {
    left: 14,        // D-pad left
    right: 15,       // D-pad right
    down: 13,        // D-pad down
    rotate: 3,       // Y/Triangle
    hardDrop: 0,     // A/Cross
    hold: 2,         // X/Square
    zone: 5,         // R1/RB
    pause: 9         // Start/Options
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

// Game state variables (at the top of the file)
const keys = {
    ArrowLeft: { pressed: false, heldTime: 0, lastMove: 0 },
    ArrowRight: { pressed: false, heldTime: 0, lastMove: 0 },
    ArrowDown: { pressed: false, heldTime: 0, lastMove: 0 }
};

let dropCounter = 0;
let lastTime = 0;
let lastMoveSound = 0;  // Add this line
let gameStarted = false;
let isPaused = false;
let hasHeld = false;
let score = 0;
let lines = 0;
let level = 1;
const MOVE_SPEED = 100;       // Classic speed (100ms between moves)
const INITIAL_DELAY = 300;     // Classic initial delay (300ms)
const SOFT_DROP_SPEED = 50;    // Consistent soft drop speed
let dropInterval = 1000;

// Initialize arena
const arena = createMatrix(10, 20);  // Standard Tetris dimensions: 10x20

// Initialize pieces
let piece = null;
let heldPiece = null;

// Initialize particles
let particles = [];

// Sound management system
const AudioSystem = {
    context: new (window.AudioContext || window.webkitAudioContext)(),
    muted: false,
    volume: 0.5,
    
    init() {
        this.context.resume();
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
        // Play a little melody for Tetris
        setTimeout(() => this.playTone(400, 0.1, 'square', 0.3), 0);
        setTimeout(() => this.playTone(600, 0.1, 'square', 0.3), 100);
        setTimeout(() => this.playTone(800, 0.2, 'square', 0.3), 200);
    },
    
    playGameOver() {
        if (this.muted) return;
        // Play a descending melody for game over
        setTimeout(() => this.playTone(400, 0.2, 'square', 0.3), 0);
        setTimeout(() => this.playTone(300, 0.2, 'square', 0.3), 200);
        setTimeout(() => this.playTone(200, 0.3, 'square', 0.3), 400);
    },
    
    playZone() {
        if (this.muted) return;
        // Play an ascending melody for zone activation
        setTimeout(() => this.playTone(400, 0.1, 'sine', 0.3), 0);
        setTimeout(() => this.playTone(600, 0.1, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(800, 0.1, 'sine', 0.3), 200);
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

// Replace SoundManager.play calls with AudioSystem
function playerMove(dir) {
    piece.pos.x += dir;
    if (collide(arena, piece)) {
        piece.pos.x -= dir;
        return false;
    }
    
    // Play sound without affecting movement timing
    requestAnimationFrame(() => {
        currentTime = performance.now();
        if (!lastMoveSound || currentTime - lastMoveSound > 100) {
            AudioSystem.playMove();
            lastMoveSound = currentTime;
        }
    });
    
    return true;
}

// Event Listeners
document.addEventListener('keydown', event => {
    if (!gameStarted) {
        if (event.key === 'Enter') {
            startGame();
        }
        return;
    }
    
    // Add Escape key for pause
    if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') {
        togglePause();
        return;
    }
    
    if (isPaused) return;
    
    if (keys.hasOwnProperty(event.key)) {
        event.preventDefault();
        if (!keys[event.key].pressed) {
            keys[event.key].pressed = true;
            keys[event.key].heldTime = 0;
            keys[event.key].lastMove = performance.now();
            
            // Immediate movement on first press
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
    }
    
    switch (event.key) {
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

document.addEventListener('keyup', event => {
    if (keys.hasOwnProperty(event.key)) {
        keys[event.key].pressed = false;
        keys[event.key].delayTimer = 0;  // Reset the delay timer
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

// Adjust these constants for gamepad
const GAMEPAD_MOVE_SPEED = 100;     // Match keyboard timing
const GAMEPAD_INITIAL_DELAY = 300;  // Match keyboard timing
const GAMEPAD_POLL_RATE = 16;       // Poll every frame (60fps)

// Add this with the other game state variables at the top
let lastGamepadState = {
    buttons: Array(16).fill({ pressed: false }),
    axes: [0, 0, 0, 0]
};

// Update the pollGamepad function
function pollGamepad() {
    if (gamepadIndex === null) return;
    
    const gamepad = navigator.getGamepads()[gamepadIndex];
    if (!gamepad) return;
    
    const now = performance.now();
    
    // Handle directional inputs with same timing as keyboard
    const directions = [
        { name: 'left', button: controllerConfig.left, move: -1 },
        { name: 'right', button: controllerConfig.right, move: 1 },
        { name: 'down', button: controllerConfig.down }
    ];

    directions.forEach(({ name, button, move }) => {
        const isPressed = gamepad.buttons[button].pressed;
        const state = gamepadState[name];
        
        if (isPressed) {
            if (!state.pressed) {
                // Initial press - immediate movement
                state.pressed = true;
                state.heldTime = 0;
                state.lastMove = now;
                
                // Immediate action
                if (name === 'down') {
                    playerDrop();
                } else {
                    playerMove(move);
                }
            } else {
                // Handle held buttons with same timing as keyboard
                state.heldTime += 16.67; // Approximate frame time
                
                if (state.heldTime >= INITIAL_DELAY) {
                    const timeSinceLastMove = now - state.lastMove;
                    if (timeSinceLastMove >= MOVE_SPEED) {
                        if (name === 'down') {
                            playerDrop();
                        } else {
                            playerMove(move);
                        }
                        state.lastMove = now;
                    }
                }
            }
        } else if (state.pressed) {
            state.pressed = false;
            state.heldTime = 0;
        }
    });
    
    // Handle other buttons
    if (gamepad.buttons[controllerConfig.rotate].pressed && 
        !lastGamepadState.buttons[controllerConfig.rotate].pressed) {
        playerRotate(1);
    }
    
    if (gamepad.buttons[controllerConfig.hardDrop].pressed && 
        !lastGamepadState.buttons[controllerConfig.hardDrop].pressed) {
        playerHardDrop();
    }
    
    if (gamepad.buttons[controllerConfig.hold].pressed && 
        !lastGamepadState.buttons[controllerConfig.hold].pressed) {
        holdPiece();
    }
    
    if (gamepad.buttons[controllerConfig.zone].pressed && 
        !lastGamepadState.buttons[controllerConfig.zone].pressed) {
        if (zoneEnergy >= MAX_ZONE_ENERGY) {
            activateZone();
        }
    }
    
    if (gamepad.buttons[controllerConfig.pause].pressed && 
        !lastGamepadState.buttons[controllerConfig.pause].pressed) {
        togglePause();
    }
    
    // Update last gamepad state
    lastGamepadState = {
        buttons: gamepad.buttons.map(b => ({ pressed: b.pressed })),
        axes: [...gamepad.axes]
    };
}

function holdPiece() {
    if (!canHold) return;

    if (heldPiece === null) {
        // First hold - store current piece
        heldPiece = {
            type: piece.type,
            matrix: JSON.parse(JSON.stringify(tetrominoes[piece.type])) // Deep copy the piece matrix
        };
        pieceReset();
    } else {
        // Swap current and held pieces
        const tempType = piece.type;
        piece = {
            type: heldPiece.type,
            matrix: JSON.parse(JSON.stringify(tetrominoes[heldPiece.type])), // Deep copy
            pos: {
                x: Math.floor(arena[0].length / 2) - Math.floor(tetrominoes[heldPiece.type][0].length / 2),
                y: 0
            }
        };
        heldPiece = {
            type: tempType,
            matrix: JSON.parse(JSON.stringify(tetrominoes[tempType])) // Deep copy
        };
    }

    canHold = false;
    AudioSystem.playRotate();
}

function activateZone() {
    if (inZone || zoneEnergy < MAX_ZONE_ENERGY) return;
    
    inZone = true;
    normalDropInterval = dropInterval;
    dropInterval = Math.max(dropInterval / 2, 50);  // Speed up during Zone
    
    // Play zone activation sound
    AudioSystem.playZone();  // Changed from SoundManager.play('zone')
    
    // Reset zone lines array
    zoneLines = [];
    
    // Create zone activation particles
    for (let i = 0; i < 50; i++) {
        particles.push(createParticle(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            'zone'
        ));
    }
    
    // Start zone timer
    setTimeout(endZone, ZONE_TIME);
}

function togglePause() {
    if (!gameStarted) return;
    
    isPaused = !isPaused;
    const pauseMenu = document.getElementById('pause-menu');  // Updated ID
    
    if (pauseMenu) {
        pauseMenu.style.display = isPaused ? 'block' : 'none';
    }
    
    if (!isPaused) {
        lastTime = performance.now();
        update();
    }
}

function updateScore() {
    // Remove UI updates since we removed the elements
    // Just keep score calculation if needed
    if (dropScore > 0) {
        score += dropScore;
        dropScore = 0;
    }
    
    // Remove these lines that try to update UI elements
    // document.getElementById('score').textContent = score;
    // document.getElementById('lines').textContent = lines;
    // document.getElementById('level').textContent = level;
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
    if (!gameStarted || isPaused) return;
    
    const deltaTime = time - lastTime;
    
    // Update drop counter
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
        dropCounter = 0;
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
    // Instead of taking from queue, just generate a new random piece
    const pieces = 'ILJOTSZ';
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    piece = {
        matrix: createPiece(type),
        type: type,
        pos: {
            x: Math.floor(arena[0].length / 2) - Math.floor(tetrominoes[type][0].length / 2),
            y: 0
        }
    };
    
    // Reset hold ability with each new piece
    canHold = true;
    
    // Check for game over
    if (collide(arena, piece)) {
        gameOver();
    }
}

function gameOver() {
    AudioSystem.playGameOver();
    gameStarted = false;
    
    // Show game over screen
    const gameOverScreen = document.getElementById('game-over');
    if (gameOverScreen) {
        gameOverScreen.style.display = 'flex';
    }
}

function restartGame() {
    // Hide game over screen
    const gameOverScreen = document.getElementById('game-over');
    if (gameOverScreen) {
        gameOverScreen.style.display = 'none';
    }
    
    // Reset game state
    gameStarted = false;
    piece = null;
    particles = [];
    
    // Start a new game
    startGame();  // Or whatever mode they were playing
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
    
    drawParticles();
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

function drawHeldPiece() {
    const holdCanvas = document.getElementById('hold-piece');
    if (!holdCanvas || !heldPiece || !heldPiece.matrix) return;

    const holdCtx = holdCanvas.getContext('2d');
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    
    const blockSize = Math.floor(holdCanvas.width / 4);
    const xOffset = Math.floor((holdCanvas.width - (heldPiece.matrix[0].length * blockSize)) / 2);
    const yOffset = Math.floor((holdCanvas.height - (heldPiece.matrix.length * blockSize)) / 2);
    
    // Draw with same glow effect as queue pieces
    heldPiece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const color = colors[heldPiece.type];
                
                // Add glow effect
                holdCtx.shadowBlur = 15;
                holdCtx.shadowColor = color;
                
                // Draw block
                holdCtx.fillStyle = color;
                holdCtx.fillRect(
                    xOffset + x * blockSize,
                    yOffset + y * blockSize,
                    blockSize - 1,
                    blockSize - 1
                );
                
                holdCtx.shadowBlur = 0;
            }
        });
    });
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

function playerDrop() {
    piece.pos.y++;
    if (collide(arena, piece)) {
        piece.pos.y--;
        merge(arena, piece);
        pieceReset();
        arenaSweep();
        updateScore();  // This will now just handle score calculation
        AudioSystem.playDrop();
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
    AudioSystem.playRotate();  // Changed from SoundManager.play('rotate')
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
    
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        
        // Remove the row and add a new one at the top
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
    
    // Update combo
    if (combo > 0) {
        comboCount++;
        lastClearTime = Date.now();
        
        // Add zone energy based on combo and lines cleared
        if (!inZone) {
            const energyGain = (rowCount * 20) * (1 + (comboCount * 0.1));
            zoneEnergy = Math.min(MAX_ZONE_ENERGY, zoneEnergy + energyGain);
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
                dropInterval = Math.max(50, 1000 - (level * 50));
            }
        }
        
        // Play appropriate sound based on number of lines cleared
        if (rowCount >= 4) {
            AudioSystem.playTetris();
        } else {
            AudioSystem.playClear();
        }
    }
}

function playerHardDrop() {
    while (playerDrop()) {
        dropScore += 2;
    }
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
} 

// Add this function at the end of your script
function startGame() {
    // Hide start menu
    document.getElementById('start-menu').style.display = 'none';
    
    // Reset game state
    score = 0;
    lines = 0;
    level = 1;
    dropCounter = 0;
    dropInterval = 1000;
    lastTime = performance.now();
    gameStarted = true;
    isPaused = false;
    
    // Clear arena
    arena.forEach(row => row.fill(0));
    
    // Reset piece
    pieceReset();
    
    // Initialize audio
    AudioSystem.init();
    
    // Start game loop with requestAnimationFrame
    requestAnimationFrame(update);
}

// Show start menu when page loads
window.addEventListener('load', () => {
    document.getElementById('start-menu').style.display = 'block';
}); 

// Add these menu control functions
function showSettings() {
    // Hide other menus
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('pause-menu').style.display = 'none';
    
    // Show settings
    document.getElementById('settings').style.display = 'block';
}

function closeSettings() {
    // Hide settings
    document.getElementById('settings').style.display = 'none';
    
    // If game is paused, show pause menu
    if (isPaused) {
        document.getElementById('pause-menu').style.display = 'block';
    }
    // If game hasn't started, show start menu
    else if (!gameStarted) {
        document.getElementById('start-menu').style.display = 'block';
    }
} 