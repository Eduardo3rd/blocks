import { HighScores } from '../HighScores/HighScores';
import styles from './StartScreen.module.css';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div 
      className="absolute inset-0 bg-black flex items-center justify-center cursor-pointer"
      onClick={onStart}
    >
      <div className="text-center pixel-text">
        <div className="text-4xl text-blue-500 mb-8">TETRIS</div>
        <div className="text-xl text-white mb-8">Tap or Click to Start</div>
        <div className="mt-8">
          <HighScores />
        </div>
      </div>
    </div>
  );
}; 