import { GameState } from '../../../utils/types';
import { StatsContainer, StatItem, StatLabel, StatValue, Highlight } from './styles';

interface StatsProps {
  gameState: GameState;
}

export const Stats: React.FC<StatsProps> = ({ gameState }) => {
  return (
    <StatsContainer>
      <StatItem>
        <StatLabel>Lines</StatLabel>
        <StatValue>{gameState.linesCleared}</StatValue>
      </StatItem>
      
      <StatItem>
        <StatLabel>Level</StatLabel>
        <StatValue>{gameState.level}</StatValue>
      </StatItem>
      
      <StatItem>
        <StatLabel>Score</StatLabel>
        <StatValue>{gameState.score}</StatValue>
      </StatItem>

      {gameState.combo > 1 && (
        <Highlight $type="combo">
          <StatLabel>Combo</StatLabel>
          <StatValue>×{gameState.combo}</StatValue>
        </Highlight>
      )}

      {gameState.lastTSpin !== 'none' && (
        <Highlight $type="tspin">
          <StatValue>
            {gameState.lastTSpin === 'full' ? 'T-SPIN!' : 'MINI T-SPIN!'}
          </StatValue>
        </Highlight>
      )}
    </StatsContainer>
  );
}; 