import { GameState, Tetromino, Position, TetrominoType } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT, SHAPES, WALL_KICK_DATA, WALL_KICK_DATA_O, LOCK_DELAY, MAX_LOCK_RESETS, LOCK_RESET_THRESHOLD } from './constants';

const generateRandomPiece = (): Tetromino => {
  const types = Object.values(TetrominoType);
  const randomType = types[Math.floor(Math.random() * types.length)];
  return {
    shape: SHAPES[randomType],
    position: { x: Math.floor((BOARD_WIDTH - SHAPES[randomType][0].length) / 2), y: 0 },
    type: randomType,
    rotationState: 0
  };
};

export const isCollision = (
  board: number[][],
  piece: Tetromino,
  position: Position = piece.position
): boolean => {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] !== 0) {
        const newX = position.x + x;
        const newY = position.y + y;

        if (
          newX < 0 || // Left wall
          newX >= BOARD_WIDTH || // Right wall
          newY >= BOARD_HEIGHT || // Floor
          (newY >= 0 && board[newY][newX] !== 0) // Other pieces
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

export const rotatePiece = (piece: Tetromino): number[][] => {
  const newShape = piece.shape[0].map((_, index) =>
    piece.shape.map(row => row[index]).reverse()
  );
  return newShape;
};

const checkGameOver = (board: number[][], piece: Tetromino): boolean => {
  // Check if any part of the piece would collide at its spawn position
  const spawnPosition = {
    x: Math.floor((BOARD_WIDTH - piece.shape[0].length) / 2),
    y: 0
  };

  // Check if there's a collision at the spawn point
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] !== 0) {
        const boardX = spawnPosition.x + x;
        const boardY = spawnPosition.y + y;
        if (boardY >= 0 && board[boardY][boardX] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
};

const calculateComboBonus = (combo: number, level: number): number => {
  // Modern Tetris combo scoring:
  // 50 * combo * level
  return combo > 0 ? (50 * combo * level) : 0;
};

const isDifficultClear = (lines: number[], tSpinType: 'none' | 'mini' | 'full'): boolean => {
  // Tetris (4 lines) or any T-spin with lines cleared is considered difficult
  return lines.length === 4 || (tSpinType !== 'none' && lines.length > 0);
};

const calculateScore = (clearedLines: number[], level: number, tSpinType: 'none' | 'mini' | 'full', combo: number, backToBack: boolean): number => {
  // Modern Tetris scoring values
  const baseLinePoints = {
    1: 100,   // Single
    2: 300,   // Double
    3: 500,   // Triple
    4: 800    // Tetris
  };

  const tSpinPoints = {
    0: 400,    // T-spin no lines
    1: 800,    // T-spin Single
    2: 1200,   // T-spin Double
    3: 1600    // T-spin Triple
  };

  const miniTSpinPoints = {
    0: 100,    // Mini T-spin no lines
    1: 200,    // Mini T-spin Single
    2: 400     // Mini T-spin Double (rare)
  };

  let score = 0;
  
  if (tSpinType === 'full') {
    // T-spin scoring
    score = (tSpinPoints[clearedLines.length as keyof typeof tSpinPoints] || 400) * level;
  } else if (tSpinType === 'mini') {
    // Mini T-spin scoring
    score = (miniTSpinPoints[clearedLines.length as keyof typeof miniTSpinPoints] || 100) * level;
  } else {
    // Regular line clear scoring
    score = (baseLinePoints[clearedLines.length as keyof typeof baseLinePoints] || 0) * level;
  }

  // Back-to-Back bonus
  // Modern Tetris gives 1.5x score for consecutive difficult clears (Tetris or T-spin with lines)
  if (backToBack && (clearedLines.length === 4 || (tSpinType !== 'none' && clearedLines.length > 0))) {
    score = Math.floor(score * 1.5);
  }

  // Add combo bonus
  score += calculateComboBonus(combo, level);

  // Add soft drop bonus (handled in moveDown)
  // Add hard drop bonus (handled in hardDrop)
  
  return score;
};

const clearLines = (board: number[][]): number[] => {
  const clearedLines: number[] = [];
  
  board.forEach((row, index) => {
    if (row.every(cell => cell !== 0)) {
      clearedLines.push(index);
    }
  });

  return clearedLines;
};

const removeClearedLines = (board: number[][], linesToClear: number[]): number[][] => {
  const newBoard = board.map(row => [...row]);
  
  // Remove lines from bottom to top to maintain correct indices
  [...linesToClear].sort((a, b) => b - a).forEach(lineIndex => {
    newBoard.splice(lineIndex, 1);
    newBoard.unshift(Array(BOARD_WIDTH).fill(0));
  });

  return newBoard;
};

const shouldStartLockDelay = (gameState: GameState): boolean => {
  const nextPosition = {
    ...gameState.currentPiece.position,
    y: gameState.currentPiece.position.y + 1
  };
  return isCollision(gameState.board, gameState.currentPiece, nextPosition);
};

const canResetLockDelay = (gameState: GameState, previousY: number): boolean => {
  return (
    gameState.maxLockResets > 0 && 
    gameState.currentPiece.position.y <= previousY + LOCK_RESET_THRESHOLD
  );
};

export const moveDown = (gameState: GameState): GameState => {
  const newPosition = { ...gameState.currentPiece.position, y: gameState.currentPiece.position.y + 1 };
  const now = Date.now();
  
  if (!isCollision(gameState.board, gameState.currentPiece, newPosition)) {
    // Piece can move down
    return {
      ...gameState,
      currentPiece: {
        ...gameState.currentPiece,
        position: newPosition
      },
      score: gameState.score + 1,  // Soft drop point
      lastMoveWasRotation: false,
      lockDelay: 0,  // Reset lock delay when moving down
      lastLockResetTime: 0
    };
  }

  // If we're not already in lock delay and the piece can't move down, start lock delay
  // Skip lock delay if maxLockResets is 0 (forced lock)
  if (gameState.lockDelay === 0 && shouldStartLockDelay(gameState) && gameState.maxLockResets > 0) {
    return {
      ...gameState,
      lockDelay: LOCK_DELAY,
      lastLockResetTime: now,
      maxLockResets: MAX_LOCK_RESETS
    };
  }

  // If we're in lock delay but haven't exceeded the time, continue waiting
  // Unless maxLockResets is 0 (forced lock)
  if (gameState.lockDelay > 0 && gameState.maxLockResets > 0 && (now - gameState.lastLockResetTime) < gameState.lockDelay) {
    return gameState;
  }

  // Lock delay expired or forced lock, proceed with locking the piece
  const newBoard = lockPiece(gameState);
  const clearedLines = clearLines(newBoard);
  const tSpinType = detectTSpin(gameState, gameState.lastMoveWasRotation);
  const nextPiece = gameState.nextPieces[0];
  
  // Calculate new state values
  const newCombo = clearedLines.length > 0 ? (gameState.combo + 1) : 0;
  const isCurrentClearDifficult = isDifficultClear(clearedLines, tSpinType);
  const newBackToBack = clearedLines.length > 0 
    ? (isCurrentClearDifficult ? true : false)
    : gameState.backToBack;

  const newScore = gameState.score + (clearedLines.length > 0 
    ? calculateScore(clearedLines, gameState.level, tSpinType, newCombo, gameState.backToBack) 
    : 0);

  const boardAfterClear = clearedLines.length > 0 ? removeClearedLines(newBoard, clearedLines) : newBoard;
  const newLinesCleared = gameState.linesCleared + clearedLines.length;
  const newLevel = Math.floor(newLinesCleared / 10) + 1;

  if (checkGameOver(boardAfterClear, nextPiece)) {
    return {
      ...gameState,
      board: boardAfterClear,
      score: newScore,
      linesCleared: newLinesCleared,
      isGameOver: true,
      lastMoveWasRotation: false,
      lastTSpin: 'none',
      combo: 0,
      lastClearWasCombo: false,
      backToBack: false,
      lockDelay: 0,
      maxLockResets: MAX_LOCK_RESETS,
      lastLockResetTime: 0
    };
  }

  return {
    ...gameState,
    board: boardAfterClear,
    currentPiece: nextPiece,
    nextPieces: [...gameState.nextPieces.slice(1), generateRandomPiece()],
    score: newScore,
    linesCleared: newLinesCleared,
    level: newLevel,
    canHold: true,
    lastMoveWasRotation: false,
    lastTSpin: tSpinType,
    combo: newCombo,
    lastClearWasCombo: clearedLines.length > 0,
    backToBack: newBackToBack,
    lockDelay: 0,  // Reset lock delay for new piece
    maxLockResets: MAX_LOCK_RESETS,
    lastLockResetTime: 0
  };
};

export const moveHorizontal = (gameState: GameState, direction: -1 | 1): GameState => {
  const newPosition = {
    ...gameState.currentPiece.position,
    x: gameState.currentPiece.position.x + direction
  };

  if (!isCollision(gameState.board, gameState.currentPiece, newPosition)) {
    const now = Date.now();
    const oldY = gameState.currentPiece.position.y;

    // Reset lock delay if conditions are met
    if (shouldStartLockDelay(gameState) && canResetLockDelay(gameState, oldY)) {
      return {
        ...gameState,
        currentPiece: {
          ...gameState.currentPiece,
          position: newPosition
        },
        lockDelay: LOCK_DELAY,
        lastLockResetTime: now,
        maxLockResets: gameState.maxLockResets - 1
      };
    }

    return {
      ...gameState,
      currentPiece: {
        ...gameState.currentPiece,
        position: newPosition
      }
    };
  }

  return gameState;
};

const getWallKickData = (piece: Tetromino, newRotationState: number): Position[] => {
  if (piece.type === TetrominoType.O) {
    return WALL_KICK_DATA_O;
  }

  const tests = piece.type === TetrominoType.I ? WALL_KICK_DATA.I : WALL_KICK_DATA.JLSTZ;
  const rotationIndex = ((piece.rotationState % 4) + 4) % 4;
  const kickData = tests[rotationIndex];
  
  // Return the kick data with inverted tests if rotating counterclockwise
  if (newRotationState < piece.rotationState || 
      (piece.rotationState === 0 && newRotationState === 3)) {
    return kickData.map(pos => ({ x: -pos.x, y: -pos.y }));
  }
  
  return kickData;
};

export const rotate = (gameState: GameState, clockwise: boolean = true): GameState => {
  const piece = gameState.currentPiece;
  const newShape = clockwise ? 
    piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse()) :
    piece.shape[0].map((_, i) => piece.shape.map(row => row[i])).reverse();

  const newRotationState = clockwise ?
    ((piece.rotationState + 1) % 4) :
    ((piece.rotationState - 1 + 4) % 4);

  const rotatedPiece = {
    ...piece,
    shape: newShape,
    rotationState: newRotationState
  };

  // Get wall kick data for this rotation
  const kickData = getWallKickData(piece, newRotationState);

  // Try each wall kick until we find one that works
  for (const kick of kickData) {
    const testPosition = {
      x: piece.position.x + kick.x,
      y: piece.position.y - kick.y
    };

    if (!isCollision(gameState.board, { ...rotatedPiece, position: testPosition })) {
      const now = Date.now();
      const oldY = piece.position.y;

      // Reset lock delay if conditions are met
      if (shouldStartLockDelay(gameState) && canResetLockDelay(gameState, oldY)) {
        return {
          ...gameState,
          currentPiece: {
            ...rotatedPiece,
            position: testPosition
          },
          lastMoveWasRotation: true,
          lockDelay: LOCK_DELAY,
          lastLockResetTime: now,
          maxLockResets: gameState.maxLockResets - 1
        };
      }

      return {
        ...gameState,
        currentPiece: {
          ...rotatedPiece,
          position: testPosition
        },
        lastMoveWasRotation: true
      };
    }
  }

  return {
    ...gameState,
    lastMoveWasRotation: false
  };
};

const lockPiece = (gameState: GameState): number[][] => {
  const newBoard = gameState.board.map(row => [...row]);
  const piece = gameState.currentPiece;

  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const boardY = y + piece.position.y;
        const boardX = x + piece.position.x;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = value;
        }
      }
    });
  });

  return newBoard;
};

