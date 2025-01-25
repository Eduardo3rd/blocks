import styled from 'styled-components';
import { animations } from '../../../styles/animations';

export const HoldContainer = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.game.surface};
  border: 2px solid ${({ theme }) => theme.colors.game.border};
  border-radius: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  min-width: 160px;
  height: 160px;
  box-shadow: ${({ theme }) => theme.effects.shadows.container};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) => theme.effects.gradients.surface};
    opacity: 0.1;
  }
`;

export const HoldTitle = styled.h2`
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
    animation: ${animations.piece.enter} ${({ theme }) => theme.effects.animations.duration.normal} 
      ${({ theme }) => theme.effects.animations.easing.bounce};
  }

  &:hover svg {
    animation: ${animations.piece.float} 3s infinite ease-in-out;
  }
`; 