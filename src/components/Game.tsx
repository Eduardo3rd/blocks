import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, TetrominoType, Tetromino } from '../utils/types';
import { SHAPES, BOARD_WIDTH, BOARD_HEIGHT, LEVEL_SPEEDS, MAX_LOCK_RESETS, COLORS } from '../utils/constants';
import { moveDown, moveHorizontal, rotate, hardDrop, holdPiece, rotate180 } from '../utils/gameLogic';
import { Board } from './game/Board/Board';
import { HoldArea } from './game/HoldArea/HoldArea';
import { NextPiece } from './game/NextPiece/NextPiece';
import { Stats } from './game/Stats/Stats';
import { ErrorBoundary } from './common/ErrorBoundary';
import { BoardErrorBoundary } from './game/Board/BoardErrorBoundary';
import { HoldAreaErrorBoundary } from './game/HoldArea/HoldAreaErrorBoundary';
import { NextPieceErrorBoundary } from './game/NextPiece/NextPieceErrorBoundary';
import { StatsErrorBoundary } from './game/Stats/StatsErrorBoundary';
import { saveHighScore } from '../utils/highScores'
import { HighScores } from './game/HighScores/HighScores'

// Add DAS and ARR constants
const DAS_DELAY = 167; // 167ms before auto-repeat starts
const ARR_RATE = 33;  // 33ms between moves during auto-repeat

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
  const [keyState, setKeyState] = useState<{ [key: string]: boolean }>({});
  const dasTimerRef = useRef<number | null>(null);
  const arrIntervalRef = useRef<number | null>(null);
  const softDropIntervalRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef<number>(0);

  const restartGame = useCallback(() => {
    setGameState(createInitialGameState());
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
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

    setKeyState(prev => ({ ...prev, [event.code]: true }));

    switch (event.code) {
      case 'ArrowLeft':
      case 'ArrowRight':
        // Start DAS timer
        if (dasTimerRef.current === null) {
          const direction = event.code === 'ArrowLeft' ? -1 : 1;
          setGameState(prev => moveHorizontal(prev, direction));
          
          dasTimerRef.current = window.setTimeout(() => {
            // After DAS delay, start ARR interval
            arrIntervalRef.current = window.setInterval(() => {
              setGameState(prev => moveHorizontal(prev, direction));
            }, ARR_RATE);
          }, DAS_DELAY);
        }
        break;
      case 'ArrowDown':
        // Initial soft drop
        setGameState(prev => moveDown(prev, true));
        // Start soft drop interval immediately (no DAS delay for down)
        if (softDropIntervalRef.current === null) {
          softDropIntervalRef.current = window.setInterval(() => {
            setGameState(prev => moveDown(prev, true));
          }, ARR_RATE); // Use same rate as ARR for consistency
        }
        break;
      case 'ArrowUp':
      case 'KeyX':
        setGameState(prev => rotate(prev, true));
        break;
      case 'KeyZ':
        setGameState(prev => rotate(prev, false));
        break;
      case 'KeyA':
        setGameState(prev => rotate180(prev));
        break;
      case 'Space':
        event.preventDefault();
        setGameState(prev => hardDrop(prev));
        break;
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight':
        setGameState(prev => holdPiece(prev));
        break;
      case 'KeyP':
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        break;
      default:
        break;
    }
  }, [gameState.isGameOver, gameState.isPaused, restartGame]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setKeyState(prev => ({ ...prev, [event.code]: false }));

    // Clear DAS and ARR timers on key up
    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      if (dasTimerRef.current !== null) {
        clearTimeout(dasTimerRef.current);
        dasTimerRef.current = null;
      }
      if (arrIntervalRef.current !== null) {
        clearInterval(arrIntervalRef.current);
        arrIntervalRef.current = null;
      }
    }

    // Clear soft drop interval
    if (event.code === 'ArrowDown') {
      if (softDropIntervalRef.current !== null) {
        clearInterval(softDropIntervalRef.current);
        softDropIntervalRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clean up any remaining timers
      if (dasTimerRef.current !== null) {
        clearTimeout(dasTimerRef.current);
      }
      if (arrIntervalRef.current !== null) {
        clearInterval(arrIntervalRef.current);
      }
      if (softDropIntervalRef.current !== null) {
        clearInterval(softDropIntervalRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp]);

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
      setGameState(prev => moveDown(prev, false));
    }, speed);

    return () => {
      if (gameLoopRef.current !== null) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState.level, gameState.isGameOver, gameState.isPaused]);

  // Add useEffect to watch for game over state
  useEffect(() => {
    if (gameState.isGameOver) {
      handleGameOver();
    }
  }, [gameState.isGameOver]);

  const handleGameOver = async () => {
    const playerName = prompt('Game Over! Enter your name for the high score:')
    if (playerName) {
      await saveHighScore(playerName, gameState.score)
    }
  }

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
        <HighScores />
      </div>
    </ErrorBoundary>
  );
};

export default Game; 