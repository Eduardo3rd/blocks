import React from 'react';
import { GameState } from '../utils/types';
import { CELL_SIZE, BOARD_WIDTH, BOARD_HEIGHT } from '../utils/constants';
import { getGhostPiecePosition } from '../utils/gameLogic';
import PieceRenderer from './PieceRenderer';

interface GameBoardProps {
  gameState: GameState;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  return (
    <div className="p-2 bg-gray-900 rounded-xl">
      <div 
        className="relative rounded-lg overflow-hidden"
        style={{
          width: (BOARD_WIDTH * CELL_SIZE) + 16,
          height: (BOARD_HEIGHT * CELL_SIZE) + 16,
          padding: 8,
          background: `
            linear-gradient(180deg, 
              rgba(0, 0, 51, 0.95) 0%,
              rgba(0, 0, 102, 0.95) 100%
            )
          `,
          border: '4px solid rgb(31, 41, 55)'
        }}
      >
        {/* Background pattern */}
        <div 
          className="absolute inset-[8px]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.03) 1px, transparent 0)
            `,
            backgroundSize: `${CELL_SIZE/2}px ${CELL_SIZE/2}px`,
          }}
        />
        
        {/* Grid lines */}
        <div 
          className="absolute inset-[8px]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        />
        
        {/* Rest of the board content */}
        <div className="relative" style={{ 
          width: BOARD_WIDTH * CELL_SIZE, 
          height: BOARD_HEIGHT * CELL_SIZE,
          margin: '0 auto'
        }}>
          {/* Draw placed pieces */}
          {gameState.board.map((row, y) =>
            row.map((cell, x) => (
              cell !== 0 && (
                <div
                  key={`${x}-${y}`}
                  style={{
                    position: 'absolute',
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                >
                  <PieceRenderer
                    piece={{
                      shape: [[cell]],
                      position: { x, y },
                      type: 'I' as any,
                      rotationState: 0
                    }}
                    cellSize={CELL_SIZE}
                  />
                </div>
              )
            ))
          )}

          {/* Draw ghost piece */}
          {gameState.currentPiece && (
            <div
              style={{
                position: 'absolute',
                left: getGhostPiecePosition(gameState).x * CELL_SIZE,
                top: getGhostPiecePosition(gameState).y * CELL_SIZE,
              }}
            >
              <PieceRenderer
                piece={gameState.currentPiece}
                cellSize={CELL_SIZE}
                ghost={true}
              />
            </div>
          )}

          {/* Draw active piece */}
          {gameState.currentPiece && (
            <div
              style={{
                position: 'absolute',
                left: gameState.currentPiece.position.x * CELL_SIZE,
                top: gameState.currentPiece.position.y * CELL_SIZE,
              }}
            >
              <PieceRenderer
                piece={gameState.currentPiece}
                cellSize={CELL_SIZE}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameBoard; 