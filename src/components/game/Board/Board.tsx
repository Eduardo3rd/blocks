import { GameState, TetrominoType } from '../../../utils/types';
import { COLORS } from '../../../utils/constants';
import { findDropPosition, isCollision } from '../../../utils/gameLogic';
import { isValidGameState } from '../../../utils/typeGuards';
import { BoardContainer, Grid, Cell } from './styles';
import { PieceRenderer } from './PieceRenderer';
import { useMemo } from 'react';

interface BoardProps {
  gameState: GameState;
}

const CELL_SIZE = 30;
const GRID_PADDING = 8; // Matches the padding in styles.ts
const GRID_GAP = 1;    // Matches the gap in styles.ts

export const Board: React.FC<BoardProps> = ({ gameState }) => {
  // Runtime type checking in development
  if (import.meta.env.DEV) {
    if (!isValidGameState(gameState)) {
      throw new Error('Invalid game state provided to Board component');
    }
  }

  const { board, currentPiece } = gameState;

  // Calculate ghost piece position
  const ghostPiecePosition = useMemo(() => {
    if (!currentPiece) return null;

    let testY = currentPiece.position.y;
    
    // Keep moving down until we hit something
    while (testY < board.length) {
      if (isCollision(board, currentPiece, { ...currentPiece.position, y: testY + 1 })) {
        break;
      }
      testY++;
    }

    return testY;
  }, [currentPiece, board]);

  // Calculate piece position including grid padding and gaps
  const calculatePosition = (x: number, y: number) => ({
    left: `${GRID_PADDING + (x * (CELL_SIZE + GRID_GAP))}px`,
    top: `${GRID_PADDING + (y * (CELL_SIZE + GRID_GAP))}px`
  });

  return (
    <BoardContainer>
      <Grid>
        {/* Render placed pieces */}
        {board.map((row, y) => 
          row.map((cell, x) => (
            <Cell 
              key={`${x}-${y}`}
              $color={cell ? COLORS[cell] : undefined}
              data-testid={`cell-${x}-${y}`}
            />
          ))
        )}

        {/* Render ghost piece */}
        {currentPiece && ghostPiecePosition !== null && ghostPiecePosition !== currentPiece.position.y && (
          <div
            style={{
              position: 'absolute',
              ...calculatePosition(currentPiece.position.x, ghostPiecePosition),
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            <PieceRenderer
              piece={{
                ...currentPiece,
                position: { ...currentPiece.position, y: ghostPiecePosition }
              }}
              ghost={true}
              scale={1}
            />
          </div>
        )}

        {/* Render active piece */}
        {currentPiece && (
          <div
            style={{
              position: 'absolute',
              ...calculatePosition(currentPiece.position.x, currentPiece.position.y),
              pointerEvents: 'none',
              zIndex: 2
            }}
          >
            <PieceRenderer
              piece={currentPiece}
              scale={1}
            />
          </div>
        )}
      </Grid>
    </BoardContainer>
  );
}; 