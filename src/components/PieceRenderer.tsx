import React from 'react';
import { Tetromino } from '../utils/types';

interface PieceRendererProps {
  piece: Tetromino;
  cellSize: number;
  ghost?: boolean;
}

const getCellColor = (value: number): string => {
  const colors = {
    1: '#00f0f0', // I piece (cyan)
    2: '#f0f000', // O piece (yellow)
    3: '#a000f0', // T piece (purple)
    4: '#00f000', // S piece (green)
    5: '#f00000', // Z piece (red)
    6: '#0000f0', // J piece (blue)
    7: '#f0a000', // L piece (orange)
  };
  return colors[value as keyof typeof colors] || '#000';
};

const PieceRenderer: React.FC<PieceRendererProps> = ({ piece, cellSize, ghost = false }) => {
  return (
    <div
      className="grid gap-0"
      style={{
        gridTemplateColumns: `repeat(${piece.shape[0].length}, ${cellSize}px)`,
      }}
    >
      {piece.shape.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              backgroundColor: 'transparent',
              position: 'relative',
            }}
          >
            {cell !== 0 && (
              <div
                style={{
                  position: 'absolute',
                  inset: '1px',
                  borderRadius: '4px',
                  background: ghost 
                    ? 'rgba(255, 255, 255, 0.15)'
                    : `linear-gradient(135deg, ${getCellColor(cell)} 0%, ${getCellColor(cell)}cc 100%)`,
                  border: ghost 
                    ? '1px solid rgba(255, 255, 255, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: ghost 
                    ? 'none' 
                    : `0 0 8px ${getCellColor(cell)}66`,
                }}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default PieceRenderer; 