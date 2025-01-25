import { GameState, TetrominoType } from '../../../utils/types';
import { BoardContainer, Grid, Cell } from './styles';
import { COLORS } from '../../../utils/constants';
import { findDropPosition } from '../../../utils/gameLogic';
import { assertValidGameState } from '../../../utils/typeAssertions';

interface BoardProps {
  gameState: GameState;
}

type DisplayCell = TetrominoType | 'ghost' | null;

export const Board: React.FC<BoardProps> = ({ gameState }) => {
  // Runtime type checking in development
  if (process.env.NODE_ENV === 'development') {
    assertValidGameState(gameState);
  }

  const { board, currentPiece } = gameState;

  // Create a display board that includes the current piece and ghost piece
  const displayBoard: DisplayCell[][] = board.map(row => [...row]);
  
  // Add ghost piece
  if (currentPiece) {
    const ghostPieceY = findDropPosition(currentPiece, board);
    
    // Only show ghost piece if it's different from current piece position
    if (ghostPieceY !== currentPiece.position.y) {
      const ghostPiece = {
        ...currentPiece,
        position: { ...currentPiece.position, y: ghostPieceY }
      };

      ghostPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = y + ghostPiece.position.y;
            const boardX = x + ghostPiece.position.x;
            if (boardY >= 0 && boardY < board.length && boardX >= 0 && boardX < board[0].length) {
              if (!displayBoard[boardY][boardX]) {
                displayBoard[boardY][boardX] = 'ghost';
              }
            }
          }
        });
      });
    }
  }

  // Add current piece
  if (currentPiece) {
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = y + currentPiece.position.y;
          const boardX = x + currentPiece.position.x;
          if (boardY >= 0 && boardY < board.length && boardX >= 0 && boardX < board[0].length) {
            displayBoard[boardY][boardX] = currentPiece.type;
          }
        }
      });
    });
  }

  const getCellColor = (cell: DisplayCell) => {
    if (!cell) return undefined;
    if (cell === 'ghost' && currentPiece) {
      return `${COLORS[currentPiece.type]}40`;
    }
    return COLORS[cell];
  };

  return (
    <BoardContainer>
      <Grid>
        {displayBoard.map((row, y) => 
          row.map((cell, x) => (
            <Cell 
              key={`${x}-${y}`}
              $color={getCellColor(cell)}
              $isGhost={cell === 'ghost'}
              data-testid={`cell-${x}-${y}`}
            />
          ))
        )}
      </Grid>
    </BoardContainer>
  );
}; 