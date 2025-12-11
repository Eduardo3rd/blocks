// =============================================================================
// ABXY BUTTONS COMPONENT
// PS5-style button layout in cross pattern
// Square/Y (left) - Triangle/X (top) - Circle/A (right) - Cross/B (bottom)
// =============================================================================

import React, { useCallback } from 'react';
import { InputAction } from '../../../engine/types';
import styles from './Controls.module.css';

interface ABXYButtonsProps {
  onInput: (action: InputAction) => void;
  disabled?: boolean;
}

// Button to action mapping (PS5 Tetris Effect style)
const buttonActions: Record<string, InputAction> = {
  A: 'rotateCW',      // Circle (right) - Rotate Clockwise
  B: 'rotateCCW',     // Cross (bottom) - Rotate Counter-Clockwise
  X: 'zone',          // Triangle (top) - Activate Zone
  Y: 'hold',          // Square (left) - Hold piece
};

export const ABXYButtons: React.FC<ABXYButtonsProps> = ({ onInput, disabled = false }) => {
  // Handle button press
  const handlePress = useCallback((button: keyof typeof buttonActions) => {
    if (disabled) return;

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    const action = buttonActions[button];
    if (action) {
      onInput(action);
    }
  }, [onInput, disabled]);

  // Touch handlers
  const createTouchHandlers = (button: keyof typeof buttonActions) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      handlePress(button);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
    },
  });

  return (
    <div className={styles.abxyContainer}>
      {/* X button - Top (Triangle) */}
      <button
        className={`${styles.abxyButton} ${styles.buttonX}`}
        {...createTouchHandlers('X')}
        disabled={disabled}
        aria-label="Activate Zone"
      >
        <span className={styles.buttonLabel}>X</span>
      </button>

      {/* Y button - Left (Square) */}
      <button
        className={`${styles.abxyButton} ${styles.buttonY}`}
        {...createTouchHandlers('Y')}
        disabled={disabled}
        aria-label="Hold Piece"
      >
        <span className={styles.buttonLabel}>Y</span>
      </button>

      {/* A button - Right */}
      <button
        className={`${styles.abxyButton} ${styles.buttonA}`}
        {...createTouchHandlers('A')}
        disabled={disabled}
        aria-label="Rotate Clockwise"
      >
        <span className={styles.buttonLabel}>A</span>
      </button>

      {/* B button - Bottom */}
      <button
        className={`${styles.abxyButton} ${styles.buttonB}`}
        {...createTouchHandlers('B')}
        disabled={disabled}
        aria-label="Rotate Counter-Clockwise"
      >
        <span className={styles.buttonLabel}>B</span>
      </button>
    </div>
  );
};

export default ABXYButtons;
