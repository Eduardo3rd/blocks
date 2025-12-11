// =============================================================================
// MOBILE GAME - Desktop-Style Layout for Mobile
// Portrait layout with left/right panels, game board, and touch controls
// =============================================================================

import React, { useEffect, useCallback, useState } from 'react';
import { useGameEngine } from '../../hooks/useGameEngine';
import { GameBoard } from '../Board/GameBoard';
import { HoldPiece, NextQueue } from '../HUD/PiecePreview';
import { GameStats, ZoneMeter } from '../HUD/GameStats';
import { CurrentHighScore } from '../game/CurrentHighScore/CurrentHighScore';
import { GameEvent, StageInfo, ClearType, InputAction } from '../../engine/types';
import { useGameAudio } from '../../systems/AudioSystem';
import { saveHighScore } from '../../utils/highScores';
import { ControlPanel } from './controls/ControlPanel';
import { MobileStartScreen } from './MobileStartScreen';
import { MobileGameOverScreen } from './MobileGameOverScreen';
import { MobilePauseScreen } from './MobilePauseScreen';
import { MobileSettings } from './MobileSettings';
import styles from './MobileGame.module.css';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface MobileGameProps {
  stage?: StageInfo;
  onGameOver?: (score: number) => void;
}

interface SessionStats {
  totalClears: number;
  tetrisCount: number;
  tSpinCount: number;
  longestCombo: number;
  perfectClears: number;
  piecesPlaced: number;
  playTime: number;
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const MobileGame: React.FC<MobileGameProps> = ({ stage, onGameOver }) => {
  const {
    state,
    start,
    pause,
    restart,
    handleInput,
    addEventListener,
  } = useGameEngine(stage);

  // Audio system
  const audio = useGameAudio(addEventListener, state.level, state.zone.mode === 'active');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [hasStarted, setHasStarted] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Session statistics
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalClears: 0,
    tetrisCount: 0,
    tSpinCount: 0,
    longestCombo: 0,
    perfectClears: 0,
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

  // Helper to check T-spin
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
    handleRestart();
  }, [state.score, handleRestart]);

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
    if (state.phase === 'playing') {
      pause();
    }
    setShowSettings(true);
  }, [state.phase, pause]);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  // Handle touch input from control panel
  const handleTouchInput = useCallback((action: InputAction) => {
    handleInput(action);
  }, [handleInput]);

  // Listen for game events
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

  // Prevent default touch behaviors
  useEffect(() => {
    const preventDefaults = (e: TouchEvent) => {
      // Allow scrolling on settings/modals but prevent on game
      if (hasStarted && !showSettings && !showGameOverModal) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefaults, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefaults);
  }, [hasStarted, showSettings, showGameOverModal]);

  // Show start screen
  if (!hasStarted) {
    return (
      <div className={styles.container}>
        <MobileStartScreen 
          onStart={handleStart} 
          onSettings={handleOpenSettings}
        />
        {showSettings && (
          <MobileSettings onClose={handleCloseSettings} />
        )}
      </div>
    );
  }

  // Show game over screen
  if (state.phase === 'gameOver' && showGameOverModal) {
    return (
      <div className={styles.container}>
        <MobileGameOverScreen
          score={state.score}
          level={state.level}
          lines={state.linesCleared}
          stats={sessionStats}
          onSubmit={handleScoreSubmit}
          onSkip={handleScoreSkip}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Game Area - 3 Column Layout */}
      <div className={styles.gameArea}>
        <div className={styles.gameLayout}>
          {/* Left Panel - Hold, Zone, Stats */}
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

          {/* Right Panel - Next Queue, High Score */}
          <div className={styles.rightPanel}>
            <NextQueue pieces={state.nextPieces} count={3} />
            <div className={styles.highScoreArea}>
              <CurrentHighScore variant="compact" refreshInterval={30000} />
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <ControlPanel
        onInput={handleTouchInput}
        disabled={state.phase === 'paused' || state.phase === 'gameOver'}
      />

      {/* Pause Screen Overlay */}
      {state.phase === 'paused' && !showSettings && (
        <MobilePauseScreen
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
        <MobileSettings onClose={handleCloseSettings} />
      )}
    </div>
  );
};

export default MobileGame;
