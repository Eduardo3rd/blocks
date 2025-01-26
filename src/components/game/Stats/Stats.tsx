import { GameState } from '../../../utils/types';

interface StatsProps {
  gameState: GameState;
}

export const Stats: React.FC<StatsProps> = ({ gameState }) => {
  return (
    <div className="bg-[#000033] border-2 border-blue-500 p-4 rounded">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-8">
          <div>
            <div className="text-blue-500 text-sm pixel-text">LINES</div>
            <div className="text-white text-xl pixel-text">{gameState.linesCleared}</div>
          </div>
          
          <div>
            <div className="text-blue-500 text-sm pixel-text">LEVEL</div>
            <div className="text-white text-xl pixel-text">{gameState.level}</div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-blue-500 text-sm pixel-text">SCORE</div>
          <div className="text-white text-xl pixel-text">{gameState.score}</div>
        </div>

        <div className="flex flex-col items-center">
          {gameState.combo > 1 && (
            <div className="text-yellow-500 pixel-text animate-bounce text-center">
              <div className="text-sm">COMBO</div>
              <div className="text-xl">×{gameState.combo}</div>
            </div>
          )}

          {gameState.lastTSpin !== 'none' && (
            <div className="text-purple-500 pixel-text animate-bounce text-center">
              <div className="text-xl">
                {gameState.lastTSpin === 'full' ? 'T-SPIN!' : 'MINI T-SPIN!'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 