import { HighScores } from '../HighScores/HighScores';
import { CurrentHighScore } from '../CurrentHighScore/CurrentHighScore';
import styles from './StartScreen.module.css';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>BLOCKS</h1>
        
        <div className={styles.highScoreSection}>
          <CurrentHighScore variant="full" />
        </div>
        
        <button 
          className={styles.startButton}
          onClick={onStart}
        >
          TAP TO START
        </button>
        
        <div className={styles.hint}>or press ENTER</div>
        
        <div className={styles.leaderboardSection}>
          <HighScores limit={10} refreshInterval={5000} />
        </div>
      </div>
    </div>
  );
}; 