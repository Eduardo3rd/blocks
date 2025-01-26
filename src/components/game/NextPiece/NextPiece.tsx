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
  isMobile?: boolean;
}

export const NextPiece: React.FC<NextPieceProps> = ({ pieces, previewCount = 3, isMobile = false }) => {
  // Validate input
  if (!Array.isArray(pieces) || pieces.length === 0) {
    return null;
  }

  // Memoize the preview pieces to prevent unnecessary re-renders
  const previewPieces = useMemo(() => {
    const count = isMobile ? 1 : previewCount;
    return pieces
      .slice(0, Math.min(count, pieces.length))
      .map(piece => ({
        ...piece,
        position: { x: 0, y: 0 } // Reset position for preview
      }));
  }, [pieces, previewCount, isMobile]);

  return (
    <div className={`bg-[#000033] border-2 border-blue-500 rounded ${isMobile ? 'p-3' : 'p-4'}`}>
      <div className={`text-blue-500 text-center mb-1 pixel-text ${isMobile ? 'text-xs' : ''}`}>NEXT</div>
      <div className="flex flex-col items-center">
        {previewPieces.map((piece, index) => (
          <div key={index} className={`flex items-center justify-center ${isMobile ? 'h-[45px]' : 'h-[60px]'}`}>
            <PieceRenderer piece={piece} scale={isMobile ? 0.6 : 0.8} />
          </div>
        ))}
      </div>
    </div>
  );
}; 