// =============================================================================
// BLOCKS - GAME BOARD COMPONENT
// Renders the game board with pieces, ghost piece, drop trail, and effects
// HIGHLY OPTIMIZED for 60fps performance
// =============================================================================

import React, { memo, useMemo } from 'react';
import { Board, Tetromino, TetrominoType, BOARD_WIDTH, VISIBLE_HEIGHT, BOARD_HEIGHT } from '../../engine/types';
import { getPieceCells, PIECE_COLORS } from '../../engine/Piece';
import styles from './GameBoard.module.css';
import minoStyles from '../../styles/Mino.module.css';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface GameBoardProps {
  board: Board;
  currentPiece: Tetromino | null;
  ghostY: number;
  isZoneActive?: boolean;
  isPaused?: boolean;
  zoneLinesCleared?: number;
}

interface MinoProps {
  color: string;
  isGhost?: boolean;
  isCurrent?: boolean;
}

// Cell size in pixels (must match CSS)
const CELL_SIZE = 26;
const CELL_GAP = 1;

// Pre-allocated reusable data structures to avoid GC
const EMPTY_SET = new Set<string>();

// -----------------------------------------------------------------------------
// Memoized Mino (Single Block) Component
// -----------------------------------------------------------------------------

const Mino = memo<MinoProps>(({ color, isGhost, isCurrent }) => {
  const classNames = `${minoStyles.mino} ${minoStyles.filled}${isCurrent ? ` ${minoStyles.current}` : ''}${isGhost ? ` ${minoStyles.ghost}` : ''}`;
  
  const style: React.CSSProperties = {
    backgroundColor: isGhost ? undefined : color,
    '--mino-color': color,
  } as React.CSSProperties;
  
  return <div className={classNames} style={style} />;
});

Mino.displayName = 'Mino';

// -----------------------------------------------------------------------------
// Memoized Empty Cell Component
// -----------------------------------------------------------------------------

const EmptyCell = memo(() => {
  return <div className={styles.emptyCell} />;
});

EmptyCell.displayName = 'EmptyCell';

// -----------------------------------------------------------------------------
// Memoized Row Component
// -----------------------------------------------------------------------------

interface RowProps {
  y: number;
  rowData: (TetrominoType | null)[];
  currentPieceCells: Set<string>;
  ghostCells: Set<string>;
  currentPieceType: TetrominoType | null;
  isZoneLine?: boolean;
}

// Color for zone lines - bright white/silver to distinguish from regular pieces
const ZONE_LINE_COLOR = '#e8e8e8';

const BoardRow = memo<RowProps>(({ y, rowData, currentPieceCells, ghostCells, currentPieceType, isZoneLine }) => {
  const cells: React.ReactNode[] = [];
  
  for (let x = 0; x < BOARD_WIDTH; x++) {
    const cellKey = `${x},${y}`;
    const boardCell = rowData[x] ?? null;
    
    const isCurrentPiece = currentPieceCells.has(cellKey);
    const isGhostPiece = !isCurrentPiece && ghostCells.has(cellKey);
    
    // Determine cell type
    let cellType: TetrominoType | null = boardCell;
    if (isCurrentPiece && currentPieceType !== null) {
      cellType = currentPieceType;
    } else if (isGhostPiece && currentPieceType !== null) {
      cellType = currentPieceType;
    }
    
    // Render cell
    if (cellType === null && !isGhostPiece) {
      cells.push(<EmptyCell key={x} />);
    } else {
      // Use zone line color for cells in zone lines, otherwise use normal piece color
      const color = isZoneLine && boardCell !== null 
        ? ZONE_LINE_COLOR 
        : (cellType !== null ? PIECE_COLORS[cellType] : '#888');
      cells.push(
        <Mino
          key={x}
          color={color}
          isGhost={isGhostPiece}
          isCurrent={isCurrentPiece}
        />
      );
    }
  }
  
  return <div className={minoStyles.row}>{cells}</div>;
});

BoardRow.displayName = 'BoardRow';

// -----------------------------------------------------------------------------
// Drop Trail Component - Vertical beam from piece to ghost
// -----------------------------------------------------------------------------

interface DropTrailProps {
  currentPiece: Tetromino;
  ghostY: number;
  color: string;
}

