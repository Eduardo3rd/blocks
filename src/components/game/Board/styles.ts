import styled from 'styled-components';

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
  position: relative;
  display: grid;
  grid-template-columns: repeat(10, 30px);
  gap: 1px;
  background: ${({ theme }) => theme.colors.game.background};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.spacing.xs};
  overflow: hidden; /* Ensure pieces don't overflow */
`;

export const Cell = styled.div<{ $color?: string | undefined }>`
  width: 30px;
  height: 30px;
  background: ${({ $color }) => $color || 'transparent'};
  border: 1px solid ${({ theme, $color }) => 
    $color ? 'rgba(0,0,0,0.2)' : theme.colors.game.border};
  position: relative;
  transition: all 0.15s ease-in-out;
  
  ${({ $color }) => $color && `
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%);
    }
    
    &::after {
      content: '';
      position: absolute;
      inset: 2px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 2px;
    }
  `}
`; 