import { GameState, TetrominoType, Position, Tetromino } from './types';

export function isTetrominoType(value: unknown): value is TetrominoType {
  return typeof value === 'string' && Object.values(TetrominoType).includes(value as TetrominoType);
}

export function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== 'object') return false;
  const pos = value as Position;
  return typeof pos.x === 'number' && typeof pos.y === 'number';
}

export function isValidTetromino(value: unknown): value is Tetromino {
  if (!value || typeof value !== 'object') return false;
  const piece = value as Tetromino;
  
  return (
    Array.isArray(piece.shape) &&
    piece.shape.every(row => Array.isArray(row) && row.every(cell => typeof cell === 'number')) &&
    isPosition(piece.position) &&
    isTetrominoType(piece.type) &&
    typeof piece.rotationState === 'number' &&
    typeof piece.color === 'string'
  );
}

export function isValidGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const state = value as GameState;

  return (
    Array.isArray(state.board) &&
    state.board.every(row => 
      Array.isArray(row) && 
      row.every(cell => cell === null || isTetrominoType(cell))
    ) &&
    isValidTetromino(state.currentPiece) &&
    Array.isArray(state.nextPieces) &&
    state.nextPieces.every(isValidTetromino) &&
    (state.holdPiece === null || isValidTetromino(state.holdPiece)) &&
    typeof state.score === 'number' &&
    typeof state.level === 'number' &&
    typeof state.linesCleared === 'number' &&
    typeof state.isGameOver === 'boolean' &&
    typeof state.isPaused === 'boolean' &&
    typeof state.canHold === 'boolean' &&
    typeof state.lastMoveWasRotation === 'boolean' &&
    (state.lastTSpin === 'none' || state.lastTSpin === 'mini' || state.lastTSpin === 'full') &&
    typeof state.combo === 'number' &&
    typeof state.lastClearWasCombo === 'boolean' &&
    typeof state.backToBack === 'boolean' &&
    typeof state.lockDelay === 'number' &&
    typeof state.maxLockResets === 'number' &&
    typeof state.lastLockResetTime === 'number'
  );
} 