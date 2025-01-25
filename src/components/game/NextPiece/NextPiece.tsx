import { Tetromino } from '../../../utils/types';
import { 
  NextPieceContainer, 
  NextPiecesStack, 
  PiecePreviewContainer,
  PreviewTitle,
  PieceWrapper 
} from './styles';
import { PieceRenderer } from '../Board/PieceRenderer';
import { useMemo } from 'react';

interface NextPieceProps {
  pieces: Tetromino[];
  previewCount?: number;
}

export const NextPiece: React.FC<NextPieceProps> = ({ pieces, previewCount = 3 }) => {
  // Validate input
  if (!Array.isArray(pieces) || pieces.length === 0) {
    return null;
  }

  // Memoize the preview pieces to prevent unnecessary re-renders
  const previewPieces = useMemo(() => {
    return pieces
      .slice(0, Math.min(previewCount, pieces.length))
      .map(piece => ({
        ...piece,
        position: { x: 0, y: 0 } // Reset position for preview
      }));
  }, [pieces, previewCount]);

  return (
    <NextPieceContainer>
      <PreviewTitle>Next</PreviewTitle>
      <NextPiecesStack>
        {previewPieces.map((piece, index) => (
          <PiecePreviewContainer 
            key={`${piece.type}-${index}-${piece.rotationState}`} 
            $isNext={index === 0}
          >
            <PieceWrapper>
              <PieceRenderer 
                piece={piece} 
                scale={index === 0 ? 0.8 : 0.6} 
              />
            </PieceWrapper>
          </PiecePreviewContainer>
        ))}
      </NextPiecesStack>
    </NextPieceContainer>
  );
}; 