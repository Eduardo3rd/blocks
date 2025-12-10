// =============================================================================
// TETRIS EFFECT CLONE - ZONE SYSTEM
// The signature Tetris Effect mechanic: freeze time and stack massive clears
// =============================================================================

import {
  ZoneState,
  Board,
  ZONE_MAX_METER,
  ZONE_DURATION,
  ZONE_FILL_PER_LINE,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  Cell,
} from './types';
import { cloneBoard } from './Board';

// -----------------------------------------------------------------------------
// Zone State Management
// -----------------------------------------------------------------------------

/**
 * Create initial zone state
 */
export function createZoneState(): ZoneState {
  return {
    meter: 0,
    isActive: false,
    stackedLines: 0,
    timeRemaining: ZONE_DURATION,
  };
}

/**
 * Add meter based on lines cleared
 */
export function addZoneMeter(state: ZoneState, linesCleared: number): ZoneState {
  if (state.isActive) {
    // Don't add meter while Zone is active
    return state;
  }
  
  const newMeter = Math.min(ZONE_MAX_METER, state.meter + (linesCleared * ZONE_FILL_PER_LINE));
  
  return {
    ...state,
    meter: newMeter,
  };
}

/**
 * Check if Zone can be activated
 */
export function canActivateZone(state: ZoneState): boolean {
  return state.meter >= ZONE_MAX_METER && !state.isActive;
}

/**
 * Activate Zone mode
 */
export function activateZone(state: ZoneState): ZoneState {
  if (!canActivateZone(state)) {
    return state;
  }
  
  return {
    meter: 0, // Consume meter
    isActive: true,
    stackedLines: 0,
    timeRemaining: ZONE_DURATION,
  };
}

/**
 * Update Zone timer
 * Returns new state, and whether Zone has ended
 */
export function updateZoneTimer(state: ZoneState, deltaTime: number): {
  state: ZoneState;
  hasEnded: boolean;
} {
  if (!state.isActive) {
    return { state, hasEnded: false };
  }
  
  const newTimeRemaining = state.timeRemaining - deltaTime;
  
  if (newTimeRemaining <= 0) {
    return {
      state: {
        ...state,
        timeRemaining: 0,
      },
      hasEnded: true,
    };
  }
  
  return {
    state: {
      ...state,
      timeRemaining: newTimeRemaining,
    },
    hasEnded: false,
  };
}

/**
 * End Zone mode
 */
export function deactivateZone(state: ZoneState): ZoneState {
  return {
    meter: 0,
    isActive: false,
    stackedLines: 0,
    timeRemaining: ZONE_DURATION,
  };
}

// -----------------------------------------------------------------------------
// Zone Board Operations
// -----------------------------------------------------------------------------

/**
 * In Zone mode, completed lines are pushed to the bottom and stacked
 * Instead of being cleared, they're converted to "Zone lines"
 */
export function handleZoneLineClear(
  board: Board,
  completedLines: number[]
): { board: Board; linesStacked: number } {
  if (completedLines.length === 0) {
    return { board, linesStacked: 0 };
  }
  
  const newBoard = cloneBoard(board);
  
  // Remove completed lines
  const remainingRows = newBoard.filter((_, index) => !completedLines.includes(index));
  
  // Add empty rows at the top
  const emptyRows: Cell[][] = [];
  for (let i = 0; i < completedLines.length; i++) {
    emptyRows.push(new Array(BOARD_WIDTH).fill(null));
  }
  
  const resultBoard = [...emptyRows, ...remainingRows];
  
  return {
    board: resultBoard,
    linesStacked: completedLines.length,
  };
}

// -----------------------------------------------------------------------------
// Zone Scoring
// -----------------------------------------------------------------------------

/**
 * Zone clear names based on number of lines
 */
