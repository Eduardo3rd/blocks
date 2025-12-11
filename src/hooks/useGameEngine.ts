// =============================================================================
// TETRIS EFFECT CLONE - REACT GAME ENGINE HOOK
// Binds the game engine to React with state synchronization
// =============================================================================

import { useEffect, useRef, useCallback, useSyncExternalStore, useState } from 'react';
import { GameEngine, createGameEngine } from '../engine/GameEngine';
import { InputHandler, GamepadHandler, createInputHandler, createGamepadHandler, KeyBinding } from '../engine/InputHandler';
import { GameState, GameEvent, InputAction, StageInfo, InputConfig, TetrominoType } from '../engine/types';
import { loadKeyBindings, keyBindingsToArray, KeyBindings } from '../utils/keyBindingsStorage';

// -----------------------------------------------------------------------------
// Hook Return Type
// -----------------------------------------------------------------------------

export interface UseGameEngineReturn {
  // State
  state: GameState;
  
  // Game controls
  start: () => void;
  pause: () => void;
  restart: (stage?: StageInfo) => void;
  
  // Input
  handleInput: (action: InputAction) => void;
  setInputConfig: (config: Partial<InputConfig>) => void;
  setKeyBindings: (bindings: KeyBindings) => void;
  
  // Events
  addEventListener: (listener: (event: GameEvent) => void) => () => void;
}

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

export function useGameEngine(initialStage?: StageInfo): UseGameEngineReturn {
  const engineRef = useRef<GameEngine | null>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const gamepadHandlerRef = useRef<GamepadHandler | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastNotifyTimeRef = useRef<number>(0);
  const stateVersionRef = useRef<number>(0);
  const listenersRef = useRef<Set<() => void>>(new Set());
  
  // Track previous state for change detection - use primitive values to avoid string creation
  const prevStateRef = useRef<{
    phase: string;
    score: number;
    level: number;
    linesCleared: number;
    // Piece tracking without string concatenation
    pieceType: TetrominoType | null;
    pieceX: number;
    pieceY: number;
    pieceRotation: number;
    holdPiece: TetrominoType | null;
    zoneMode: string;
    zoneLinesCleared: number;
    boardVersion: number;
  } | null>(null);
  
  // Track board changes via a simple counter
  const boardVersionRef = useRef(0);
  
  // Initialize engine on mount
  if (engineRef.current === null) {
    engineRef.current = createGameEngine(initialStage);
  }
  
  // Subscribe function for useSyncExternalStore
  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);
  
  // Get snapshot function for useSyncExternalStore
  const getSnapshot = useCallback(() => {
    return stateVersionRef.current;
  }, []);
  
  // Check if state has meaningfully changed (not just timer ticks)
  // OPTIMIZED: No string creation - direct primitive comparison
  const hasStateChanged = useCallback((state: GameState, boardChanged: boolean): boolean => {
    const prev = prevStateRef.current;
    if (!prev) return true;
    
    const piece = state.currentPiece;
    
    return (
      prev.phase !== state.phase ||
      prev.score !== state.score ||
      prev.level !== state.level ||
      prev.linesCleared !== state.linesCleared ||
      prev.pieceType !== (piece?.type ?? null) ||
      prev.pieceX !== (piece?.position.x ?? 0) ||
      prev.pieceY !== (piece?.position.y ?? 0) ||
      prev.pieceRotation !== (piece?.rotation ?? 0) ||
      prev.holdPiece !== state.holdPiece ||
      prev.zoneMode !== state.zone.mode ||
      prev.zoneLinesCleared !== state.zone.linesCleared ||
      boardChanged
    );
  }, []);
  
  // Update previous state cache - OPTIMIZED: No string creation
  const updatePrevState = useCallback((state: GameState) => {
    const piece = state.currentPiece;
    prevStateRef.current = {
      phase: state.phase,
      score: state.score,
      level: state.level,
      linesCleared: state.linesCleared,
      pieceType: piece?.type ?? null,
      pieceX: piece?.position.x ?? 0,
      pieceY: piece?.position.y ?? 0,
      pieceRotation: piece?.rotation ?? 0,
      holdPiece: state.holdPiece,
      zoneMode: state.zone.mode,
      zoneLinesCleared: state.zone.linesCleared,
      boardVersion: boardVersionRef.current,
    };
  }, []);
  
  // Force re-render when engine state changes
  const notifyListeners = useCallback(() => {
    stateVersionRef.current++;
    listenersRef.current.forEach(listener => listener());
  }, []);
  
  // Use sync external store to track state version
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  
  // Game loop - OPTIMIZED: Reduced allocations, better change detection
  const gameLoop = useCallback((timestamp: number) => {
    if (!engineRef.current) return;
    
    const deltaTime = lastTimeRef.current ? timestamp - lastTimeRef.current : 0;
    lastTimeRef.current = timestamp;
    
    // Cap delta time to prevent huge jumps after tab switch
    const cappedDelta = Math.min(deltaTime, 100);
    
    // Update engine and check if board changed
    const boardChanged = engineRef.current.update(cappedDelta);
    if (boardChanged) {
      boardVersionRef.current++;
    }
    
    // Get current state
    const state = engineRef.current.getState();
    
    // Only notify React if state has meaningfully changed
    // OR if it's been more than 100ms (for zone timer display updates)
    const now = performance.now();
    const timeSinceLastNotify = now - lastNotifyTimeRef.current;
    
    if (hasStateChanged(state, boardChanged) || (state.zone.mode === 'active' && timeSinceLastNotify > 100)) {
      updatePrevState(state);
      lastNotifyTimeRef.current = now;
      notifyListeners();
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [notifyListeners, hasStateChanged, updatePrevState]);
  
  // Start game loop when game is playing
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    
    const state = engine.getState();
    
    if (state.phase === 'playing' || state.phase === 'zoneActive') {
      lastTimeRef.current = 0;
      lastNotifyTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [engineRef.current?.getState().phase, gameLoop]);
  
  // Set up input handlers
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    
    // Load saved key bindings
    const savedBindings = loadKeyBindings();
    const bindingsArray = keyBindingsToArray(savedBindings);
    
    // Create input handler with saved bindings
    const inputHandler = createInputHandler(undefined, bindingsArray);
    inputHandlerRef.current = inputHandler;
    
    // Create gamepad handler
    const gamepadHandler = createGamepadHandler();
    gamepadHandlerRef.current = gamepadHandler;
    
    // Wire up input to engine
    const handleInput = (action: InputAction) => {
      engine.handleInput(action);
      // Always notify on input for immediate feedback
      updatePrevState(engine.getState());
      notifyListeners();
    };
    
    inputHandler.setCallback(handleInput);
    gamepadHandler.setCallback(handleInput);
    
    // Enable handlers
    inputHandler.enable();
    gamepadHandler.enable();
    
    return () => {
      inputHandler.destroy();
      gamepadHandler.destroy();
    };
  }, [notifyListeners, updatePrevState]);
  
  // Public methods
  const start = useCallback(() => {
    engineRef.current?.start();
    if (engineRef.current) {
      updatePrevState(engineRef.current.getState());
    }
    notifyListeners();
  }, [notifyListeners, updatePrevState]);
  
  const pause = useCallback(() => {
    engineRef.current?.pause();
    if (engineRef.current) {
      updatePrevState(engineRef.current.getState());
    }
    notifyListeners();
  }, [notifyListeners, updatePrevState]);
  
  const restart = useCallback((stage?: StageInfo) => {
    engineRef.current?.restart(stage);
    if (engineRef.current) {
      updatePrevState(engineRef.current.getState());
    }
    notifyListeners();
  }, [notifyListeners, updatePrevState]);
  
  const handleInput = useCallback((action: InputAction) => {
    engineRef.current?.handleInput(action);
    if (engineRef.current) {
      updatePrevState(engineRef.current.getState());
    }
    notifyListeners();
  }, [notifyListeners, updatePrevState]);
  
  const setInputConfig = useCallback((config: Partial<InputConfig>) => {
    inputHandlerRef.current?.setConfig(config);
  }, []);
  
  const setKeyBindings = useCallback((bindings: KeyBindings) => {
    const bindingsArray = keyBindingsToArray(bindings);
    inputHandlerRef.current?.setBindings(bindingsArray);
  }, []);
  
  const addEventListener = useCallback((listener: (event: GameEvent) => void) => {
    return engineRef.current?.addEventListener(listener) ?? (() => {});
  }, []);
  
  // Get current state
  const state = engineRef.current?.getState() ?? createGameEngine().getState();
  
  return {
    state,
    start,
    pause,
    restart,
    handleInput,
    setInputConfig,
    setKeyBindings,
    addEventListener,
  };
}

