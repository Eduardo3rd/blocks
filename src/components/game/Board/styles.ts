import styled, { keyframes, css } from 'styled-components';

const appear = keyframes`
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

const glow = keyframes`
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.2);
  }
`;

export const BoardContainer = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.game.surface};
  border: 2px solid ${({ theme }) => theme.colors.game.border};
  border-radius: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.effects.shadows.container};
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) => theme.effects.gradients.surface};
    opacity: 0.1;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(10, ${({ theme }) => theme.spacing.block});
  gap: ${({ theme }) => theme.spacing.grid};
  background: ${({ theme }) => theme.colors.game.background};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.spacing.xs};
`;

export const Cell = styled.div<{ $color?: string; $isGhost?: boolean }>`
  width: ${({ theme }) => theme.spacing.block};
  height: ${({ theme }) => theme.spacing.block};
  background: ${({ $color }) => $color || 'transparent'};
  border: ${({ theme, $color, $isGhost }) => 
    $color 
      ? $isGhost 
        ? `2px dashed ${$color}`
        : 'none'
      : `1px solid ${theme.colors.game.border}`};
  position: relative;
  transition: all ${({ theme }) => theme.effects.animations.duration.fast} ease-in-out;
  ${({ theme }) => css`
    animation: ${appear} ${theme.effects.animations.duration.normal} 
      ${theme.effects.animations.easing.bounce};
  `}
  
  ${({ $color, theme, $isGhost }) => $color && !$isGhost && css`
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: ${theme.effects.gradients.piece};
      opacity: 0.5;
      animation: ${glow} 2s ease-in-out infinite;
    }

    &::after {
      content: '';
      position: absolute;
      inset: 2px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 2px;
    }
  `}
`; 