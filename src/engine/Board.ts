// =============================================================================
// TETRIS EFFECT CLONE - BOARD SYSTEM
// Board operations, collision detection, line clearing, locking
// =============================================================================

import {
  Board,
  Cell,
  Tetromino,
  TetrominoType,
  Position,
  RotationState,
  ClearType,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  VISIBLE_HEIGHT,
} from './types';
import { getPieceCells, getWallKicks, getNextRotation, clonePiece } from './Piece';

// -----------------------------------------------------------------------------
// Board Creation
// -----------------------------------------------------------------------------

/**
 * Create an empty board
 */
export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    board.push(new Array(BOARD_WIDTH).fill(null));
  }
  return board;
}

/**
 * Clone a board (deep copy)
 */
export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

// -----------------------------------------------------------------------------
// Collision Detection
// -----------------------------------------------------------------------------

/**
 * Check if a position is within board bounds
 */
export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}

/**
 * Check if a cell is occupied on the board
 */
export function isCellOccupied(board: Board, x: number, y: number): boolean {
  if (!isInBounds(x, y)) return true; // Out of bounds = collision
  const row = board[y];
  if (!row) return true;
  return row[x] !== null;
}

/**
 * Check if a piece would collide at a given position
 */
export function checkCollision(
  board: Board,
  piece: Tetromino,
  offsetX: number = 0,
  offsetY: number = 0,
  rotation?: RotationState
): boolean {
  const testPiece: Tetromino = {
    ...piece,
    position: {
      x: piece.position.x + offsetX,
      y: piece.position.y + offsetY,
    },
    rotation: rotation ?? piece.rotation,
  };
  
  const cells = getPieceCells(testPiece);
  
  for (const cell of cells) {
    // Check bounds
    if (cell.x < 0 || cell.x >= BOARD_WIDTH) return true;
    if (cell.y < 0 || cell.y >= BOARD_HEIGHT) return true;
    
    // Check collision with existing pieces
    const row = board[cell.y];
    if (!row) return true;
    if (row[cell.x] !== null) return true;
  }
  
  return false;
}

/**
 * Check if a piece can spawn (no collision at spawn position)
 */
export function canSpawn(board: Board, piece: Tetromino): boolean {
  return !checkCollision(board, piece);
}

// -----------------------------------------------------------------------------
// Piece Movement
// -----------------------------------------------------------------------------

/**
 * Move a piece horizontally
 * Returns the new piece if successful, null if collision
 */
export function movePiece(
  board: Board,
  piece: Tetromino,
  dx: number,
  dy: number
): Tetromino | null {
  if (checkCollision(board, piece, dx, dy)) {
    return null;
  }
  
  return clonePiece(piece, {
    position: {
      x: piece.position.x + dx,
      y: piece.position.y + dy,
    },
  });
}

/**
 * Check if piece is on the ground (can't move down)
 */
export function isOnGround(board: Board, piece: Tetromino): boolean {
  return checkCollision(board, piece, 0, 1);
}

// -----------------------------------------------------------------------------
// Rotation with Wall Kicks
// -----------------------------------------------------------------------------

export interface RotationResult {
  piece: Tetromino;
  wallKickUsed: boolean;
  wallKickIndex: number; // Which wall kick test succeeded (0 = no kick, 1-4 = kick index)
}

/**
 * Attempt to rotate a piece with wall kicks
 * Returns the new piece if successful, null if rotation fails
 */
export function rotatePiece(
  board: Board,
  piece: Tetromino,
  clockwise: boolean
): RotationResult | null {
  const newRotation = getNextRotation(piece.rotation, clockwise);
  
  // Test 0: Basic rotation (no wall kick)
  if (!checkCollision(board, piece, 0, 0, newRotation)) {
    return {
      piece: clonePiece(piece, { rotation: newRotation }),
      wallKickUsed: false,
      wallKickIndex: 0,
    };
  }
  
  // Tests 1-4: Wall kicks
  const kicks = getWallKicks(piece.type, piece.rotation, newRotation);
  
  for (let i = 0; i < kicks.length; i++) {
    const kick = kicks[i];
    if (!kick) continue;
    
    if (!checkCollision(board, piece, kick.x, -kick.y, newRotation)) {
      return {
        piece: clonePiece(piece, {
          position: {
            x: piece.position.x + kick.x,
            y: piece.position.y - kick.y, // Y is inverted in SRS data
          },
          rotation: newRotation,
        }),
        wallKickUsed: true,
        wallKickIndex: i + 1,
      };
    }
  }
  
  return null; // Rotation failed
}

