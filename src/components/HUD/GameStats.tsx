// =============================================================================
// TETRIS EFFECT CLONE - GAME STATS COMPONENT
// Displays score, level, lines, and clear info
// Optimized with memoization
// =============================================================================

import React, { memo, useMemo } from 'react';
import { GameState } from '../../engine/types';
import { getClearTypeName } from '../../systems/ScoringSystem';
import styles from './GameStats.module.css';

interface GameStatsProps {
  score: number;
  level: number;
  linesCleared: number;
  combo: number;
  backToBack: boolean;
  lastClear: GameState['lastClear'];
}

export const GameStats = memo<GameStatsProps>(({
  score,
  level,
  linesCleared,
  combo,
  backToBack,
  lastClear,
}) => {
  // Memoize clear info to avoid recalculating
  const clearInfo = useMemo(() => {
    if (!lastClear) return null;
    return {
      typeName: getClearTypeName(lastClear.type),
      score: lastClear.score,
      timestamp: lastClear.timestamp,
    };
  }, [lastClear?.type, lastClear?.score, lastClear?.timestamp]);
  
  return (
    <div className={styles.stats}>
      <div className={styles.statGroup}>
        <span className={styles.label}>SCORE</span>
        <span className={styles.value}>{score.toLocaleString()}</span>
      </div>
      
      <div className={styles.statGroup}>
        <span className={styles.label}>LEVEL</span>
        <span className={styles.value}>{level}</span>
      </div>
      
      <div className={styles.statGroup}>
        <span className={styles.label}>LINES</span>
        <span className={styles.value}>{linesCleared}</span>
      </div>
      
      {/* Clear info - only show if we have recent clear data */}
      <div className={styles.clearInfo}>
        {clearInfo && (
          <>
            <span className={styles.clearType}>
              {clearInfo.typeName}
            </span>
            {backToBack && (
              <span className={styles.backToBack}>
                BACK-TO-BACK
              </span>
            )}
            {combo > 1 && (
              <span className={styles.combo}>
                {combo} COMBO
              </span>
            )}
            <span className={styles.clearScore}>
              +{clearInfo.score.toLocaleString()}
            </span>
          </>
        )}
      </div>
    </div>
  );
});

GameStats.displayName = 'GameStats';

// Zone meter component with 4 segments like Tetris Effect
interface ZoneMeterProps {
  meter: number;  // 0.0-1.0 (fractional)
  isActive: boolean;
  timeRemaining?: number;
  linesCleared?: number;
  maxTime?: number;  // For calculating time percentage
}

// Individual segment component
const ZoneSegment = memo<{ filled: boolean; index: number }>(({ filled, index }) => {
  const segmentClass = filled 
    ? `${styles.zoneSegment} ${styles.segmentFilled}` 
    : styles.zoneSegment;
  
  return <div className={segmentClass} style={{ animationDelay: `${index * 0.1}s` }} />;
});

ZoneSegment.displayName = 'ZoneSegment';

export const ZoneMeter = memo<ZoneMeterProps>(({
  meter,
  isActive,
  timeRemaining = 0,
  linesCleared = 0,
  maxTime = 0,
}) => {
  // Convert fractional meter (0-1) to percentage for display
  const meterPercent = meter * 100;
  const isFull = meter >= 1.0;
  const displayTime = Math.ceil(timeRemaining / 1000);
  
  // Calculate which segments are filled (4 segments, 25% each)
  const filledSegments = Math.floor(meterPercent / 25);
  
  // Build class name based on state
  let meterClassName = styles.zoneMeter;
  if (isActive) {
    meterClassName += ` ${styles.zoneActive}`;
  } else if (isFull) {
    meterClassName += ` ${styles.zoneReady}`;
  }
  
  return (
    <div className={meterClassName}>
      <span className={styles.zoneLabel}>ZONE</span>
      
      {isActive ? (
        <div className={styles.zoneInfo}>
          <span className={styles.zoneTime}>
            {displayTime}s
          </span>
          <span className={styles.zoneLines}>
            {linesCleared} LINES
          </span>
        </div>
      ) : (
        <div className={styles.segmentContainer}>
          {[0, 1, 2, 3].map((index) => (
            <ZoneSegment 
              key={index} 
              filled={index < filledSegments} 
              index={index}
            />
          ))}
        </div>
      )}
      
      {isFull && !isActive && (
        <span className={styles.zoneReady}>READY!</span>
      )}
    </div>
  );
});

ZoneMeter.displayName = 'ZoneMeter';

export default GameStats;
