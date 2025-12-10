// =============================================================================
// TETRIS GAME - MAIN GAME COMPONENT
// Classic 90s aesthetic with modern gameplay mechanics
// =============================================================================

import React, { useEffect, useCallback, useState } from 'react';
import { useGameEngine } from '../../hooks/useGameEngine';
import { GameBoard } from '../Board/GameBoard';
import { HoldPiece, NextQueue } from '../HUD/PiecePreview';
import { GameStats, ZoneMeter } from '../HUD/GameStats';
import { GameEvent, StageInfo, ClearType } from '../../engine/types';
import { useGameAudio } from '../../systems/AudioSystem';
import styles from './TetrisGame.module.css';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface TetrisGameProps {
  stage?: StageInfo;
  onGameOver?: (score: number) => void;
}

// Session statistics for pause screen
interface SessionStats {
  totalClears: number;
  tetrisCount: number;
  tSpinCount: number;
  longestCombo: number;
  perfectClears: number;
  hardDrops: number;
  piecesPlaced: number;
  playTime: number; // in seconds
}

// -----------------------------------------------------------------------------
// Start Screen Component
// -----------------------------------------------------------------------------

const StartScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className={styles.startScreen}>
      <h1 className={styles.title}>TETRIS</h1>
      <p className={styles.subtitle}>EFFECT CLONE</p>
      
      <div className={styles.controls}>
        <h3>CONTROLS</h3>
        <ul>
          <li><span>← →</span> Move</li>
          <li><span>↓</span> Soft Drop</li>
          <li><span>SPACE</span> Hard Drop</li>
          <li><span>↑/X</span> Rotate CW</li>
          <li><span>Z</span> Rotate CCW</li>
          <li><span>C/SHIFT</span> Hold</li>
          <li><span>E</span> Zone</li>
          <li><span>ESC</span> Pause</li>
        </ul>
      </div>
      
      <button className={styles.startButton} onClick={onStart}>
        PRESS TO START
      </button>
      
      <p className={styles.hint}>Or press ENTER</p>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Enhanced Pause Screen Component
// -----------------------------------------------------------------------------

interface PauseScreenProps {
  stats: SessionStats;
  score: number;
  level: number;
  lines: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResume: () => void;
}

