// Grid and canvas configuration
const GRID = 28; // Slightly smaller grid cells for better proportions

// Add new display constants
const DISPLAY = {
    BLOCK_SIZE: 28,
    PREVIEW_BLOCK_SIZE: 20,  // Smaller blocks for preview
    HOLD_BLOCK_SIZE: 20,     // Smaller blocks for hold
    GRID_LINE_WIDTH: 1,
    GRID_COLOR: 'rgba(255, 255, 255, 0.1)',  // Subtle grid lines
    GHOST_ALPHA: 0.4  // Increased from 0.3 for better visibility
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

// Movement and timing constants
export const MOVE_SPEED = 100;      // Time between moves when holding a direction
export const INITIAL_DELAY = 300;   // Initial delay before moving when holding a direction
export const SOFT_DROP_SPEED = 50;  // Speed of soft drop
export const COMBO_WINDOW = 3000;   // Time window for combos in milliseconds
export const LOCK_DELAY = 500;      // 500ms to move piece after landing
export const MAX_LOCK_RESETS = 15;  // Maximum number of moves/rotates before forcing lock

// Board dimensions
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Queue size
const QUEUE_SIZE = 4;

// Gamepad configuration
export const GAMEPAD_CONFIG = {
    movementSensitivity: 1,
    actionSensitivity: 1,
    baseDelay: 150,
    lastMove: {},
    buttonStates: {},  // Track button states for debouncing
    repeatDelay: 100   // Time between repeated moves when holding
};

// Feature toggles default state
export const DEFAULT_FEATURES = {
    scoreDisplay: true,
    levelDisplay: true,
    linesDisplay: true,
    holdPiece: true,
    previewPieces: true
};

// Define TETROMINOES (but don't export it here)
const TETROMINOES = {
    'I': [[0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0]],
    'O': [[1, 1],
          [1, 1]],
    'T': [[0, 1, 0],
          [1, 1, 1],
          [0, 0, 0]],
    'S': [[0, 1, 1],
          [1, 1, 0],
          [0, 0, 0]],
    'Z': [[1, 1, 0],
          [0, 1, 1],
          [0, 0, 0]],
    'J': [[1, 0, 0],
          [1, 1, 1],
          [0, 0, 0]],
    'L': [[0, 0, 1],
          [1, 1, 1],
          [0, 0, 0]]
};

// Single export block for all constants
export {
    GRID,
    SPEED,
    BOARD_WIDTH,
    BOARD_HEIGHT,
    QUEUE_SIZE,
    TETROMINOES,
    DISPLAY
};
