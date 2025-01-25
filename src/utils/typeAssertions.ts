import { GameState, Tetromino, TetrominoType } from './types';
import { isValidGameState, isValidTetromino, isTetrominoType } from './typeGuards';
import { BOARD_WIDTH, BOARD_HEIGHT } from './constants';

export function assertValidGameState(state: GameState): void {
  // Check board dimensions
  if (!state.board || state.board.length !== BOARD_HEIGHT) {
    throw new Error(`Invalid board height: ${state.board?.length}`);
  }

  if (!state.board.every(row => row.length === BOARD_WIDTH)) {
    throw new Error('Invalid board width');
  }

  // Check board contents
  state.board.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell !== null && !Object.values(TetrominoType).includes(cell)) {
        throw new Error(`Invalid cell value at (${x}, ${y}): ${cell}`);
      }
    });
  });

  // Check current piece
  if (!state.currentPiece) {
    throw new Error('Missing current piece');
  }

  // Check next pieces
  if (!Array.isArray(state.nextPieces) || state.nextPieces.length === 0) {
    throw new Error('Invalid next pieces array');
  }

  // Check score and level
  if (typeof state.score !== 'number' || state.score < 0) {
    throw new Error('Invalid score');
  }

  if (typeof state.level !== 'number' || state.level < 1) {
    throw new Error('Invalid level');
  }

  // All checks passed
}

export function assertValidTetromino(piece: unknown): asserts piece is Tetromino {
  if (!isValidTetromino(piece)) {
    throw new TypeError('Invalid Tetromino provided');
  }
}

export function assertTetrominoType(value: unknown): asserts value is TetrominoType {
  if (!isTetrominoType(value)) {
    throw new TypeError('Invalid TetrominoType provided');
  }
} 