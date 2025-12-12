// =============================================================================
// BLOCKS - TYPE DEFINITIONS
// =============================================================================

// -----------------------------------------------------------------------------
// Piece Types
// -----------------------------------------------------------------------------

export enum PieceType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L',
}

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  type: PieceType;
  position: Position;
  rotation: RotationState;
}

export type RotationState = 0 | 1 | 2 | 3; // 0=spawn, 1=CW, 2=180, 3=CCW

// -----------------------------------------------------------------------------
// Board Types
// -----------------------------------------------------------------------------

export type Cell = PieceType | null;
export type Board = Cell[][];

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 40; // 20 visible + 20 hidden buffer for spawning
export const VISIBLE_HEIGHT = 20;

// -----------------------------------------------------------------------------
// Game State Types
// -----------------------------------------------------------------------------

export type GamePhase = 
  | 'idle'       // Not started
  | 'playing'    // Active gameplay
  | 'paused'     // Paused
  | 'zoneActive' // Zone mechanic active
  | 'gameOver';  // Game ended

export interface LockState {
  isLocking: boolean;
  lockTimer: number;       // Time remaining before lock (ms)
  moveResets: number;      // Number of move/rotate resets used
  lowestY: number;         // Lowest Y position reached (for reset threshold)
}

export interface ComboState {
  count: number;           // Current combo count
  backToBack: boolean;     // Is this a back-to-back difficult clear?
  lastClearType: ClearType | null;
}

export type ClearType = 
  | 'single'
  | 'double'
  | 'triple'
  | 'quad'
  | 'tSpinMini'
  | 'tSpinMiniSingle'
  | 'tSpinMiniDouble'
  | 'tSpin'
  | 'tSpinSingle'
  | 'tSpinDouble'
  | 'tSpinTriple'
  | 'allClear';  // Perfect clear

export type ZoneMode = 'inactive' | 'charging' | 'active';

export interface ZoneState {
  mode: ZoneMode;
  meter: number;              // 0.0–1.0 (0–100%)
  timeRemaining: number;      // Time left in Zone (ms)
  maxTime: number;            // Set on activation based on meter
  
  // Zone clear tracking
  linesCleared: number;       // Lines cleared during this Zone
  scoreBuffer: number;        // Base points earned, multiplied at end
  
  // Multiplier bonuses
  wasFullMeter: boolean;      // +1x if started from full meter
  
  // For meter filling
  linesSinceLastQuarter: number;  // Track lines for quarter-based meter fill
}

export interface GameState {
  phase: GamePhase;
  board: Board;
  currentPiece: Piece | null;
  ghostY: number;          // Y position of ghost piece
  holdPiece: PieceType | null;
  canHold: boolean;
  nextPieces: PieceType[];
  
  // Scoring
  score: number;
  level: number;
  linesCleared: number;
  
  // Mechanics
  lock: LockState;
  combo: ComboState;
  zone: ZoneState;
  
  // Last clear info (for display)
  lastClear: {
    type: ClearType;
    lines: number;
    score: number;
    timestamp: number;
  } | null;
  
  // Journey mode
  stage: StageInfo | null;
}

// -----------------------------------------------------------------------------
// Input Types
// -----------------------------------------------------------------------------

export type InputAction =
  | 'moveLeft'
  | 'moveRight'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCW'
  | 'rotateCCW'
  | 'rotate180'
  | 'hold'
  | 'zone'
  | 'pause';

export interface InputState {
  // For DAS/ARR
  leftPressed: boolean;
  rightPressed: boolean;
  downPressed: boolean;
  leftHoldTime: number;
  rightHoldTime: number;
  downHoldTime: number;
}

export interface InputConfig {
  das: number;  // Delayed Auto Shift (ms) - time before auto-repeat starts
  arr: number;  // Auto Repeat Rate (ms) - time between auto-repeat moves
  sdf: number;  // Soft Drop Factor - multiplier for soft drop speed
}

// -----------------------------------------------------------------------------
// Level / Journey Types
// -----------------------------------------------------------------------------

export interface StageInfo {
  id: string;
  name: string;
  theme: string;
  clearGoal: number;       // Lines to clear to complete stage
  speedCurve: SpeedCurve;
  musicTrack?: string;     // For future audio
}

export interface SpeedCurve {
  startLevel: number;
  gravity: number[];       // Cells per frame at each level (index 0 = level 1)
  lockDelay: number;       // Lock delay in ms
}

export interface JourneyProgress {
  completedStages: string[];
  currentStage: string | null;
  highScores: Record<string, number>;
}

// -----------------------------------------------------------------------------
// Event Types (for engine -> UI communication)
// -----------------------------------------------------------------------------

export type GameEvent =
  | { type: 'pieceSpawned'; piece: Piece }
  | { type: 'pieceMoved'; piece: Piece }
  | { type: 'pieceRotated'; piece: Piece; wallKick: boolean }
  | { type: 'pieceLocked'; piece: Piece }
  | { type: 'linesCleared'; lines: number[]; clearType: ClearType; score: number }
  | { type: 'hold'; piece: PieceType }
  | { type: 'levelUp'; level: number }
  | { type: 'zoneActivated' }
  | { type: 'zoneEnded'; linesCleared: number; score: number }
  | { type: 'gameOver'; finalScore: number }
  | { type: 'comboIncreased'; count: number }
  | { type: 'backToBack'; clearType: ClearType };

export type GameEventListener = (event: GameEvent) => void;

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const DEFAULT_INPUT_CONFIG: InputConfig = {
  das: 167,   // Standard DAS
  arr: 33,    // Standard ARR
  sdf: 20,    // 20x faster soft drop
};

export const LOCK_DELAY_DEFAULT = 500;  // 500ms lock delay
export const MAX_LOCK_RESETS = 15;      // Guideline standard

// Zone constants
export const ZONE_MAX_METER = 1.0;              // Meter is now 0.0-1.0
export const ZONE_SECONDS_PER_QUARTER = 5;      // 5 seconds per 25% meter (full = 20s)
export const ZONE_LINES_PER_QUARTER = 8;        // 8 lines to fill 25% of meter
export const ZONE_PER_LINE_BONUS = 100;         // +100 points per line at Zone end
export const ZONE_MAX_MULTIPLIER = 3;           // Cap multiplier at 3x

// Piece bag for 7-bag randomizer
export const ALL_PIECES: PieceType[] = [
  PieceType.I,
  PieceType.O,
  PieceType.T,
  PieceType.S,
  PieceType.Z,
  PieceType.J,
  PieceType.L,
];

// Legacy alias for backwards compatibility during transition
export type TetrominoType = PieceType;
export const TetrominoType = PieceType;
export type Tetromino = Piece;