/**
 * Attempt 180 degree rotation
 */
export function rotatePiece180(board: Board, piece: Tetromino): RotationResult | null {
  // Try rotating twice
  const firstRotation = rotatePiece(board, piece, true);
  if (!firstRotation) return null;
  
  const secondRotation = rotatePiece(board, firstRotation.piece, true);
  if (!secondRotation) return null;
  
  return {
    piece: secondRotation.piece,
    wallKickUsed: firstRotation.wallKickUsed || secondRotation.wallKickUsed,
    wallKickIndex: secondRotation.wallKickIndex,
  };
}

// -----------------------------------------------------------------------------
// Ghost Piece
// -----------------------------------------------------------------------------

/**
 * Calculate the Y position where a piece would land
 */
export function getGhostY(board: Board, piece: Tetromino): number {
  let ghostY = piece.position.y;
  
  while (!checkCollision(board, piece, 0, ghostY - piece.position.y + 1)) {
    ghostY++;
  }
  
  return ghostY;
}

/**
 * Hard drop: move piece to ghost position
 */
export function hardDrop(board: Board, piece: Tetromino): { piece: Tetromino; distance: number } {
  const ghostY = getGhostY(board, piece);
  const distance = ghostY - piece.position.y;
  
  return {
    piece: clonePiece(piece, {
      position: { ...piece.position, y: ghostY },
    }),
    distance,
  };
}

// -----------------------------------------------------------------------------
// Locking and Line Clearing
// -----------------------------------------------------------------------------

/**
 * Lock a piece onto the board
 */
export function lockPiece(board: Board, piece: Tetromino): Board {
  const newBoard = cloneBoard(board);
  const cells = getPieceCells(piece);
  
  for (const cell of cells) {
    if (isInBounds(cell.x, cell.y)) {
      const row = newBoard[cell.y];
      if (row) {
        row[cell.x] = piece.type;
      }
    }
  }
  
  return newBoard;
}

/**
 * Find completed lines (full rows)
 * @param board - The game board
 * @param excludeBottomRows - Number of rows at the bottom to exclude (for Zone mode)
 */
export function findCompletedLines(board: Board, excludeBottomRows: number = 0): number[] {
  const completedLines: number[] = [];
  const maxRow = BOARD_HEIGHT - excludeBottomRows;
  
  for (let y = 0; y < maxRow; y++) {
    const row = board[y];
    if (row && row.every(cell => cell !== null)) {
      completedLines.push(y);
    }
  }
  
  return completedLines;
}

/**
 * Clear completed lines and return the new board
 */
export function clearLines(board: Board, lines: number[]): Board {
  if (lines.length === 0) return board;
  
  const newBoard = cloneBoard(board);
  
  // Remove completed lines
  const remainingRows = newBoard.filter((_, y) => !lines.includes(y));
  
  // Add empty rows at the top
  const emptyRows: Cell[][] = [];
  for (let i = 0; i < lines.length; i++) {
    emptyRows.push(new Array(BOARD_WIDTH).fill(null));
  }
  
  return [...emptyRows, ...remainingRows];
}

/**
 * Zone mode line clear: Push completed lines to the BOTTOM of the playable area.
 * 
 * In Tetris Effect Zone mode:
 * 1. Completed lines don't disappear - they move to the bottom
 * 2. The stack above shifts DOWN to fill the gaps  
 * 3. Completed lines accumulate at the very bottom (becoming zone lines)
 * 4. Player continues playing on top of these zone lines
 * 5. When Zone ends, ALL zone lines clear at once for massive points
 * 
 * @param board - Current board state  
 * @param completedLines - Array of row indices that are completed (should NOT include existing zone lines)
 * @param existingZoneLines - Number of lines already stacked at bottom from previous Zone clears
 * @returns New board with completed lines moved to bottom
 */
