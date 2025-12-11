// =============================================================================
// SYSTEM BUTTONS COMPONENT
// Start (pause) and Zone buttons
// =============================================================================

import React, { useCallback } from 'react';
import { InputAction } from '../../../engine/types';
import styles from './Controls.module.css';

interface SystemButtonsProps {
  onInput: (action: InputAction) => void;
  disabled?: boolean;
}

export const SystemButtons: React.FC<SystemButtonsProps> = ({ 
  onInput, 
  disabled = false 
}) => {
  // Handle button press
  const handlePress = useCallback((action: InputAction) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    onInput(action);
  }, [onInput]);

  // Touch handlers
  const createTouchHandlers = (action: InputAction) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      handlePress(action);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
    },
  });

  return (
    <div className={styles.systemButtons}>
      {/* Zone button - Activate Zone */}
      <button
        className={`${styles.systemButton} ${styles.zoneButton}`}
        {...createTouchHandlers('zone')}
        disabled={disabled}
        aria-label="Zone - Activate Zone"
      >
        <span className={styles.systemLabel}>ZONE</span>
      </button>

      {/* Start button - Pause */}
      <button
        className={`${styles.systemButton} ${styles.startButton}`}
        {...createTouchHandlers('pause')}
        aria-label="Start - Pause"
      >
        <span className={styles.systemLabel}>START</span>
      </button>

      {/* Power LED indicator */}
      <div className={styles.powerLed} />
    </div>
  );
};

export default SystemButtons;
