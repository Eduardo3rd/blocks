import { Tetromino } from '../../../utils/types';
import { COLORS } from '../../../utils/constants';
import { useMemo } from 'react';

interface PieceRendererProps {
  piece: Tetromino;
  scale?: number;
  ghost?: boolean;
  position?: { x: number; y: number };
}

export const PieceRenderer: React.FC<PieceRendererProps> = ({ 
  piece, 
  scale = 1, 
  ghost = false,
  position
}) => {
  const cellSize = 30 * scale;
  const width = (piece.shape[0]?.length ?? 0) * cellSize;
  const height = piece.shape.length * cellSize;
  const piecePosition = position || piece.position;

  // Generate unique IDs for gradients
  const gradientId = useMemo(() => 
    `gradient-${piece.type}-${Math.random().toString(36).substr(2, 9)}`, 
    [piece.type]
  );

  if (!piece.shape || !Array.isArray(piece.shape) || width === 0 || height === 0) {
    return null;
  }

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS[piece.type]} stopOpacity={1} />
          <stop offset="100%" stopColor={COLORS[piece.type]} stopOpacity={0.8} />
        </linearGradient>
      </defs>
      {piece.shape.map((row, y) =>
        row?.map((cell, x) => {
          if (cell) {
            return (
              <g key={`${x}-${y}`}>
                <rect
                  x={x * cellSize + 1}
                  y={y * cellSize + 1}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  rx={4}
                  ry={4}
                  fill={ghost ? '#ffffff' : `url(#${gradientId})`}
                  stroke={ghost ? '#ffffff' : "rgba(0,0,0,0.2)"}
                  strokeWidth={2}
                  opacity={ghost ? 0.2 : 1}
                />
                {!ghost && (
                  <rect
                    x={x * cellSize + 3}
                    y={y * cellSize + 3}
                    width={cellSize - 6}
                    height={cellSize - 6}
                    rx={2}
                    ry={2}
                    fill="none"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          }
          return null;
        })
      )}
    </svg>
  );
}; 