export function zonePushLinesToBottom(
  board: Board,
  completedLines: number[],
  existingZoneLines: number
): Board {
  if (completedLines.length === 0) return board;
  
  // In Zone mode, completed lines move to the bottom (zone area).
  // The playable area shrinks as zone lines accumulate.
  // Total board height stays constant at BOARD_HEIGHT.
  
  // Split the board:
  // - Playable area: rows 0 to (BOARD_HEIGHT - existingZoneLines - 1)
  // - Zone lines: last existingZoneLines rows
  const playableAreaEnd = BOARD_HEIGHT - existingZoneLines;
  
  // Get all rows in the playable area that are NOT being cleared
  const remainingPlayableRows: Cell[][] = [];
  for (let y = 0; y < playableAreaEnd; y++) {
    if (!completedLines.includes(y)) {
      const row = board[y];
      remainingPlayableRows.push(row ? [...row] : new Array(BOARD_WIDTH).fill(null));
    }
  }
  
  // Get the completed rows (these become new zone lines)
  const newZoneRows: Cell[][] = completedLines.map(y => {
    const row = board[y];
    return row ? [...row] : new Array(BOARD_WIDTH).fill(null);
  });
  
  // Get existing zone lines
  const existingZoneRows: Cell[][] = [];
  for (let y = playableAreaEnd; y < BOARD_HEIGHT; y++) {
    const row = board[y];
    existingZoneRows.push(row ? [...row] : new Array(BOARD_WIDTH).fill(null));
  }
  
  // Build new board:
  // [remaining playable] + [new zone rows] + [existing zone rows]
  // 
  // The playable area now shrinks by completedLines.length.
  // We need to add empty rows at the TOP to maintain BOARD_HEIGHT.
  const totalZoneLines = existingZoneLines + completedLines.length;
  const newPlayableHeight = BOARD_HEIGHT - totalZoneLines;
  
  // Add empty rows at top if needed (remaining playable rows shifted up)
  const emptyRowsNeeded = newPlayableHeight - remainingPlayableRows.length;
  const emptyRows: Cell[][] = [];
  for (let i = 0; i < emptyRowsNeeded; i++) {
    emptyRows.push(new Array(BOARD_WIDTH).fill(null));
  }
  
  // Build new board maintaining BOARD_HEIGHT:
  // [empty rows (if any)] + [remaining playable] + [new zone rows] + [existing zone rows]
  const newBoard: Board = [
    ...emptyRows,
    ...remainingPlayableRows,
    ...newZoneRows,
    ...existingZoneRows,
  ];
  
  // Sanity check - ensure we have exactly BOARD_HEIGHT rows
  if (newBoard.length !== BOARD_HEIGHT) {
    console.error(`zonePushLinesToBottom: Board height mismatch! Got ${newBoard.length}, expected ${BOARD_HEIGHT}`);
  }
  
  return newBoard;
}

/**
 * Clear all Zone lines at the end of Zone mode.
 * Removes the bottom N lines where N = zoneLineCount
 */
export function clearZoneLines(board: Board, zoneLineCount: number): Board {
  if (zoneLineCount === 0) return board;
  
  // Remove the bottom zoneLineCount rows
  const rowsToKeep = board.slice(0, BOARD_HEIGHT - zoneLineCount);
  
  // Add empty rows at the top
  const emptyRows: Cell[][] = [];
  for (let i = 0; i < zoneLineCount; i++) {
    emptyRows.push(new Array(BOARD_WIDTH).fill(null));
  }
  
  return [...emptyRows, ...rowsToKeep];
}

/**
 * Check for perfect clear (all clear)
 */
export function isPerfectClear(board: Board): boolean {
  return board.every(row => row.every(cell => cell === null));
}

// -----------------------------------------------------------------------------
// T-Spin Detection
// -----------------------------------------------------------------------------

/**
 * Check if a corner position is blocked (occupied or out of bounds)
 */
function isCornerBlocked(board: Board, x: number, y: number): boolean {
  if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) {
    return true;
  }
  const row = board[y];
  if (!row) return true;
  return row[x] !== null;
}

/**
 * Detect T-spin using the 3-corner rule
 * Returns 'full', 'mini', or null
 */