export const ZONE_CLEAR_NAMES: Record<number, string> = {
  1: 'Single',
  2: 'Double',
  3: 'Triple',
  4: 'Tetris',
  5: 'Pentris',
  6: 'Hexris',
  7: 'Heptris',
  8: 'Octris',
  9: 'Nonaris',
  10: 'Decuple',
  11: 'Undecuple',
  12: 'Dodecuple',
  13: 'Tridecuple',
  14: 'Quattuordecuple',
  15: 'Quindecuple',
  16: 'Sexdecuple',
  17: 'Septendecuple',
  18: 'Octodecuple',
  19: 'Novemdecuple',
  20: 'Perfectris',
  21: 'Ultimatris',
};

/**
 * Get display name for Zone clear
 */
export function getZoneClearName(lines: number): string {
  if (lines <= 0) return '';
  if (lines > 21) return `${lines}-Line Clear`;
  return ZONE_CLEAR_NAMES[lines] || `${lines}-Line Clear`;
}

/**
 * Calculate Zone score bonus
 * Score increases exponentially with lines
 */
export function calculateZoneScore(lines: number, level: number): number {
  if (lines <= 0) return 0;
  
  // Base score calculation
  // The score grows faster than linearly to reward big Zone clears
  let baseScore: number;
  
  if (lines <= 4) {
    // 1-4 lines: standard scoring
    baseScore = lines * 200;
  } else if (lines <= 8) {
    // 5-8 lines: bonus tier
    baseScore = 800 + (lines - 4) * 400;
  } else if (lines <= 12) {
    // 9-12 lines: Decuple tier
    baseScore = 2400 + (lines - 8) * 800;
  } else if (lines <= 16) {
    // 13-16 lines: massive bonus
    baseScore = 5600 + (lines - 12) * 1600;
  } else if (lines <= 20) {
    // 17-20 lines: incredible bonus
    baseScore = 12000 + (lines - 16) * 3200;
  } else {
    // 21+ lines: legendary
    baseScore = 24800 + (lines - 20) * 5000;
  }
  
  return baseScore * level;
}

/**
 * Zone meter fill rates for different clear types
 */
export const ZONE_FILL_RATES: Record<string, number> = {
  single: 6,
  double: 8,
  triple: 10,
  tetris: 15,
  tSpinSingle: 10,
  tSpinDouble: 15,
  tSpinTriple: 20,
  allClear: 25, // Perfect clear gives lots of Zone
};

/**
 * Calculate Zone meter fill based on clear type
 */
export function getZoneFillAmount(clearType: string, linesCleared: number): number {
  const baseRate = ZONE_FILL_RATES[clearType] || ZONE_FILL_PER_LINE;
  
  // Additional bonus for combos could be added here
  return baseRate;
}

// -----------------------------------------------------------------------------
// Zone Visual Effects Data
// -----------------------------------------------------------------------------

/**
 * Visual effect intensity based on Zone time remaining
 */
export function getZoneVisualIntensity(timeRemaining: number): number {
  const progress = timeRemaining / ZONE_DURATION;
  
  // Intensity increases as time runs out
  if (progress > 0.5) return 0.3;
  if (progress > 0.25) return 0.6;
  if (progress > 0.1) return 0.8;
  return 1.0; // Max intensity in final moments
}

/**
 * Get Zone color based on stacked lines
 */
export function getZoneColor(stackedLines: number): string {
  if (stackedLines >= 18) return '#ff00ff'; // Magenta - incredible
  if (stackedLines >= 14) return '#ff5500'; // Orange - amazing
  if (stackedLines >= 10) return '#ffaa00'; // Gold - decuple+
  if (stackedLines >= 6) return '#00ffaa'; // Teal - great
  return '#00aaff'; // Blue - normal
}

// -----------------------------------------------------------------------------
// Zone State Utilities
// -----------------------------------------------------------------------------

/**
 * Get Zone progress as percentage
 */
export function getZoneMeterPercentage(state: ZoneState): number {
  return (state.meter / ZONE_MAX_METER) * 100;
}

/**
 * Get remaining Zone time as percentage
 */
export function getZoneTimePercentage(state: ZoneState): number {
  return (state.timeRemaining / ZONE_DURATION) * 100;
}

/**
 * Check if Zone meter is full
 */
export function isZoneMeterFull(state: ZoneState): boolean {
  return state.meter >= ZONE_MAX_METER;
}
