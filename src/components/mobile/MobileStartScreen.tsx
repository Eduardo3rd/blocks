// =============================================================================
// MOBILE START SCREEN
// Simple start screen for mobile devices
// =============================================================================

import React from 'react';
import styles from './MobileGame.module.css';

interface MobileStartScreenProps {
  onStart: () => void;
  onSettings: () => void;
}

export const MobileStartScreen: React.FC<MobileStartScreenProps> = ({ 
  onStart, 
  onSettings 
}) => {
  return (
    <div className={styles.startScreen}>
      <div className={styles.startContent}>
        <h1 className={styles.title}>TETRIS</h1>
        <p className={styles.subtitle}>EFFECT CLONE</p>
        
        <div className={styles.mobileControls}>
          <h3>CONTROLS</h3>
          <div className={styles.controlsList}>
            <div className={styles.controlItem}>
              <span className={styles.controlKey}>D-PAD</span>
              <span className={styles.controlAction}>Move / Drop</span>
            </div>
            <div className={styles.controlItem}>
              <span className={styles.controlKey}>A / B</span>
              <span className={styles.controlAction}>Rotate</span>
            </div>
            <div className={styles.controlItem}>
              <span className={styles.controlKey}>X</span>
              <span className={styles.controlAction}>Hold</span>
            </div>
            <div className={styles.controlItem}>
              <span className={styles.controlKey}>Y</span>
              <span className={styles.controlAction}>Zone</span>
            </div>
          </div>
        </div>

        <div className={styles.startButtons}>
          <button 
            className={styles.startButton}
            onClick={onStart}
          >
            START GAME
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

export default MobileStartScreen;
