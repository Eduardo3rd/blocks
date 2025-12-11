// =============================================================================
// D-PAD COMPONENT
// Touch-enabled directional pad with DAS/ARR support
// =============================================================================

import React, { useCallback, useRef, useEffect } from 'react';
import { InputAction } from '../../../engine/types';
import styles from './Controls.module.css';

interface DPadProps {
  onInput: (action: InputAction) => void;
  disabled?: boolean;
}

// DAS/ARR settings (matching default game settings)
const DAS = 167; // Delayed Auto Shift - initial delay before repeat
const ARR = 33;  // Auto Repeat Rate - delay between repeats

type Direction = 'up' | 'down' | 'left' | 'right';

const directionToAction: Record<Direction, InputAction> = {
  up: 'hardDrop',
  down: 'softDrop',
  left: 'moveLeft',
  right: 'moveRight',
};

// Actions that should repeat when held
const repeatableActions = new Set<InputAction>(['moveLeft', 'moveRight', 'softDrop']);

export const DPad: React.FC<DPadProps> = ({ onInput, disabled = false }) => {
  const activeDirectionRef = useRef<Direction | null>(null);
  const dasTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up timers
  const clearTimers = useCallback(() => {
    if (dasTimeoutRef.current) {
      clearTimeout(dasTimeoutRef.current);
      dasTimeoutRef.current = null;
    }
    if (arrIntervalRef.current) {
      clearInterval(arrIntervalRef.current);
      arrIntervalRef.current = null;
    }
  }, []);

  // Handle direction press
  const handlePress = useCallback((direction: Direction) => {
    if (disabled) return;

    activeDirectionRef.current = direction;
    const action = directionToAction[direction];

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    // Fire immediate action
    onInput(action);

    // Set up DAS/ARR for repeatable actions
    if (repeatableActions.has(action)) {
      clearTimers();

      // DAS: Wait before starting repeat
      dasTimeoutRef.current = setTimeout(() => {
        // ARR: Repeat at interval
        arrIntervalRef.current = setInterval(() => {
          if (activeDirectionRef.current === direction) {
            onInput(action);
          }
        }, ARR);
      }, DAS);
    }
  }, [onInput, disabled, clearTimers]);

  // Handle direction release
  const handleRelease = useCallback(() => {
    activeDirectionRef.current = null;
    clearTimers();
  }, [clearTimers]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Touch handlers with event prevention
  const createTouchHandlers = (direction: Direction) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      handlePress(direction);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      handleRelease();
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      handleRelease();
    },
  });

  return (
    <div className={styles.dpad}>
      {/* Up button */}
      <button
        className={`${styles.dpadButton} ${styles.dpadUp}`}
        {...createTouchHandlers('up')}
        disabled={disabled}
        aria-label="Hard Drop"
      >
        <span className={styles.dpadArrow}>▲</span>
      </button>

      {/* Left button */}
      <button
        className={`${styles.dpadButton} ${styles.dpadLeft}`}
        {...createTouchHandlers('left')}
        disabled={disabled}
        aria-label="Move Left"
      >
        <span className={styles.dpadArrow}>◀</span>
      </button>

      {/* Center */}
      <div className={styles.dpadCenter} />

      {/* Right button */}
      <button
        className={`${styles.dpadButton} ${styles.dpadRight}`}
        {...createTouchHandlers('right')}
        disabled={disabled}
        aria-label="Move Right"
      >
        <span className={styles.dpadArrow}>▶</span>
      </button>

      {/* Down button */}
      <button
        className={`${styles.dpadButton} ${styles.dpadDown}`}
        {...createTouchHandlers('down')}
        disabled={disabled}
        aria-label="Soft Drop"
      >
        <span className={styles.dpadArrow}>▼</span>
      </button>
    </div>
  );
};

export default DPad;
