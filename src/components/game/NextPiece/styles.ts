import styled, { css } from 'styled-components';
import { animations } from '../../../styles/animations';

export const NextPieceContainer = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.game.surface};
  border: 2px solid ${({ theme }) => theme.colors.game.border};
  border-radius: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  min-width: 160px;
  box-shadow: ${({ theme }) => theme.effects.shadows.container};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) => theme.effects.gradients.surface};
    opacity: 0.1;
  }
`;

export const NextPiecesStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const PiecePreviewContainer = styled.div<{ $isNext?: boolean }>`
  position: relative;
  height: ${({ $isNext }) => $isNext ? '100px' : '80px'};
  background: ${({ theme }) => theme.colors.game.background};
  border-radius: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm};
  transition: all ${({ theme }) => theme.effects.animations.duration.normal} ease-in-out;

  ${({ $isNext }) => $isNext && css`
    border: 1px solid rgba(255, 255, 255, 0.1);
  `}

  &:hover {
    transform: translateX(4px);
  }
`;

export const PreviewTitle = styled.h2`
  position: absolute;
  top: -${({ theme }) => theme.spacing.lg};
  left: 0;
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.ui.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

export const PieceWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  
  svg {
    ${({ theme }) => css`
      animation: ${animations.piece.enter} ${theme.effects.animations.duration.normal} 
        ${theme.effects.animations.easing.bounce};
    `}
  }

  &:hover svg {
    ${css`
      animation: ${animations.piece.float} 3s infinite ease-in-out;
    `}
  }
`; 