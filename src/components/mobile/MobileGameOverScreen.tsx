// =============================================================================
// MOBILE GAME OVER SCREEN
// Game over screen with score submission for mobile
// =============================================================================

import React, { useState } from 'react';
import styles from './MobileGame.module.css';

interface SessionStats {
  totalClears: number;
  tetrisCount: number;
  tSpinCount: number;
  longestCombo: number;
  perfectClears: number;
  piecesPlaced: number;
  playTime: number;
}

interface MobileGameOverScreenProps {
  score: number;
  level: number;
  lines: number;
  stats: SessionStats;
  onSubmit: (name: string) => void;
  onSkip: () => void;
}

export const MobileGameOverScreen: React.FC<MobileGameOverScreenProps> = ({
  score,
  level,
  lines,
  stats,
  onSubmit,
  onSkip,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tetrisRate = stats.totalClears > 0 
    ? Math.round((stats.tetrisCount / stats.totalClears) * 100) 
    : 0;

  const handleSubmit = async () => {
    if (playerName.trim()) {
      setIsSubmitting(true);
      await onSubmit(playerName.trim());
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.gameOverScreen}>
      <div className={styles.gameOverContent}>
        <h2 className={styles.gameOverTitle}>GAME OVER</h2>

        <div className={styles.finalStats}>
          <div className={styles.statRow}>
            <span>SCORE</span>
            <span>{score.toLocaleString()}</span>
          </div>
          <div className={styles.statRow}>
            <span>LEVEL</span>
            <span>{level}</span>
          </div>
          <div className={styles.statRow}>
            <span>LINES</span>
            <span>{lines}</span>
          </div>
          <div className={styles.statRow}>
            <span>TETRIS RATE</span>
            <span>{tetrisRate}%</span>
          </div>
        </div>

        <div className={styles.nameInput}>
          <label>ENTER YOUR NAME</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 10))}
            placeholder="YOUR NAME"
            maxLength={10}
            className={styles.textInput}
          />
        </div>

        <div className={styles.gameOverButtons}>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!playerName.trim() || isSubmitting}
          >
            {isSubmitting ? 'SAVING...' : 'SUBMIT SCORE'}
          </button>
          <button
            className={styles.skipButton}
            onClick={onSkip}
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileGameOverScreen;
