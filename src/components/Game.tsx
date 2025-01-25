import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TetrominoType, Tetromino } from '../utils/types';
import { SHAPES, BOARD_WIDTH, BOARD_HEIGHT, LEVEL_SPEEDS, MAX_LOCK_RESETS, COLORS } from '../utils/constants';
import { moveDown, moveHorizontal, rotate, hardDrop, holdPiece } from '../utils/gameLogic';
import { Board } from './game/Board/Board';
import { HoldArea } from './game/HoldArea/HoldArea';
import { NextPiece } from './game/NextPiece/NextPiece';
import { Stats } from './game/Stats/Stats';
import { ErrorBoundary } from './common/ErrorBoundary';
import { BoardErrorBoundary } from './game/Board/BoardErrorBoundary';
import { HoldAreaErrorBoundary } from './game/HoldArea/HoldAreaErrorBoundary';
import { NextPieceErrorBoundary } from './game/NextPiece/NextPieceErrorBoundary';
import { StatsErrorBoundary } from './game/Stats/StatsErrorBoundary';

const createEmptyBoard = (): TetrominoType[][] => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
};

const generateRandomPiece = (): Tetromino => {
  const types = Object.values(TetrominoType);
  const randomType = types[Math.floor(Math.random() * types.length)] as TetrominoType;
  const shape = SHAPES[randomType];
  
  if (!shape || !Array.isArray(shape) || !shape[0]) {
    throw new Error(`Invalid shape for piece type: ${randomType}`);
  }

  return {
    shape,
    position: { x: Math.floor((BOARD_WIDTH - shape[0].length) / 2), y: 0 },
    type: randomType,
    rotationState: 0,
    color: COLORS[randomType]
  };
};

const generateInitialPieces = (): Tetromino[] => {
  return Array(3).fill(null).map(() => generateRandomPiece());
};

const createInitialGameState = (): GameState => ({
  board: createEmptyBoard(),
  currentPiece: generateRandomPiece(),
  nextPieces: generateInitialPieces(),
  holdPiece: null,
  score: 0,
  level: 1,
  linesCleared: 0,
  isGameOver: false,
  isPaused: false,
  canHold: true,
  lastMoveWasRotation: false,
  lastTSpin: 'none',
  combo: 0,
  lastClearWasCombo: false,
  backToBack: false,
  lockDelay: 0,
  maxLockResets: MAX_LOCK_RESETS,
  lastLockResetTime: 0
});

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const gameLoopRef = useRef<number | null>(null);

  const restartGame = useCallback(() => {
    setGameState(createInitialGameState());
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.repeat) return; // Prevent key repeat from affecting game state

    if (gameState.isGameOver) {
      if (event.code === 'Enter') {
        restartGame();
      }
      return;
    }

    // Allow Escape key even when paused
    if (event.code === 'Escape') {
      setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
      return;
    }

    // Block other keys when paused
    if (gameState.isPaused) return;

    switch (event.code) {
      case 'ArrowLeft':
        setGameState(prev => moveHorizontal(prev, -1));
        break;
      case 'ArrowRight':
        setGameState(prev => moveHorizontal(prev, 1));
        break;
      case 'ArrowDown':
        setGameState(prev => moveDown(prev));
        break;
      case 'ArrowUp':
        setGameState(prev => rotate(prev, true));
        break;
      case 'KeyZ':
        setGameState(prev => rotate(prev, false));
        break;
      case 'Space':
        event.preventDefault();
        setGameState(prev => hardDrop(prev));
        break;
      case 'KeyC':
        setGameState(prev => holdPiece(prev));
        break;
      case 'KeyP':
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        break;
      default:
        break;
    }
  }, [gameState.isGameOver, gameState.isPaused, restartGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    if (gameState.isGameOver || gameState.isPaused) {
      if (gameLoopRef.current !== null) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const speed = LEVEL_SPEEDS[gameState.level as keyof typeof LEVEL_SPEEDS] ?? LEVEL_SPEEDS[10];
    gameLoopRef.current = window.setInterval(() => {
      setGameState(prev => moveDown(prev));
    }, speed);

    return () => {
      if (gameLoopRef.current !== null) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState.level, gameState.isGameOver, gameState.isPaused]);

  return (
    <ErrorBoundary>
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex gap-4">
          <div className="flex flex-col gap-4 justify-start">
            <HoldAreaErrorBoundary>
              <HoldArea piece={gameState.holdPiece} />
            </HoldAreaErrorBoundary>
          </div>

          <BoardErrorBoundary>
            <Board gameState={gameState} />
          </BoardErrorBoundary>

          <div className="flex flex-col gap-4">
            <NextPieceErrorBoundary>
              <NextPiece pieces={gameState.nextPieces} />
            </NextPieceErrorBoundary>
            <StatsErrorBoundary>
              <Stats gameState={gameState} />
            </StatsErrorBoundary>
          </div>
        </div>

        {(gameState.isGameOver || gameState.isPaused) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center pixel-text">
              {gameState.isGameOver ? (
                <>
                  <div className="text-4xl text-red-500 mb-4">Game Over!</div>
                  <div className="text-xl text-white">Final Score: {gameState.score}</div>
                  <div className="text-lg text-gray-400 mt-4">Press ENTER to restart</div>
                </>
              ) : (
                <div className="text-4xl text-yellow-500">Paused</div>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Game; 