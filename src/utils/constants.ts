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

// Speed in milliseconds between drops (1000ms = 1 second)
export const LEVEL_SPEEDS = {
  0: 800,    // 1.25 tiles/sec
  1: 717,    // 1.4 tiles/sec
  2: 633,    // 1.6 tiles/sec
  3: 550,    // 1.8 tiles/sec
  4: 467,    // 2.1 tiles/sec
  5: 383,    // 2.6 tiles/sec
  6: 300,    // 3.3 tiles/sec
  7: 217,    // 4.6 tiles/sec
  8: 133,    // 7.5 tiles/sec
  9: 100,    // 10 tiles/sec
  10: 83,    // 12 tiles/sec
  11: 83,    // 12 tiles/sec
  12: 83,    // 12 tiles/sec
  13: 67,    // 15 tiles/sec
  14: 67,    // 15 tiles/sec
  15: 67,    // 15 tiles/sec
  16: 50,    // 20 tiles/sec
  17: 50,    // 20 tiles/sec
  18: 50,    // 20 tiles/sec
  19: 33,    // 30 tiles/sec
  29: 17,    // 60 tiles/sec
} as const;

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