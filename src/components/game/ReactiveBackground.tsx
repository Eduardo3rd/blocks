// =============================================================================
// REACTIVE BACKGROUND - Project Synesthesia
// Dynamic background that responds to game state
// =============================================================================

import React, { memo, useEffect, useState, useRef } from 'react';
import styles from './ReactiveBackground.module.css';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ReactiveBackgroundProps {
  level: number;
  isZoneActive: boolean;
  isPaused: boolean;
  isLineClear: boolean;  // True briefly when lines are cleared
  intensity?: number;     // 0-1, overall effect intensity
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ReactiveBackground = memo<ReactiveBackgroundProps>(({
  level,
  isZoneActive,
  isPaused,
  isLineClear,
  intensity = 1,
}) => {
  const [pulseActive, setPulseActive] = useState(false);
  
  // Trigger pulse on line clear
  useEffect(() => {
    if (isLineClear) {
      setPulseActive(true);
      const timeout = setTimeout(() => setPulseActive(false), 300);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [isLineClear]);
  
  // Calculate intensity based on level (higher level = more intense)
  const levelIntensity = Math.min(level / 20, 1);
  
  // Build class names based on state
  const containerClasses = [
    styles.background,
    isZoneActive && styles.zoneMode,
    isPaused && styles.paused,
    pulseActive && styles.pulse,
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={containerClasses}
      style={{
        '--level-intensity': levelIntensity,
        '--effect-intensity': intensity,
      } as React.CSSProperties}
    >
      {/* Nebula layers */}
      <div className={styles.nebula1} />
      <div className={styles.nebula2} />
      <div className={styles.nebula3} />
      
      {/* Star field */}
      <div className={styles.stars1} />
      <div className={styles.stars2} />
      
      {/* Glow overlay for line clear pulse */}
      <div className={styles.pulseOverlay} />
      
      {/* Zone mode desaturation overlay */}
      {isZoneActive && <div className={styles.zoneOverlay} />}
    </div>
  );
});

ReactiveBackground.displayName = 'ReactiveBackground';

export default ReactiveBackground;
