import { TetrominoType } from './types';

export const SHAPES = {
  [TetrominoType.I]: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  [TetrominoType.O]: [
    [2, 2],
    [2, 2]
  ],
  [TetrominoType.T]: [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0]
  ],
  [TetrominoType.S]: [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0]
  ],
  [TetrominoType.Z]: [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0]
  ],
  [TetrominoType.J]: [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0]
  ],
  [TetrominoType.L]: [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0]
  ]
};

// Rotation states: 0 = spawn, 1 = right, 2 = 180, 3 = left
export const WALL_KICK_DATA = {
  JLSTZ: [
    // 0->1
    [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 }
    ],
    // 1->2
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 }
    ],
    // 2->3
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 }
    ],
    // 3->0
    [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 }
    ]
  ],
  I: [
    // 0->1
    [
      { x: 0, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 1 },
      { x: 1, y: -2 }
    ],
    // 1->2
    [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: -2 },
      { x: 2, y: 1 }
    ],
    // 2->3
    [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: -1 },
      { x: -1, y: 2 }
    ],
    // 3->0
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 2 },
      { x: -2, y: -1 }
    ]
  ]
};

// O piece doesn't need wall kicks as it doesn't rotate
export const WALL_KICK_DATA_O = [{ x: 0, y: 0 }];

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const CELL_SIZE = 30;

export const LEVEL_SPEEDS = {
  1: 800,
  2: 720,
  3: 630,
  4: 550,
  5: 470,
  6: 380,
  7: 300,
  8: 220,
  9: 130,
  10: 100,
  // Add more levels if needed
};

// Lock delay constants
export const LOCK_DELAY = 500;        // 500ms standard lock delay
export const MAX_LOCK_RESETS = 15;    // Maximum number of lock delay resets
export const LOCK_RESET_THRESHOLD = 0; // Reset lock delay when piece moves up 

export const COLORS: Record<TetrominoType, string> = {
  [TetrominoType.I]: '#00F0F0',
  [TetrominoType.O]: '#F0F000',
  [TetrominoType.T]: '#A000F0',
  [TetrominoType.S]: '#00F000',
  [TetrominoType.Z]: '#F00000',
  [TetrominoType.J]: '#0000F0',
  [TetrominoType.L]: '#F0A000'
}; 