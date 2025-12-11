// =============================================================================
// MOBILE PAUSE SCREEN
// Pause overlay for mobile devices
// =============================================================================

import React from 'react';
import styles from './MobileGame.module.css';

interface MobilePauseScreenProps {
  score: number;
  level: number;
  lines: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResume: () => void;
  onSettings: () => void;
}

export const MobilePauseScreen: React.FC<MobilePauseScreenProps> = ({
  score,
  level,
  lines,
  soundEnabled,
  onToggleSound,
  onResume,
  onSettings,
}) => {
  return (
    <div className={styles.pauseOverlay}>
      <div className={styles.pauseContent}>
        <h2 className={styles.pauseTitle}>PAUSED</h2>

        <div className={styles.pauseStats}>
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
        </div>

        <button 
          className={styles.soundToggle}
          onClick={onToggleSound}
        >
          {soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND OFF'}
        </button>

        <div className={styles.pauseButtons}>
          <button 
            className={styles.resumeButton}
            onClick={onResume}
          >
            RESUME
          </button>
          <button 
            className={styles.settingsBtn}
            onClick={onSettings}
          >
            SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobilePauseScreen;
