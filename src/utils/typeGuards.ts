import { Tetromino, TetrominoType, Position, GameState } from './types';

export const isTetrominoType = (value: unknown): value is TetrominoType => {
  return Object.values(TetrominoType).includes(value as TetrominoType);
};

export const isValidPosition = (pos: unknown): pos is Position => {
  return (
    typeof pos === 'object' &&
    pos !== null &&
    'x' in pos &&
    'y' in pos &&
    typeof pos.x === 'number' &&
    typeof pos.y === 'number'
  );
};

export const isValidTetromino = (piece: unknown): piece is Tetromino => {
  return (
    typeof piece === 'object' &&
    piece !== null &&
    'shape' in piece &&
    Array.isArray(piece.shape) &&
    piece.shape.every(row => Array.isArray(row) && row.every(cell => typeof cell === 'number')) &&
    'position' in piece &&
    isValidPosition(piece.position) &&
    'type' in piece &&
    isTetrominoType(piece.type) &&
    'rotationState' in piece &&
    typeof piece.rotationState === 'number' &&
    'color' in piece &&
    typeof piece.color === 'string'
  );
};

export const isValidGameState = (state: unknown): state is GameState => {
  return (
    typeof state === 'object' &&
    state !== null &&
    'board' in state &&
    Array.isArray(state.board) &&
    state.board.every(row => 
      Array.isArray(row) && 
      row.every(cell => cell === null || isTetrominoType(cell))
    ) &&
    'currentPiece' in state &&
    isValidTetromino(state.currentPiece) &&
    'nextPieces' in state &&
    Array.isArray(state.nextPieces) &&
    state.nextPieces.every(isValidTetromino)
  );
}; 