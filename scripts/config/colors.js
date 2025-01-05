// Piece definitions (fixed comment)
export const TETROMINOES = {
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

// Base colors for pieces
const BASE_COLORS = {
    'I': '#60D8EF',  // Cyan
    'O': '#F7D794',  // Yellow
    'T': '#C197D2',  // Purple
    'S': '#7BED9F',  // Green
    'Z': '#FF7675',  // Red
    'J': '#74B9FF',  // Blue
    'L': '#FFA45C'   // Orange
};

// Export color configurations
export const COLORS = {
    'I': BASE_COLORS.I,
    'O': BASE_COLORS.O,
    'T': BASE_COLORS.T,
    'S': BASE_COLORS.S,
    'Z': BASE_COLORS.Z,
    'J': BASE_COLORS.J,
    'L': BASE_COLORS.L
};

// Add shading configurations
export const BLOCK_STYLE = {
    border: '#000000',
    borderWidth: 2,
    highlight: 'rgba(255, 255, 255, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    ghostAlpha: 0.4,
    ghostBorder: 'rgba(255, 255, 255, 0.5)'
};
