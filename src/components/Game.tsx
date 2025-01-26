import React, { useState, useEffect, useCallback, useRef, TouchEvent } from 'react';
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
import { getGamepadState, getNewPresses } from '../utils/gamepadControls';
import { Settings } from './game/Settings/Settings';
import { StartScreen } from './game/StartScreen/StartScreen';

// Add DAS and ARR constants
const DAS_DELAY = 167; // 167ms before auto-repeat starts
const ARR_RATE = 33;  // 33ms between moves during auto-repeat

// Add touch control constants
const SWIPE_THRESHOLD = 20; // Minimum distance for a swipe
const LONG_PRESS_DURATION = 200; // Duration for long press in ms
const DOUBLE_TAP_DELAY = 300; // Maximum delay between taps for double tap

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
  const [settings, setSettings] = useState({
    das: 300,  // Increase from 167ms to 300ms for longer initial delay
    arr: 50    // Increase from 33ms to 50ms for slower repeat rate
  });
  const [showSettings, setShowSettings] = useState(false);
  const [keyDownTime, setKeyDownTime] = useState<number | null>(null);
  const [lastMoveTime, setLastMoveTime] = useState<number>(0);
  const [isAutoShifting, setIsAutoShifting] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);

  const restartGame = useCallback(() => {
    setGameState(createInitialGameState());
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isGameStarted) {
      if (event.code === 'Enter') {
        setIsGameStarted(true);
        restartGame();
      }
      return;
    }

    if (event.repeat) return;
    
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

    const now = Date.now();

    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      const direction = event.code === 'ArrowLeft' ? -1 : 1;
      setGameState(prev => moveHorizontal(prev, direction));
      setKeyDownTime(now);
      setIsAutoShifting(false);
      setLastMoveTime(0);
    }

    switch (event.code) {
      case 'ArrowDown':
        // Initial soft drop
        setGameState(prev => moveDown(prev, true));
        // Start soft drop interval immediately (no DAS delay for down)
        if (softDropIntervalRef.current === null) {
          softDropIntervalRef.current = window.setInterval(() => {
            setGameState(prev => moveDown(prev, true));
          }, settings.arr); // Use same rate as ARR for consistency
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
  }, [isGameStarted, gameState.isGameOver, gameState.isPaused, restartGame]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setKeyState(prev => ({ ...prev, [event.code]: false }));

    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      setKeyDownTime(null);
      setIsAutoShifting(false);
      setLastMoveTime(0);
    }

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
  }, [handleKeyDown, handleKeyUp, settings]);

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

  // Add gamepad polling
  useEffect(() => {
    if (gameState.isGameOver) return;

    const handleGamepad = () => {
      const gamepadState = getGamepadState();
      const newPresses = getNewPresses();
      
      if (!gamepadState) return;

      // Handle pause button even when paused
      if (newPresses?.options) {
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
        return;
      }

      // Don't process other inputs when paused
      if (gameState.isPaused) return;

      // Use settings.arr for movement speed
      if (gamepadState.dpadLeft) {
        setGameState(prev => moveHorizontal(prev, -1));
      }
      if (gamepadState.dpadRight) {
        setGameState(prev => moveHorizontal(prev, 1));
      }
      if (gamepadState.dpadDown) {
        setGameState(prev => moveDown(prev, true));
      }

      // Handle new presses (rotations, hard drop, hold)
      if (newPresses) {
        if (newPresses.dpadUp) {
          setGameState(prev => rotate(prev, true));
        }
        if (newPresses.cross) {
          setGameState(prev => hardDrop(prev));
        }
        if (newPresses.circle) {
          setGameState(prev => rotate(prev, false));
        }
        if (newPresses.square) {
          setGameState(prev => holdPiece(prev));
        }
        if (newPresses.triangle) {
          setGameState(prev => rotate180(prev));
        }
      }
    };

    const gamepadInterval = setInterval(handleGamepad, settings.arr);

    return () => {
      clearInterval(gamepadInterval);
    };
  }, [gameState.isGameOver, gameState.isPaused, settings]);

  // Add gamepad connection listener
  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log(`Gamepad connected: ${e.gamepad.id}`);
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log(`Gamepad disconnected: ${e.gamepad.id}`);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, []);

  // Handle DAS and ARR in game loop
  useEffect(() => {
    if (gameState.isGameOver || gameState.isPaused || !keyDownTime) return;

    const handleAutoShift = () => {
      const now = Date.now();
      const keyHoldTime = now - keyDownTime;

      if (keyHoldTime >= settings.das) {
        if (!isAutoShifting) {
          setIsAutoShifting(true);
          setLastMoveTime(now);
        } else if (now - lastMoveTime >= settings.arr) {
          const direction = keyState.ArrowLeft ? -1 : 1;  // Fix direction detection
          setGameState(prev => moveHorizontal(prev, direction));
          setLastMoveTime(now);
        }
      }
    };

    const interval = setInterval(handleAutoShift, 33); // Increase from 16ms to 33ms for smoother control
    return () => clearInterval(interval);
  }, [gameState, keyDownTime, lastMoveTime, isAutoShifting, settings, keyState]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (gameState.isPaused || gameState.isGameOver) return;

    const touch = e.touches[0];
    if (!touch) return;

    const now = Date.now();
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };

    // Start long press timer for hard drop
    longPressTimeoutRef.current = window.setTimeout(() => {
      setGameState(prev => hardDrop(prev));
      touchStartRef.current = null;
    }, LONG_PRESS_DURATION);
  }, [gameState.isPaused, gameState.isGameOver]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current || gameState.isPaused || gameState.isGameOver) return;

    // Clear long press timer on move
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Handle horizontal movement
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      const direction = deltaX > 0 ? 1 : -1;
      setGameState(prev => moveHorizontal(prev, direction));
      touchStartRef.current.x = touch.clientX;
    }

    // Handle vertical movement
    if (deltaY >= SWIPE_THRESHOLD) {
      // Swipe down - soft drop
      setGameState(prev => moveDown(prev, true));
      touchStartRef.current.y = touch.clientY;
    } else if (deltaY <= -SWIPE_THRESHOLD) {
      // Swipe up - hold piece
      setGameState(prev => holdPiece(prev));
      touchStartRef.current = null;
    }
  }, [gameState.isPaused, gameState.isGameOver]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (gameState.isPaused || gameState.isGameOver) return;

    // Clear long press timer
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const now = Date.now();

    // If minimal movement, treat as a tap
    if (deltaX < SWIPE_THRESHOLD && deltaY < SWIPE_THRESHOLD) {
      // Check for double tap
      if (lastTapRef.current && 
          (now - lastTapRef.current.time) < DOUBLE_TAP_DELAY &&
          Math.abs(touch.clientX - lastTapRef.current.x) < SWIPE_THRESHOLD &&
          Math.abs(touch.clientY - lastTapRef.current.y) < SWIPE_THRESHOLD) {
        // Double tap - rotate counterclockwise
        setGameState(prev => rotate(prev, false));
        lastTapRef.current = null;
      } else {
        // Single tap - rotate clockwise
        setGameState(prev => rotate(prev, true));
        lastTapRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: now
        };
      }
    }

    touchStartRef.current = null;
  }, [gameState.isPaused, gameState.isGameOver]);

  // Add touch event listeners
  useEffect(() => {
    const board = document.querySelector('.board');
    if (!board) return;

    board.addEventListener('touchstart', handleTouchStart as any);
    board.addEventListener('touchmove', handleTouchMove as any);
    board.addEventListener('touchend', handleTouchEnd as any);

    return () => {
      board.removeEventListener('touchstart', handleTouchStart as any);
      board.removeEventListener('touchmove', handleTouchMove as any);
      board.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <ErrorBoundary>
      <div className="flex items-center justify-center min-h-screen bg-black">
        {!isGameStarted ? (
          <StartScreen onStart={() => setIsGameStarted(true)} />
        ) : (
          <>
            {/* Main game container */}
            <div className="flex items-center justify-center w-full overflow-hidden">
              {/* Game layout - horizontal on desktop, vertical on mobile */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-4 max-w-full">
                {/* Hold and Next pieces - side by side on mobile, left side on desktop */}
                <div className="hidden md:flex md:flex-col gap-4 md:w-[120px] md:min-w-[120px]">
                  {/* Hold piece - desktop only */}
                  <div className="w-[120px]">
                    <HoldAreaErrorBoundary>
                      <HoldArea piece={gameState.holdPiece} />
                    </HoldAreaErrorBoundary>
                  </div>

                  {/* Next piece - desktop only */}
                  <div>
                    <NextPieceErrorBoundary>
                      <NextPiece pieces={gameState.nextPieces} />
                    </NextPieceErrorBoundary>
                  </div>
                </div>

                {/* Center column with board and mobile-specific elements */}
                <div className="flex flex-col items-center gap-4">
                  {/* Hold and Next pieces - mobile only, side by side */}
                  <div className="flex md:hidden justify-between w-full max-w-[300px] gap-4">
                    {/* Hold piece - mobile */}
                    <div className="w-[90px]">
                      <HoldAreaErrorBoundary>
                        <HoldArea piece={gameState.holdPiece} />
                      </HoldAreaErrorBoundary>
                    </div>

                    {/* Next piece - mobile */}
                    <div className="w-[90px]">
                      <NextPieceErrorBoundary>
                        <NextPiece pieces={gameState.nextPieces} isMobile={true} />
                      </NextPieceErrorBoundary>
                    </div>
                  </div>

                  {/* Game board */}
                  <div className="flex-shrink-0">
                    <BoardErrorBoundary>
                      <Board gameState={gameState} />
                    </BoardErrorBoundary>
                  </div>

                  {/* Stats - only on mobile, below board */}
                  <div className="block md:hidden w-[300px]">
                    <StatsErrorBoundary>
                      <Stats gameState={gameState} />
                    </StatsErrorBoundary>
                  </div>
                </div>

                {/* Stats - only on desktop, right side */}
                <div className="hidden md:flex w-[120px] min-w-[120px] flex-col gap-4">
                  <StatsErrorBoundary>
                    <Stats gameState={gameState} />
                  </StatsErrorBoundary>
                </div>
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
                    <>
                      <div className="text-4xl text-yellow-500 mb-4">Paused</div>
                      <button 
                        className="text-lg text-white bg-gray-800 px-4 py-2 rounded mt-4"
                        onClick={() => setShowSettings(true)}
                      >
                        Settings
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {showSettings && (
              <Settings
                settings={settings}
                onSave={setSettings}
                onClose={() => setShowSettings(false)}
              />
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Game; 