// =============================================================================
// TETRIS EFFECT CLONE - PIECE SYSTEM
// SRS (Super Rotation System) implementation with wall kicks
// =============================================================================

import { TetrominoType, Tetromino, Position, RotationState, BOARD_WIDTH, ALL_PIECES } from './types';

// -----------------------------------------------------------------------------
// Piece Shapes
// Each shape is a 2D array where 1 = filled, 0 = empty
// Shapes are defined in spawn orientation (rotation state 0)
// -----------------------------------------------------------------------------

export const SHAPES: Record<TetrominoType, number[][]> = {
  [TetrominoType.I]: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [TetrominoType.O]: [
    [1, 1],
    [1, 1],
  ],
  [TetrominoType.T]: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.S]: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  [TetrominoType.Z]: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.J]: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.L]: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// Piece colors (can be customized per theme later)
export const PIECE_COLORS: Record<TetrominoType, string> = {
  [TetrominoType.I]: '#00f0f0', // Cyan
  [TetrominoType.O]: '#f0f000', // Yellow
  [TetrominoType.T]: '#a000f0', // Purple
  [TetrominoType.S]: '#00f000', // Green
  [TetrominoType.Z]: '#f00000', // Red
  [TetrominoType.J]: '#4080ff', // Blue (brighter for visibility)
  [TetrominoType.L]: '#f0a000', // Orange
};

// Spawn positions (center the piece horizontally)
export function getSpawnPosition(type: TetrominoType): Position {
  const shape = SHAPES[type];
  const firstRow = shape[0];
  const width = firstRow ? firstRow.length : 4;
  return {
    x: Math.floor((BOARD_WIDTH - width) / 2),
    y: 18, // Spawn in buffer zone (row 18-19 are visible spawn rows)
  };
}

// -----------------------------------------------------------------------------
// Rotation
// -----------------------------------------------------------------------------

/**
 * Get the shape of a piece at a given rotation state
 */
export function getRotatedShape(type: TetrominoType, rotation: RotationState): number[][] {
  let shape = SHAPES[type].map(row => [...row]);
  
  // O piece doesn't rotate
  if (type === TetrominoType.O) {
    return shape;
  }
  
  // Apply rotation
  for (let i = 0; i < rotation; i++) {
    shape = rotateMatrixCW(shape);
  }
  
  return shape;
}

/**
 * Rotate a matrix 90 degrees clockwise
 */
function rotateMatrixCW(matrix: number[][]): number[][] {
  const n = matrix.length;
  const result: number[][] = [];
  
  for (let i = 0; i < n; i++) {
    const newRow: number[] = [];
    for (let j = 0; j < n; j++) {
      const sourceRow = matrix[n - 1 - j];
      newRow.push(sourceRow ? sourceRow[i] ?? 0 : 0);
    }
    result.push(newRow);
  }
  
  return result;
}

/**
 * Get the cells occupied by a piece at its current position and rotation
 */
export function getPieceCells(piece: Tetromino): Position[] {
  const shape = getRotatedShape(piece.type, piece.rotation);
  const cells: Position[] = [];
  
  for (let y = 0; y < shape.length; y++) {
    const row = shape[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      if (row[x]) {
        cells.push({
          x: piece.position.x + x,
          y: piece.position.y + y,
        });
      }
    }
  }
  
  return cells;
}

// -----------------------------------------------------------------------------
// SRS Wall Kick Data
// Standard Rotation System wall kick offsets
// Format: [test1, test2, test3, test4] where each test is {x, y}
// Only valid rotation transitions (CW and CCW)
// -----------------------------------------------------------------------------

type ValidWallKickKey = '0->1' | '1->0' | '1->2' | '2->1' | '2->3' | '3->2' | '3->0' | '0->3';

// Standard wall kicks for J, L, S, T, Z pieces
const WALL_KICKS_JLSTZ: Record<ValidWallKickKey, Position[]> = {
  '0->1': [{ x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '1->0': [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '1->2': [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '2->1': [{ x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '2->3': [{ x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  '3->2': [{ x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '3->0': [{ x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '0->3': [{ x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
};

// I-piece has different wall kicks
const WALL_KICKS_I: Record<ValidWallKickKey, Position[]> = {
  '0->1': [{ x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  '1->0': [{ x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  '1->2': [{ x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
  '2->1': [{ x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  '2->3': [{ x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: -1 }, { x: -1, y: 2 }],
  '3->2': [{ x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: 1 }, { x: 1, y: -2 }],
  '3->0': [{ x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: 2 }, { x: -2, y: -1 }],
  '0->3': [{ x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: -2 }, { x: 2, y: 1 }],
};

/**
 * Get wall kick tests for a rotation
 */
export function getWallKicks(
  type: TetrominoType,
  fromRotation: RotationState,
  toRotation: RotationState
): Position[] {
  // O piece doesn't need wall kicks
  if (type === TetrominoType.O) {
    return [];
  }
  
  const key = `${fromRotation}->${toRotation}` as ValidWallKickKey;
  
  // Check if this is a valid transition
  if (!(key in WALL_KICKS_JLSTZ)) {
    return [];
  }
  
  if (type === TetrominoType.I) {
    return WALL_KICKS_I[key] || [];
  }
  
  return WALL_KICKS_JLSTZ[key] || [];
}

/**
 * Calculate the new rotation state after a rotation
 */
export function getNextRotation(current: RotationState, clockwise: boolean): RotationState {
  if (clockwise) {
    return ((current + 1) % 4) as RotationState;
  } else {
    return ((current + 3) % 4) as RotationState;
  }
}

/**
 * Calculate rotation state after 180 degree rotation
 */
export function get180Rotation(current: RotationState): RotationState {
  return ((current + 2) % 4) as RotationState;
}

// -----------------------------------------------------------------------------
// Piece Factory
// -----------------------------------------------------------------------------

/**
 * Create a new tetromino at spawn position
 */
export function createPiece(type: TetrominoType): Tetromino {
  return {
    type,
    position: getSpawnPosition(type),
    rotation: 0,
  };
}

/**
 * Clone a piece with optional modifications
 */
export function clonePiece(piece: Tetromino, modifications?: Partial<Tetromino>): Tetromino {
  return {
    ...piece,
    position: { ...piece.position },
    ...modifications,
  };
}

// -----------------------------------------------------------------------------
// 7-Bag Randomizer
// Generates pieces in bags of 7, one of each type per bag
// -----------------------------------------------------------------------------

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j] as T;
    result[j] = temp as T;
  }
  return result;
}

/**
 * Create a bag generator that yields pieces in 7-bag randomizer pattern
 */
export function createBagGenerator(): () => TetrominoType {
  let bag: TetrominoType[] = [];
  
  return () => {
    if (bag.length === 0) {
      bag = shuffle([...ALL_PIECES]);
    }
    return bag.pop()!;
  };
}

/**
 * Generate initial next pieces queue
 */
export function generateInitialQueue(count: number = 5): TetrominoType[] {
  const getNext = createBagGenerator();
  const queue: TetrominoType[] = [];
  
  for (let i = 0; i < count; i++) {
    queue.push(getNext());
  }
  
  return queue;
}