const PauseScreen: React.FC<PauseScreenProps> = ({
  stats,
  score,
  level,
  lines,
  soundEnabled,
  onToggleSound,
  onResume,
}) => {
  // Calculate Tetris rate (percentage of clears that are tetrises)
  const tetrisRate = stats.totalClears > 0 
    ? Math.round((stats.tetrisCount / stats.totalClears) * 100) 
    : 0;
  
  return (
    <div className={styles.pauseOverlay}>
      <div className={styles.pauseModal}>
        <h2 className={styles.pauseTitle}>PAUSED</h2>
        
        <div className={styles.pauseStats}>
          <div className={styles.pauseStatRow}>
            <span className={styles.pauseStatLabel}>SCORE</span>
            <span className={styles.pauseStatValue}>{score.toLocaleString()}</span>
          </div>
          <div className={styles.pauseStatRow}>
            <span className={styles.pauseStatLabel}>LEVEL</span>
            <span className={styles.pauseStatValue}>{level}</span>
          </div>
          <div className={styles.pauseStatRow}>
            <span className={styles.pauseStatLabel}>LINES</span>
            <span className={styles.pauseStatValue}>{lines}</span>
          </div>
          <div className={styles.pauseStatRow}>
            <span className={styles.pauseStatLabel}>TETRIS RATE</span>
            <span className={`${styles.pauseStatValue} ${styles.accent}`}>{tetrisRate}%</span>
          </div>
        </div>
        
        {/* Sound Toggle */}
        <button 
          className={`${styles.soundToggle} ${soundEnabled ? styles.soundOn : styles.soundOff}`}
          onClick={onToggleSound}
        >
          <span className={styles.soundIcon}>{soundEnabled ? '🔊' : '🔇'}</span>
          <span className={styles.soundLabel}>SOUND {soundEnabled ? 'ON' : 'OFF'}</span>
        </button>
        
        <button className={styles.resumeButton} onClick={onResume}>
          RESUME
        </button>
        <p className={styles.pauseHint}>Press ESC to resume</p>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Game Over Screen Component
// -----------------------------------------------------------------------------

interface GameOverScreenProps {
  score: number;
  level: number;
  lines: number;
  stats: SessionStats;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  level,
  lines,
  stats,
  onRestart,
}) => {
  const tetrisRate = stats.totalClears > 0 
    ? Math.round((stats.tetrisCount / stats.totalClears) * 100) 
    : 0;
  
  return (
    <div className={styles.gameOverScreen}>
      <h2 className={styles.gameOverTitle}>GAME OVER</h2>
      
      <div className={styles.finalStats}>
        <div className={styles.finalStat}>
          <span>SCORE</span>
          <span>{score.toLocaleString()}</span>
        </div>
        <div className={styles.finalStat}>
          <span>LEVEL</span>
          <span>{level}</span>
        </div>
        <div className={styles.finalStat}>
          <span>LINES</span>
          <span>{lines}</span>
        </div>
        <div className={styles.finalStat}>
          <span>TETRIS RATE</span>
          <span>{tetrisRate}%</span>
        </div>
        <div className={styles.finalStat}>
          <span>T-SPINS</span>
          <span>{stats.tSpinCount}</span>
        </div>
      </div>
      
      <button className={styles.restartButton} onClick={onRestart}>
        PLAY AGAIN
      </button>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Game Component
// -----------------------------------------------------------------------------

export const TetrisGame: React.FC<TetrisGameProps> = ({ stage, onGameOver }) => {
  const {
    state,
    start,
    pause,
    restart,
    addEventListener,
  } = useGameEngine(stage);
  
  // Audio system - responds to game events
  const audio = useGameAudio(addEventListener, state.level, state.zone.isActive);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [hasStarted, setHasStarted] = useState(false);
  
  // Session statistics tracking
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalClears: 0,
    tetrisCount: 0,
    tSpinCount: 0,
    longestCombo: 0,
    perfectClears: 0,
    hardDrops: 0,
    piecesPlaced: 0,
    playTime: 0,
  });
  
  // Track play time
  useEffect(() => {
    if (!hasStarted || state.phase === 'paused' || state.phase === 'gameOver') return;
    
    const interval = setInterval(() => {
      setSessionStats(prev => ({
        ...prev,
        playTime: prev.playTime + 1,
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [hasStarted, state.phase]);
  
  // Helper to check if clear type is a T-spin
  const isTSpin = (type: ClearType): boolean => {
    return type.includes('tSpin');
  };
  
  // Handle game start
  const handleStart = useCallback(() => {
    setHasStarted(true);
    setSessionStats({
      totalClears: 0,
      tetrisCount: 0,
      tSpinCount: 0,
      longestCombo: 0,
      perfectClears: 0,
      hardDrops: 0,
      piecesPlaced: 0,
      playTime: 0,
    });
    start();
  }, [start]);
  
  // Handle restart
  const handleRestart = useCallback(() => {
    setSessionStats({
      totalClears: 0,
      tetrisCount: 0,
      tSpinCount: 0,
      longestCombo: 0,
      perfectClears: 0,
      hardDrops: 0,
      piecesPlaced: 0,
      playTime: 0,
    });
    restart(stage);
    start();
  }, [restart, start, stage]);
  
  // Handle resume from pause
  const handleResume = useCallback(() => {
    pause();
  }, [pause]);
  
  // Handle sound toggle
  const handleToggleSound = useCallback(() => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    audio.setEnabled(newEnabled);
  }, [soundEnabled, audio]);
  
  // Listen for Enter key on start screen
  useEffect(() => {
    if (hasStarted) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        handleStart();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, handleStart]);
  
  // Listen for game events to update session stats
  useEffect(() => {
    const unsubscribe = addEventListener((event: GameEvent) => {
      switch (event.type) {
        case 'gameOver':
          onGameOver?.(event.finalScore);
          break;
          
        case 'linesCleared':
          setSessionStats(prev => ({
            ...prev,
            totalClears: prev.totalClears + 1,
            tetrisCount: prev.tetrisCount + (event.clearType === 'tetris' ? 1 : 0),
            tSpinCount: prev.tSpinCount + (isTSpin(event.clearType) ? 1 : 0),
            perfectClears: prev.perfectClears + (event.clearType === 'allClear' ? 1 : 0),
          }));
          break;
          
        case 'comboIncreased':
          setSessionStats(prev => ({
            ...prev,
            longestCombo: Math.max(prev.longestCombo, event.count),
          }));
          break;
          
        case 'pieceLocked':
          setSessionStats(prev => ({
            ...prev,
            piecesPlaced: prev.piecesPlaced + 1,
          }));
          break;
      }
    });
    
    return unsubscribe;
  }, [addEventListener, onGameOver]);
  
  // Show start screen
  if (!hasStarted) {
    return (
      <div className={styles.container}>
        <StartScreen onStart={handleStart} />
      </div>
    );
  }
  
  // Show game over screen
  if (state.phase === 'gameOver') {
    return (
      <div className={styles.container}>
        <GameOverScreen
          score={state.score}
          level={state.level}
          lines={state.linesCleared}
          stats={sessionStats}
          onRestart={handleRestart}
        />
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.gameLayout}>
        {/* Left panel - Hold, Zone, and Stats */}
        <div className={styles.leftPanel}>
          <HoldPiece
            type={state.holdPiece}
            canHold={state.canHold}
          />
          <ZoneMeter
            meter={state.zone.meter}
            isActive={state.zone.isActive}
            timeRemaining={state.zone.timeRemaining}
            stackedLines={state.zone.stackedLines}
          />
          <GameStats
            score={state.score}
            level={state.level}
            linesCleared={state.linesCleared}
            combo={state.combo.count}
            backToBack={state.combo.backToBack}
            lastClear={state.lastClear}
          />
        </div>
        
        {/* Center - Game Board */}
        <div className={styles.centerPanel}>
          <GameBoard
            board={state.board}
            currentPiece={state.currentPiece}
            ghostY={state.ghostY}
            isZoneActive={state.zone.isActive}
            isPaused={state.phase === 'paused'}
          />
        </div>
        
        {/* Right panel - Next queue */}
        <div className={styles.rightPanel}>
          <NextQueue pieces={state.nextPieces} count={5} />
        </div>
      </div>
      
      {/* Pause Screen */}
      {state.phase === 'paused' && (
        <PauseScreen
          stats={sessionStats}
          score={state.score}
          level={state.level}
          lines={state.linesCleared}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onResume={handleResume}
        />
      )}
    </div>
  );
};

export default TetrisGame;
