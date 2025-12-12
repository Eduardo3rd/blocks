export enum TetrominoType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L'
}

export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  shape: number[][];  // Should this be boolean[][] instead?
  position: Position;
  type: TetrominoType;
  rotationState: number; // 0: spawn, 1: right, 2: 180, 3: left
  color: string;
}

export interface GameState {
  board: TetrominoType[][];
  currentPiece: Tetromino;
  nextPieces: Tetromino[];
  holdPiece: Tetromino | null;
  score: number;
  level: number;
  linesCleared: number;
  isGameOver: boolean;
  isPaused: boolean;
  canHold: boolean;
  lastMoveWasRotation: boolean; // Track if last move was a rotation
  lastTSpin: 'none' | 'mini' | 'full'; // Track T-spin type
  combo: number;         // Current combo count
  lastClearWasCombo: boolean;  // Track if the last piece cleared any lines
  backToBack: boolean;  // Track back-to-back difficult clears (Tetris or T-Spin)
  lockDelay: number;        // Time left before piece locks (in ms)
  maxLockResets: number;    // Number of moves allowed before forced lock
  lastLockResetTime: number; // Last time the lock was reset
}

// Add a helper type for board cells
export type BoardCell = TetrominoType | null;