const checkCorner = (board: number[][], x: number, y: number): boolean => {
  return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && board[y][x] !== 0;
};

const detectTSpin = (gameState: GameState, lastRotation: boolean): 'none' | 'mini' | 'full' => {
  const piece = gameState.currentPiece;
  if (piece.type !== TetrominoType.T || !lastRotation) {
    return 'none';
  }

  const { x, y } = piece.position;
  const board = gameState.board;

  // Check the four corners around the T piece
  const corners = [
    checkCorner(board, x, y),           // Top-left
    checkCorner(board, x + 2, y),       // Top-right
    checkCorner(board, x, y + 2),       // Bottom-left
    checkCorner(board, x + 2, y + 2),   // Bottom-right
  ];

  // Count blocked corners
  const blockedCorners = corners.filter(Boolean).length;

  // For a full T-spin, we need at least 3 corners blocked
  if (blockedCorners >= 3) {
    return 'full';
  }

  // For a mini T-spin, we need at least 2 corners blocked
  // and specific conditions based on rotation state
  if (blockedCorners >= 2) {
    const frontCorners = piece.rotationState === 0 ? [corners[2], corners[3]] :  // Front corners for upward facing T
                        piece.rotationState === 1 ? [corners[1], corners[3]] :    // Front corners for right facing T
                        piece.rotationState === 2 ? [corners[0], corners[1]] :    // Front corners for downward facing T
                        [corners[0], corners[2]];                                 // Front corners for left facing T

    if (frontCorners.filter(Boolean).length >= 1) {
      return 'mini';
    }
  }

  return 'none';
};

