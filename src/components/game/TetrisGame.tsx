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
import { HighScores } from './HighScores/HighScores';
import { CurrentHighScore, useHighScore } from './CurrentHighScore/CurrentHighScore';
import { GameOverModal } from './GameOverModal/GameOverModal';
import { Settings } from './Settings/Settings';
import { saveHighScore } from '../../utils/highScores';
import { KeyBindings } from '../../utils/keyBindingsStorage';
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

interface StartScreenProps {
  onStart: () => void;
  onSettings: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, onSettings }) => {
  return (
    <div className={styles.startScreen}>
      <h1 className={styles.title}>TETRIS</h1>
      <p className={styles.subtitle}>EFFECT CLONE</p>
      
      {/* Current High Score Display */}
      <div className={styles.highScoreDisplay}>
        <CurrentHighScore variant="full" />
      </div>
      
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
      
      <div className={styles.startButtons}>
        <button className={styles.startButton} onClick={onStart}>
          PRESS TO START
        </button>
        <button className={styles.settingsButton} onClick={onSettings}>
          SETTINGS
        </button>
      </div>
      
      <p className={styles.hint}>Or press ENTER</p>
      
      {/* Leaderboard */}
      <div className={styles.leaderboard}>
        <HighScores limit={10} refreshInterval={5000} />
      </div>
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
  onSettings: () => void;
}

const PauseScreen: React.FC<PauseScreenProps> = ({
  stats,
  score,
  level,
  lines,
  soundEnabled,
  onToggleSound,
  onResume,
  onSettings,
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
        
        <button className={styles.settingsButtonPause} onClick={onSettings}>
          SETTINGS
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
    setKeyBindings,
  } = useGameEngine(stage);
  
  // Audio system - responds to game events
  const audio = useGameAudio(addEventListener, state.level, state.zone.mode === 'active');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [hasStarted, setHasStarted] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // DAS/ARR settings (stored locally for now)
  const [dasArrSettings, setDasArrSettings] = useState({ das: 167, arr: 33 });
  
  // High score tracking
  const { highScore, refresh: refreshHighScore } = useHighScore(30000);
  
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
    setShowGameOverModal(false);
    restart(stage);
    start();
  }, [restart, start, stage]);
  
  // Handle score submission
  const handleScoreSubmit = useCallback(async (playerName: string) => {
    await saveHighScore(playerName, state.score);
    refreshHighScore();
    handleRestart();
  }, [state.score, refreshHighScore, handleRestart]);
  
  // Handle score skip
  const handleScoreSkip = useCallback(() => {
    handleRestart();
  }, [handleRestart]);
  
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
  
  // Handle settings
  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);
  
  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);
  
  const handleDasArrSave = useCallback((settings: { das: number; arr: number }) => {
    setDasArrSettings(settings);
    // TODO: Apply to input handler if needed
  }, []);
  
  const handleKeyBindingsChange = useCallback((bindings: KeyBindings) => {
    setKeyBindings(bindings);
  }, [setKeyBindings]);
  
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
          setShowGameOverModal(true);
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
        <StartScreen onStart={handleStart} onSettings={handleOpenSettings} />
        {showSettings && (
          <Settings
            settings={dasArrSettings}
            onSave={handleDasArrSave}
            onClose={handleCloseSettings}
            onKeyBindingsChange={handleKeyBindingsChange}
          />
        )}
      </div>
    );
  }
  
  // Show game over modal
  if (state.phase === 'gameOver' && showGameOverModal) {
    return (
      <div className={styles.container}>
        <GameOverModal
          score={state.score}
          highScore={highScore}
          onSubmit={handleScoreSubmit}
          onSkip={handleScoreSkip}
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
            isActive={state.zone.mode === 'active'}
            timeRemaining={state.zone.timeRemaining}
            linesCleared={state.zone.linesCleared}
            maxTime={state.zone.maxTime}
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
            isZoneActive={state.zone.mode === 'active'}
            isPaused={state.phase === 'paused'}
            zoneLinesCleared={state.zone.linesCleared}
          />
        </div>
        
        {/* Right panel - Next queue and High Score */}
        <div className={styles.rightPanel}>
          <NextQueue pieces={state.nextPieces} count={5} />
          <div className={styles.highScoreInGame}>
            <CurrentHighScore variant="compact" refreshInterval={30000} />
          </div>
        </div>
      </div>
      
      {/* Pause Screen */}
      {state.phase === 'paused' && !showSettings && (
        <PauseScreen
          stats={sessionStats}
          score={state.score}
          level={state.level}
          lines={state.linesCleared}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onResume={handleResume}
          onSettings={handleOpenSettings}
        />
      )}
      
      {/* Settings Modal */}
      {showSettings && (
        <Settings
          settings={dasArrSettings}
          onSave={handleDasArrSave}
          onClose={handleCloseSettings}
          onKeyBindingsChange={handleKeyBindingsChange}
        />
      )}
    </div>
  );
};

export default TetrisGame;