export function detectTSpin(
  board: Board,
  piece: Tetromino,
  lastRotationWasWallKick: boolean
): 'full' | 'mini' | null {
  if (piece.type !== TetrominoType.T) {
    return null;
  }
  
  const { x, y } = piece.position;
  
  // T-piece corners based on position (the 4 corners of the 3x3 bounding box)
  const topLeft = { x: x, y: y };
  const topRight = { x: x + 2, y: y };
  const bottomLeft = { x: x, y: y + 2 };
  const bottomRight = { x: x + 2, y: y + 2 };
  
  // Count blocked corners
  const cornersBlocked = [
    isCornerBlocked(board, topLeft.x, topLeft.y),
    isCornerBlocked(board, topRight.x, topRight.y),
    isCornerBlocked(board, bottomLeft.x, bottomLeft.y),
    isCornerBlocked(board, bottomRight.x, bottomRight.y),
  ];
  
  const blockedCount = cornersBlocked.filter(Boolean).length;
  
  // Need at least 3 corners blocked for any T-spin
  if (blockedCount < 3) {
    return null;
  }
  
  // Determine front corners based on rotation
  // Front = where the T's "stem" is pointing
  let frontBlocked: number;
  
  switch (piece.rotation) {
    case 0: // T pointing up - front is top
      frontBlocked = [cornersBlocked[0], cornersBlocked[1]].filter(Boolean).length;
      break;
    case 1: // T pointing right - front is right
      frontBlocked = [cornersBlocked[1], cornersBlocked[3]].filter(Boolean).length;
      break;
    case 2: // T pointing down - front is bottom
      frontBlocked = [cornersBlocked[2], cornersBlocked[3]].filter(Boolean).length;
      break;
    case 3: // T pointing left - front is left
      frontBlocked = [cornersBlocked[0], cornersBlocked[2]].filter(Boolean).length;
      break;
    default:
      frontBlocked = 0;
  }
  
  // Full T-spin: both front corners blocked, OR 3+ corners with wall kick
  if (frontBlocked === 2) {
    return 'full';
  }
  
  // Mini T-spin: only 1 front corner blocked (and 3+ total)
  if (frontBlocked === 1 && blockedCount >= 3) {
    return lastRotationWasWallKick ? 'full' : 'mini'; // Some guidelines upgrade mini to full on wall kick
  }
  
  return null;
}

// -----------------------------------------------------------------------------
// Clear Type Detection
// -----------------------------------------------------------------------------

/**
 * Determine the type of line clear
 */
export function determineClearType(
  linesCleared: number,
  tSpin: 'full' | 'mini' | null,
  isPerfect: boolean
): ClearType {
  if (isPerfect) {
    return 'allClear';
  }
  
  if (tSpin === 'mini') {
    switch (linesCleared) {
      case 0: return 'tSpinMini';
      case 1: return 'tSpinMiniSingle';
      case 2: return 'tSpinMiniDouble';
      default: return 'tSpinMiniDouble';
    }
  }
  
  if (tSpin === 'full') {
    switch (linesCleared) {
      case 0: return 'tSpin';
      case 1: return 'tSpinSingle';
      case 2: return 'tSpinDouble';
      case 3: return 'tSpinTriple';
      default: return 'tSpinTriple';
    }
  }
  
  // Regular clears
  switch (linesCleared) {
    case 1: return 'single';
    case 2: return 'double';
    case 3: return 'triple';
    case 4: return 'tetris';
    default: return 'single';
  }
}

/**
 * Check if a clear type is "difficult" (qualifies for back-to-back)
 */
export function isDifficultClear(clearType: ClearType): boolean {
  return clearType === 'tetris' ||
    clearType === 'tSpinSingle' ||
    clearType === 'tSpinDouble' ||
    clearType === 'tSpinTriple' ||
    clearType === 'tSpinMiniSingle' ||
    clearType === 'tSpinMiniDouble' ||
    clearType === 'allClear';
}

// -----------------------------------------------------------------------------
// Board Utilities
// -----------------------------------------------------------------------------

/**
 * Get the visible portion of the board (bottom 20 rows)
 */
export function getVisibleBoard(board: Board): Board {
  return board.slice(BOARD_HEIGHT - VISIBLE_HEIGHT);
}

/**
 * Check if any cells are above the visible area (danger zone)
 */
export function hasBlocksInDangerZone(board: Board): boolean {
  for (let y = 0; y < BOARD_HEIGHT - VISIBLE_HEIGHT; y++) {
    const row = board[y];
    if (row && row.some(cell => cell !== null)) {
      return true;
    }
  }
  return false;
}
