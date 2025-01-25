import { Tetromino } from '../../../utils/types';
import { COLORS } from '../../../utils/constants';

interface PieceRendererProps {
  piece: Tetromino;
  scale?: number;
}

export const PieceRenderer: React.FC<PieceRendererProps> = ({ piece, scale = 1 }) => {
  const cellSize = 30 * scale;
  const width = piece.shape[0].length * cellSize;
  const height = piece.shape.length * cellSize;

  return (
    <svg width={width} height={height}>
      {piece.shape.map((row, y) =>
        row.map((cell, x) => {
          if (cell) {
            return (
              <rect
                key={`${x}-${y}`}
                x={x * cellSize}
                y={y * cellSize}
                width={cellSize}
                height={cellSize}
                fill={COLORS[piece.type]}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="2"
              />
            );
          }
          return null;
        })
      )}
    </svg>
  );
}; 