// -----------------------------------------------------------------------------
// Zustand Store Alternative (for more complex state needs)
// -----------------------------------------------------------------------------

import { create } from 'zustand';

interface GameStore {
  engine: GameEngine | null;
  state: GameState | null;
  
  // Actions
  initialize: (stage?: StageInfo) => void;
  start: () => void;
  pause: () => void;
  restart: (stage?: StageInfo) => void;
  handleInput: (action: InputAction) => void;
  updateState: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  engine: null,
  state: null,
  
  initialize: (stage?: StageInfo) => {
    const engine = createGameEngine(stage);
    set({ engine, state: engine.getState() });
  },
  
  start: () => {
    const { engine } = get();
    if (engine) {
      engine.start();
      set({ state: engine.getState() });
    }
  },
  
  pause: () => {
    const { engine } = get();
    if (engine) {
      engine.pause();
      set({ state: engine.getState() });
    }
  },
  
  restart: (stage?: StageInfo) => {
    const { engine } = get();
    if (engine) {
      engine.restart(stage);
      set({ state: engine.getState() });
    }
  },
  
  handleInput: (action: InputAction) => {
    const { engine } = get();
    if (engine) {
      engine.handleInput(action);
      set({ state: engine.getState() });
    }
  },
  
  updateState: () => {
    const { engine } = get();
    if (engine) {
      set({ state: engine.getState() });
    }
  },
}));
