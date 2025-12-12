import { Tetromino } from '../../../utils/types';
import styles from './Board.module.css';

interface BoardPieceRendererProps {
  piece: Tetromino;
  isGhost?: boolean;
  position?: { x: number; y: number };
}

export const BoardPieceRenderer = ({ piece, isGhost = false, position }: BoardPieceRendererProps) => {
  const piecePosition = position || piece.position;

  return (
    <>
      {piece.shape.map((row, y) =>
        row.map((cell, x) => {
          if (cell === 0) return null;
          return (
            <div
              key={`${x}-${y}`}
              className={`${styles.cell} ${isGhost ? styles.ghostCell : ''}`}
              style={{
                left: `${(piecePosition.x + x) * 25}px`,
                top: `${(piecePosition.y + y) * 25}px`,
                backgroundColor: isGhost ? '#ffffff' : piece.color,
                opacity: isGhost ? 0.3 : 1,
                border: isGhost ? '2px solid #ffffff' : `2px solid ${piece.color}`,
              }}
            />
          );
        })
      )}
    </>
  );
};

