import { Tetromino } from '../../../utils/types';
import { HoldContainer, HoldTitle, PieceWrapper } from './styles';
import { PieceRenderer } from '../Board/PieceRenderer';

interface HoldAreaProps {
  piece: Tetromino | null;
}

export const HoldArea: React.FC<HoldAreaProps> = ({ piece }) => {
  return (
    <HoldContainer>
      <HoldTitle>Hold</HoldTitle>
      <PieceWrapper>
        {piece && <PieceRenderer piece={piece} scale={0.8} />}
      </PieceWrapper>
    </HoldContainer>
  );
}; 