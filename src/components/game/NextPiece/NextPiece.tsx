import { Tetromino } from '../../../utils/types';
import { 
  NextPieceContainer, 
  NextPiecesStack, 
  PiecePreviewContainer,
  PreviewTitle,
  PieceWrapper 
} from './styles';
import { PieceRenderer } from './PieceRenderer';

interface NextPieceProps {
  pieces: Tetromino[];
  previewCount?: number;
}

export const NextPiece: React.FC<NextPieceProps> = ({ pieces, previewCount = 3 }) => {
  if (!pieces.length) return null;

  return (
    <NextPieceContainer>
      <PreviewTitle>Next</PreviewTitle>
      <NextPiecesStack>
        {pieces.slice(0, previewCount).map((piece, index) => (
          <PiecePreviewContainer key={`${piece.type}-${index}`} $isNext={index === 0}>
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