const DropTrail = memo<DropTrailProps>(({ currentPiece, ghostY, color }) => {
  const cells = getPieceCells(currentPiece);
  const visibleOffset = BOARD_HEIGHT - VISIBLE_HEIGHT;
  
  // Get the bottom-most Y of current piece cells and top-most Y of ghost
  const currentBottomCells = new Map<number, number>(); // x -> bottomY
  
  cells.forEach(cell => {
    const visibleY = cell.y - visibleOffset;
    const existing = currentBottomCells.get(cell.x);
    if (existing === undefined || visibleY > existing) {
      currentBottomCells.set(cell.x, visibleY);
    }
  });
  
  const ghostCells = getPieceCells({ ...currentPiece, position: { x: currentPiece.position.x, y: ghostY } });
  const ghostTopCells = new Map<number, number>(); // x -> topY
  
  ghostCells.forEach(cell => {
    const visibleY = cell.y - visibleOffset;
    const existing = ghostTopCells.get(cell.x);
    if (existing === undefined || visibleY < existing) {
      ghostTopCells.set(cell.x, visibleY);
    }
  });
  
  // Create trail beams for each column
  const trails: React.ReactNode[] = [];
  
  currentBottomCells.forEach((bottomY, x) => {
    const topY = ghostTopCells.get(x);
    if (topY === undefined) return;
    
    const startY = bottomY + 1;
    const endY = topY;
    
    if (startY >= endY) return; // No gap to fill
    
    const left = x * (CELL_SIZE + CELL_GAP) + 2; // +2 for board padding
    const top = startY * (CELL_SIZE + CELL_GAP) + 2;
    const height = (endY - startY) * (CELL_SIZE + CELL_GAP);
    
    trails.push(
      <div
        key={x}
        className={styles.dropTrailBeam}
        style={{
          left: `${left}px`,
          top: `${top}px`,
          height: `${height}px`,
          '--trail-color': color,
        } as React.CSSProperties}
      />
    );
  });
  
  return <div className={styles.dropTrail}>{trails}</div>;
});

DropTrail.displayName = 'DropTrail';

// -----------------------------------------------------------------------------
// GameBoard Component
// -----------------------------------------------------------------------------

export const GameBoard: React.FC<GameBoardProps> = memo(({
  board,
  currentPiece,
  ghostY,
  isZoneActive = false,
  isPaused = false,
  zoneLinesCleared = 0,
}) => {
  // Extract stable primitive values for memoization
  const pieceX = currentPiece?.position.x ?? -1;
  const pieceY = currentPiece?.position.y ?? -1;
  const pieceRotation = currentPiece?.rotation ?? 0;
  const pieceType = currentPiece?.type ?? null;
  
  // Calculate current piece cells - OPTIMIZED: stable primitive deps
  const currentPieceCells = useMemo(() => {
    if (!currentPiece) return EMPTY_SET;
    
    const set = new Set<string>();
    const cells = getPieceCells(currentPiece);
    const offset = BOARD_HEIGHT - VISIBLE_HEIGHT;
    for (const c of cells) {
      set.add(`${c.x},${c.y - offset}`);
    }
    return set;
  }, [pieceX, pieceY, pieceRotation, pieceType, currentPiece]);
  
  // Calculate ghost piece cells - OPTIMIZED: stable primitive deps
  const ghostCells = useMemo(() => {
    if (!currentPiece || ghostY === pieceY) return EMPTY_SET;
    
    const set = new Set<string>();
    const cells = getPieceCells({ ...currentPiece, position: { x: pieceX, y: ghostY } });
    const offset = BOARD_HEIGHT - VISIBLE_HEIGHT;
    for (const c of cells) {
      set.add(`${c.x},${c.y - offset}`);
    }
    return set;
  }, [pieceX, pieceType, pieceRotation, pieceY, ghostY, currentPiece]);
  
  // Get piece color for drop trail
  const pieceColor = pieceType !== null ? PIECE_COLORS[pieceType] : '#00f0f0';
  
  // Check if we should show drop trail (only in Zone mode)
  const showDropTrail = isZoneActive && currentPiece && ghostY > pieceY;
  
  // Render rows
  const rows = useMemo(() => {
    const result: React.ReactNode[] = [];
    const startRow = BOARD_HEIGHT - VISIBLE_HEIGHT;
    
    // Zone lines are at the bottom of the board
    // They occupy the last `zoneLinesCleared` rows of the visible area
    const zoneLineStartRow = VISIBLE_HEIGHT - zoneLinesCleared;
    
    for (let y = 0; y < VISIBLE_HEIGHT; y++) {
      const boardY = startRow + y;
      const rowData = board[boardY] || [];
      
      // Check if this row is a zone line (in the bottom N rows)
      const isZoneLine = isZoneActive && y >= zoneLineStartRow;
      
      result.push(
        <BoardRow
          key={y}
          y={y}
          rowData={rowData}
          currentPieceCells={currentPieceCells}
          ghostCells={ghostCells}
          currentPieceType={pieceType}
          isZoneLine={isZoneLine}
        />
      );
    }
    
    return result;
  }, [board, currentPieceCells, ghostCells, pieceType, zoneLinesCleared, isZoneActive]);
  
  const boardClassName = isZoneActive 
    ? `${styles.board} ${styles.zoneActive}` 
    : styles.board;
  
  const wrapperClassName = isZoneActive
    ? `${styles.boardWrapper} ${styles.zoneActive}`
    : styles.boardWrapper;
  
  return (
    <div className={wrapperClassName}>
      <div className={boardClassName}>
        {/* Drop trail effect */}
        {showDropTrail && currentPiece && (
          <DropTrail
            currentPiece={currentPiece}
            ghostY={ghostY}
            color={pieceColor}
          />
        )}
        
        <div className={styles.grid}>
          {rows}
        </div>
        
        {isPaused && (
          <div className={styles.overlay}>
            <span className={styles.pauseText}>PAUSED</span>
          </div>
        )}
      </div>
    </div>
  );
});

GameBoard.displayName = 'GameBoard';

export default GameBoard;