export const hardDrop = (gameState: GameState): GameState => {
  let newPosition = { ...gameState.currentPiece.position };
  let dropDistance = 0;

  // Keep moving down until collision
  while (!isCollision(gameState.board, gameState.currentPiece, { ...newPosition, y: newPosition.y + 1 })) {
    newPosition.y += 1;
    dropDistance += 1;
  }

  // Hard drop bonus (2 points per cell)
  const dropPoints = dropDistance * 2;

  // Create a new state with the piece at the bottom and force immediate lock
  const stateWithPieceAtBottom = {
    ...gameState,
    currentPiece: {
      ...gameState.currentPiece,
      position: newPosition
    },
    // Force immediate lock by setting lock delay to 0 and preventing resets
    lockDelay: 0,
    lastLockResetTime: 0,
    maxLockResets: 0,  // This will force immediate lock in moveDown
    lastMoveWasRotation: false
  };

  // Lock the piece immediately by calling moveDown
  const finalState = moveDown(stateWithPieceAtBottom);
  
  // Add hard drop bonus points
  return {
    ...finalState,
    score: finalState.score + dropPoints
  };
};

export const holdPiece = (gameState: GameState): GameState => {
  // Can only hold once per piece
  if (gameState.canHold === false) {
    return gameState;
  }

  const currentPiece = gameState.currentPiece;
  let newCurrentPiece: Tetromino;

  if (gameState.holdPiece === null) {
    // If no piece is held, use the next piece
    newCurrentPiece = gameState.nextPieces[0];
  } else {
    // Swap current piece with held piece
    newCurrentPiece = {
      ...gameState.holdPiece,
      position: { x: Math.floor((BOARD_WIDTH - gameState.holdPiece.shape[0].length) / 2), y: 0 }
    };
  }

  // Reset position of piece being held
  const newHoldPiece = {
    ...currentPiece,
    position: { x: 0, y: 0 }
  };

  return {
    ...gameState,
    holdPiece: newHoldPiece,
    currentPiece: newCurrentPiece,
    nextPieces: gameState.holdPiece === null 
      ? [...gameState.nextPieces.slice(1), generateRandomPiece()]
      : gameState.nextPieces,
    canHold: false
  };
};

export const getGhostPiecePosition = (gameState: GameState): Position => {
  let ghostPosition = { ...gameState.currentPiece.position };
  
  // Keep moving down until collision
  while (!isCollision(gameState.board, gameState.currentPiece, { ...ghostPosition, y: ghostPosition.y + 1 })) {
    ghostPosition.y += 1;
  }
  
  return ghostPosition;
}; 