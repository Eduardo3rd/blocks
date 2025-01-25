import styled from 'styled-components';
import { Tetromino } from '../../../utils/types';

interface HoldPieceProps {
  piece: Tetromino | null;
}

const StyledSvg = styled.svg`
  filter: drop-shadow(${({ theme }) => theme.effects.shadows.piece});
`;

const Block = styled.g`
  .block-base {
    fill: ${({ color }) => color};
    stroke: rgba(0, 0, 0, 0.3);
    stroke-width: 2;
  }
  
  .block-highlight {
    fill: url(#pieceGradient);
    opacity: 0.5;
  }
  
  .block-inner {
    fill: none;
    stroke: rgba(255, 255, 255, 0.3);
    stroke-width: 1;
  }
`;

export const HoldPiece: React.FC<HoldPieceProps> = ({ piece }) => {
  if (!piece) return null;

  const blockSize = 25;
  const padding = 10;
  const width = 4 * blockSize + 2 * padding;
  const height = 4 * blockSize + 2 * padding;

  return (
    <StyledSvg width={width} height={height} className="piece-animation">
      <defs>
        <linearGradient id="pieceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.2)" />
        </linearGradient>
      </defs>
      {piece.shape.map((row, y) =>
        row.map((cell, x) => {
          if (!cell) return null;
          return (
            <Block key={`${x}-${y}`} color={piece.color}>
              {/* Base block */}
              <rect
                className="block-base"
                x={x * blockSize + padding}
                y={y * blockSize + padding}
                width={blockSize}
                height={blockSize}
              />
              {/* Gradient overlay */}
              <rect
                className="block-highlight"
                x={x * blockSize + padding}
                y={y * blockSize + padding}
                width={blockSize}
                height={blockSize}
              />
              {/* Inner highlight */}
              <rect
                className="block-inner"
                x={x * blockSize + padding + 2}
                y={y * blockSize + padding + 2}
                width={blockSize - 4}
                height={blockSize - 4}
              />
            </Block>
          );
        })
      )}
    </StyledSvg>
  );
}; 