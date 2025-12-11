import React, { useState, useEffect, useRef } from 'react';
import styles from './GameOverModal.module.css';

interface GameOverModalProps {
  score: number;
  highScore: number;
  onSubmit: (playerName: string) => void;
  onSkip: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  onSubmit,
  onSkip,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNewHighScore = score > highScore;

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    await onSubmit(playerName.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent game controls from triggering
    e.stopPropagation();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>GAME OVER</h2>
        
        {isNewHighScore && (
          <div className={styles.newHighScore}>
            🏆 NEW HIGH SCORE! 🏆
          </div>
        )}
        
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreLabel}>YOUR SCORE</div>
          <div className={styles.scoreValue}>{score.toLocaleString()}</div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.inputLabel}>
            Enter your name for the leaderboard:
          </label>
          <input
            ref={inputRef}
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
            onKeyDown={handleKeyDown}
            placeholder="Your name"
            className={styles.input}
            maxLength={20}
            disabled={isSubmitting}
          />
          <div className={styles.buttons}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={!playerName.trim() || isSubmitting}
            >
              {isSubmitting ? 'SAVING...' : 'SUBMIT SCORE'}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className={styles.skipButton}
              disabled={isSubmitting}
            >
              SKIP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

