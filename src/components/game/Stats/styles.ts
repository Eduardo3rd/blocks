import styled from 'styled-components';
import { animations } from '../../../styles/animations';

export const StatsContainer = styled.div`
  background: ${({ theme }) => theme.colors.game.surface};
  border-radius: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  min-width: 200px;
`;

export const StatItem = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const StatLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.ui.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

export const StatValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.title};
  color: ${({ theme }) => theme.colors.ui.text.primary};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
`;

export const Highlight = styled.div<{ $type: 'combo' | 'tspin' }>`
  color: ${({ theme, $type }) => 
    $type === 'combo' 
      ? theme.colors.brand.primary 
      : theme.colors.brand.secondary};
  animation: ${animations.piece.enter} ${({ theme }) => theme.effects.animations.duration.normal} 
    ${({ theme }) => theme.effects.animations.easing.bounce};
`; 