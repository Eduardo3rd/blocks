import { GameState, Tetromino, TetrominoType } from './types';
import { isValidGameState, isValidTetromino, isTetrominoType } from './typeGuards';

export function assertValidGameState(state: unknown): asserts state is GameState {
  if (!isValidGameState(state)) {
    throw new TypeError('Invalid GameState provided');
  }
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