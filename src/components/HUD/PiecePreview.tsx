// =============================================================================
// BLOCKS - PIECE PREVIEW COMPONENT
// Used for Hold piece and Next queue display
// Uses shared Mino styles for consistent block appearance
// Optimized with memoization
// =============================================================================

import React, { useMemo, memo } from 'react';
import { TetrominoType } from '../../engine/types';
import { SHAPES, PIECE_COLORS } from '../../engine/Piece';
import styles from './PiecePreview.module.css';
import minoStyles from '../../styles/Mino.module.css';

interface PiecePreviewProps {
  type: TetrominoType | null;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'normal';
}

export const PiecePreview = memo<PiecePreviewProps>(({
  type,
  label,
  disabled = false,
  size = 'normal',
}) => {
  const shape = type ? SHAPES[type] : null;
  const color = type ? PIECE_COLORS[type] : 'transparent';
  
  const grid = useMemo(() => {
    if (!shape) {
      return (
        <div className={styles.empty}>
          <span>-</span>
        </div>
      );
    }
    
    // Find actual bounds of the piece
    const firstRow = shape[0];
    if (!firstRow) return null;
    
    let minX = firstRow.length, maxX = 0;
    let minY = shape.length, maxY = 0;
    
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      });
    });
    
    const rows: React.ReactNode[] = [];
    const sizeClass = size === 'small' ? minoStyles.small : minoStyles.preview;
    
    for (let y = minY; y <= maxY; y++) {
      const cells: React.ReactNode[] = [];
      for (let x = minX; x <= maxX; x++) {
        const filled = shape[y]?.[x] === 1;
        
        const classNames = [
          minoStyles.mino,
          sizeClass,
          filled && minoStyles.filled,
        ].filter(Boolean).join(' ');
        
        const style: React.CSSProperties = filled ? {
          backgroundColor: color,
          '--mino-color': color,
        } as React.CSSProperties : {};
        
        cells.push(
          <div
            key={`${x}-${y}`}
            className={classNames}
            style={style}
          />
        );
      }
      rows.push(
        <div key={y} className={minoStyles.row}>
          {cells}
        </div>
      );
    }
    
    return rows;
  }, [shape, color, size]);
  
  const containerClass = [
    styles.preview,
    disabled && styles.disabled,
    size === 'small' && styles.small,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClass}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.pieceContainer}>
        {grid}
      </div>
    </div>
  );
});

PiecePreview.displayName = 'PiecePreview';

// Next queue component
interface NextQueueProps {
  pieces: TetrominoType[];
  count?: number;
}

export const NextQueue = memo<NextQueueProps>(({ pieces, count = 5 }) => {
  const displayPieces = useMemo(() => pieces.slice(0, count), [pieces, count]);
  
  return (
    <div className={styles.queue}>
      <span className={styles.queueLabel}>NEXT</span>
      <div className={styles.queueList}>
        {displayPieces.map((type, index) => (
          <PiecePreview
            key={`${index}-${type}`}
            type={type}
            size={index === 0 ? 'normal' : 'small'}
          />
        ))}
      </div>
    </div>
  );
});

NextQueue.displayName = 'NextQueue';

// Hold piece component
interface HoldPieceProps {
  type: TetrominoType | null;
  canHold: boolean;
}

export const HoldPiece = memo<HoldPieceProps>(({ type, canHold }) => {
  return (
    <PiecePreview
      type={type}
      label="HOLD"
      disabled={!canHold}
    />
  );
});

HoldPiece.displayName = 'HoldPiece';

export default PiecePreview;
