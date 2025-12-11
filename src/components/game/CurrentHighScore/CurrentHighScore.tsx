import { useEffect, useState } from 'react';
import { getHighestScore } from '../../../utils/highScores';
import styles from './CurrentHighScore.module.css';

interface CurrentHighScoreProps {
  variant?: 'compact' | 'full';
  refreshInterval?: number;
}

export const CurrentHighScore: React.FC<CurrentHighScoreProps> = ({
  variant = 'compact',
  refreshInterval = 10000,
}) => {
  const [highScore, setHighScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadHighScore = async () => {
    const score = await getHighestScore();
    setHighScore(score);
    setLoading(false);
  };

  useEffect(() => {
    loadHighScore();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(loadHighScore, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className={`${styles.container} ${styles[variant]}`}>
        <span className={styles.label}>HIGH SCORE</span>
        <span className={styles.value}>---</span>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      <span className={styles.label}>🏆 HIGH SCORE</span>
      <span className={styles.value}>{highScore.toLocaleString()}</span>
    </div>
  );
};

// Hook for components that need the high score value
export const useHighScore = (refreshInterval = 10000) => {
  const [highScore, setHighScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadHighScore = async () => {
    const score = await getHighestScore();
    setHighScore(score);
    setLoading(false);
  };

  const refresh = () => {
    loadHighScore();
  };

  useEffect(() => {
    loadHighScore();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(loadHighScore, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return { highScore, loading, refresh };
};

