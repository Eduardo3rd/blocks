import React, { useState, useEffect } from 'react';
import { GameState, TetrominoType } from '../../../utils/types';
import { getGhostPiecePosition } from '../../../utils/gameLogic';
import { COLORS, BOMB_FLASH_INTERVAL } from '../../../utils/constants';
import './Board.css';

interface BoardProps {
  gameState: GameState;
}

export const Board: React.FC<BoardProps> = ({ gameState }) => {
  const [bombFlashState, setBombFlashState] = useState(false);
  const [flashSpeed, setFlashSpeed] = useState(BOMB_FLASH_INTERVAL);

  // Add flashing effect for bomb pieces with increasing intensity
  useEffect(() => {
    if (gameState.currentPiece.type === TetrominoType.BOMB) {
      // Increase flash speed based on lock delay
      const speedMultiplier = gameState.lockDelay > 0 ? 2 : 1;
      const currentFlashSpeed = BOMB_FLASH_INTERVAL / speedMultiplier;
      
      setFlashSpeed(currentFlashSpeed);
      
      const flashInterval = setInterval(() => {
        setBombFlashState(prev => !prev);
      }, currentFlashSpeed);

      return () => clearInterval(flashInterval);
    }
  }, [gameState.currentPiece.type, gameState.lockDelay]);

  const renderCell = (cell: TetrominoType | null, isCurrent: boolean = false, isGhost: boolean = false, isBlastRadius: boolean = false) => {
    if (!cell && !isBlastRadius) return null;

    let color = cell ? COLORS[cell] : 'transparent';
    
    // Handle bomb piece color flashing
    if (cell === TetrominoType.BOMB && isCurrent) {
      color = bombFlashState ? '#FFFFFF' : '#000000';
    }

    // Add ghost piece styling
    if (isGhost) {
      return (
        <div
          className="cell ghost-piece"
          style={{
            backgroundColor: '#808080',
            opacity: 0.3
          }}
        />
      );
    }

    // Add blast radius indicator
    if (isBlastRadius && gameState.currentPiece.type === TetrominoType.BOMB) {
      return (
        <div
          className="cell blast-radius"
          style={{
            backgroundColor: 'transparent',
            border: `2px dashed ${bombFlashState ? '#FF0000' : '#800000'}`,
            opacity: 0.5
          }}
        />
      );
    }

    return (
      <div
        className={`cell ${cell === TetrominoType.BOMB ? 'bomb-cell' : ''}`}
        style={{
          backgroundColor: color,
          transition: cell === TetrominoType.BOMB ? `background-color ${flashSpeed}ms linear` : undefined
        }}
      />
    );
  };

  // Get ghost piece position
  const ghostPosition = getGhostPiecePosition(gameState);

  // Calculate blast radius positions for current piece if it's a bomb
  const getBlastRadiusPositions = () => {
    if (gameState.currentPiece.type !== TetrominoType.BOMB) return [];
    
    const positions = [];
    const center = gameState.currentPiece.position;
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip center position
        const x = center.x + dx;
        const y = center.y + dy;
        if (x >= 0 && x < 10 && y >= 0 && y < 20) { // Check board boundaries
          positions.push({ x, y });
        }
      }
    }
    
    return positions;
  };

  const blastRadius = getBlastRadiusPositions();

  // Render the board
  return (
    <div className="board">
      {gameState.board.map((row, y) => (
        <div key={y} className="row">
          {row.map((cell, x) => {
            // Check if current piece occupies this cell
            const pieceCell = gameState.currentPiece.shape
              .map((row, pieceY) => {
                const boardY = gameState.currentPiece.position.y + pieceY;
                return row.map((value, pieceX) => {
                  const boardX = gameState.currentPiece.position.x + pieceX;
                  return value !== 0 && boardY === y && boardX === x
                    ? gameState.currentPiece.type
                    : null;
                }).find(Boolean);
              })
              .find(Boolean);

            // Check if ghost piece occupies this cell
            const ghostCell = gameState.currentPiece.shape
              .map((row, pieceY) => {
                const boardY = ghostPosition.y + pieceY;
                return row.map((value, pieceX) => {
                  const boardX = ghostPosition.x + pieceX;
                  return value !== 0 && boardY === y && boardX === x && boardY !== gameState.currentPiece.position.y + pieceY
                    ? gameState.currentPiece.type
                    : null;
                }).find(Boolean);
              })
              .find(Boolean);

            // Check if cell is in blast radius
            const isInBlastRadius = blastRadius.some(pos => pos.x === x && pos.y === y);

            return (
              <div key={x} className="cell-container">
                {renderCell(pieceCell || cell, true) || 
                 renderCell(ghostCell, false, true) || 
                 renderCell(cell) || 
                 (isInBlastRadius && renderCell(null, false, false, true))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};