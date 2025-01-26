import { Tetromino } from '../../../utils/types';
import { PieceRenderer } from '../Board/PieceRenderer';

interface HoldAreaProps {
  piece: Tetromino | null;
}

export const HoldArea: React.FC<HoldAreaProps> = ({ piece }) => {
  return (
    <div className="bg-[#000033] border-2 border-blue-500 p-3 rounded">
      <div className="text-blue-500 text-center mb-1 text-xs pixel-text">HOLD</div>
      <div className="flex items-center justify-center h-[45px]">
        {piece && <PieceRenderer piece={piece} scale={0.6} />}
      </div>
    </div>
  );
}; 