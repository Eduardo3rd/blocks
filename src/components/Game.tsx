import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from './GameBoard';
import PieceRenderer from './PieceRenderer';
import { GameState, TetrominoType, Tetromino } from '../utils/types';
import { SHAPES, BOARD_WIDTH, BOARD_HEIGHT, LEVEL_SPEEDS, MAX_LOCK_RESETS } from '../utils/constants';
import { moveDown, moveHorizontal, rotate, hardDrop, holdPiece } from '../utils/gameLogic';

const createEmptyBoard = (): number[][] => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
};

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

const generateInitialPieces = (): Tetromino[] => {
  return Array(3).fill(null).map(() => generateRandomPiece());
};

const initialGameState: GameState = {
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
};

interface PiecePreviewProps {
  piece: Tetromino | null;
  title: string;
}

const PiecePreview: React.FC<PiecePreviewProps> = ({ piece, title }) => {
  const cellSize = 15; // Even smaller size for preview

  return (
    <div className="bg-gray-900 p-2 rounded">
      <h2 className="text-lg mb-2 font-mono uppercase">{title}</h2>
      <div className="relative w-20 h-20 bg-gray-900 flex items-center justify-center border border-gray-700">
        {piece && (
          <div style={{ transform: 'scale(0.8)' }}>
            <PieceRenderer piece={piece} cellSize={cellSize} />
          </div>
        )}
      </div>
    </div>
  );
};

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const restartGame = useCallback(() => {
    // Create fresh initial state
    const freshState: GameState = {
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
    };
    setGameState(freshState);
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameState.isGameOver) {
      if (event.code === 'Enter') {
        restartGame();
      }
      return;
    }

    if (gameState.isPaused && event.code !== 'KeyP') return;

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
    // Set up keyboard controls
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    // Game loop
    if (gameState.isGameOver || gameState.isPaused) return;

    const speed = LEVEL_SPEEDS[gameState.level as keyof typeof LEVEL_SPEEDS] || LEVEL_SPEEDS[10];
    const gameLoop = setInterval(() => {
      setGameState(prev => moveDown(prev));
    }, speed);

    return () => {
      clearInterval(gameLoop);
    };
  }, [gameState.level, gameState.isGameOver, gameState.isPaused]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex gap-4">
        {/* Left side - Hold */}
        <div className="flex flex-col gap-4 justify-start">
          <div className="bg-gray-900 p-4 rounded h-[140px]">
            <PiecePreview piece={gameState.holdPiece} title="Hold" />
          </div>
        </div>

        {/* Center - Game Board */}
        <div>
          <GameBoard gameState={gameState} />
        </div>

        {/* Right side - Next Pieces and Stats */}
        <div className="flex flex-col gap-4">
          {/* Next pieces container with fixed height */}
          <div className="flex flex-col gap-2 bg-gray-900 p-4 rounded">
            <PiecePreview piece={gameState.nextPieces[0]} title="Next" />
            {gameState.nextPieces.slice(1, 3).map((piece, index) => (
              <div key={index} className="bg-gray-800 p-2 rounded">
                <div className="relative w-20 h-20 flex items-center justify-center border border-gray-700">
                  <div style={{ transform: 'scale(0.8)' }}>
                    <PieceRenderer piece={piece} cellSize={15} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats container with fixed height */}
          <div className="bg-gray-900 p-4 rounded font-mono h-[200px]">
            <div className="space-y-2 text-right">
              <div>
                <div className="text-gray-400 uppercase">Lines</div>
                <div className="text-2xl">{gameState.linesCleared}</div>
              </div>
              <div>
                <div className="text-gray-400 uppercase">Level</div>
                <div className="text-2xl">{gameState.level}</div>
              </div>
              <div>
                <div className="text-gray-400 uppercase">Score</div>
                <div className="text-2xl">{gameState.score}</div>
              </div>
              {/* Fixed height container for combo and T-spin info */}
              <div className="h-[60px] flex flex-col justify-end">
                {gameState.combo > 1 && (
                  <div>
                    <div className="text-yellow-400 uppercase text-sm">Combo</div>
                    <div className="text-2xl text-yellow-300">×{gameState.combo}</div>
                  </div>
                )}
                {gameState.lastTSpin !== 'none' && (
                  <div>
                    <div className={`text-xl ${gameState.lastTSpin === 'full' ? 'text-purple-400' : 'text-purple-300'}`}>
                      {gameState.lastTSpin === 'full' ? 'T-SPIN!' : 'MINI T-SPIN!'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Updated overlay messages */}
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
  );
};

export default Game; 