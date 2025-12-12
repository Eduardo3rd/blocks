// =============================================================================
// BLOCKS - ZONE SYSTEM
// Freeze time and stack massive clears
// =============================================================================

import {
  ZoneState,
  ZoneMode,
  Board,
  ZONE_MAX_METER,
  ZONE_SECONDS_PER_QUARTER,
  ZONE_LINES_PER_QUARTER,
  ZONE_PER_LINE_BONUS,
  ZONE_MAX_MULTIPLIER,
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
    mode: 'inactive',
    meter: 0,
    timeRemaining: 0,
    maxTime: 0,
    linesCleared: 0,
    scoreBuffer: 0,
    wasFullMeter: false,
    linesSinceLastQuarter: 0,
  };
}

/**
 * Add meter based on lines cleared using quarter-based system.
 * 8 lines per quarter (25% of meter).
 */
export function addZoneMeter(state: ZoneState, linesCleared: number, isTSpin: boolean = false): ZoneState {
  if (state.mode === 'active') {
    // Don't add meter while Zone is active
    return state;
  }
  
  // T-Spins count as extra lines for meter filling
  let effectiveLines = linesCleared;
  if (isTSpin) {
    effectiveLines += 2;
  }
  
  let newLinesSinceQuarter = state.linesSinceLastQuarter + effectiveLines;
  let newMeter = state.meter;
  
  // Add 25% for each 8 lines
  while (newLinesSinceQuarter >= ZONE_LINES_PER_QUARTER) {
    newLinesSinceQuarter -= ZONE_LINES_PER_QUARTER;
    newMeter = Math.min(ZONE_MAX_METER, newMeter + 0.25);
  }
  
  // Update mode
  let newMode: ZoneMode = state.mode;
  if (newMeter > 0 && state.mode === 'inactive') {
    newMode = 'charging';
  }
  
  return {
    ...state,
    meter: newMeter,
    mode: newMode,
    linesSinceLastQuarter: newLinesSinceQuarter,
  };
}

/**
 * Check if Zone can be activated
 * Zone can now be activated with any meter > 0 (not just full)
 */
export function canActivateZone(state: ZoneState): boolean {
  return state.meter > 0 && state.mode !== 'active';
}

/**
 * Activate Zone mode
 * Time is proportional to meter level (full meter = 20 seconds)
 */
export function activateZone(state: ZoneState): ZoneState {
  if (!canActivateZone(state)) {
    return state;
  }
  
  const currentMeter = state.meter;
  // Full meter (1.0) = 20 seconds, proportional for partial
  const maxTime = currentMeter * (ZONE_SECONDS_PER_QUARTER * 4) * 1000; // ms
  const wasFullMeter = currentMeter >= ZONE_MAX_METER;
  
  return {
    mode: 'active',
    meter: 0, // Consume meter
    timeRemaining: maxTime,
    maxTime: maxTime,
    linesCleared: 0,
    scoreBuffer: 0,
    wasFullMeter: wasFullMeter,
    linesSinceLastQuarter: 0,
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
  if (state.mode !== 'active') {
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
 * End Zone mode and reset state
 */
export function deactivateZone(state: ZoneState): ZoneState {
  return createZoneState();
}

/**
 * Calculate Zone end score with multiplier system
 * - Base multiplier: 1x
 * - +1x if activated with full meter
 * - +1x if cleared 8+ lines during Zone
 * - Capped at 3x
 * - Plus per-line bonus
 */
export function calculateZoneEndScore(state: ZoneState): number {
  let multiplier = 1;
  
  if (state.wasFullMeter) {
    multiplier += 1;
  }
  
  if (state.linesCleared >= 8) {
    multiplier += 1;
  }
  
  multiplier = Math.min(multiplier, ZONE_MAX_MULTIPLIER);
  
  const lineBonus = ZONE_PER_LINE_BONUS * state.linesCleared;
  
  return (state.scoreBuffer * multiplier) + lineBonus;
}

/**
 * Get the current Zone multiplier (for display purposes)
 */
export function getZoneMultiplier(state: ZoneState): number {
  let multiplier = 1;
  
  if (state.wasFullMeter) {
    multiplier += 1;
  }
  
  if (state.linesCleared >= 8) {
    multiplier += 1;
  }
  
  return Math.min(multiplier, ZONE_MAX_MULTIPLIER);
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
  4: 'Quad',
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
 * Virtual line bonuses for different clear types (for meter filling)
 * These are added to actual line count for meter calculation
 */
export const ZONE_VIRTUAL_LINE_BONUS: Record<string, number> = {
  single: 0,
  double: 0,
  triple: 0,
  quad: 1,        // Quad counts as 5 lines for meter
  tSpinSingle: 2, // T-Spin single counts as 3 lines
  tSpinDouble: 3, // T-Spin double counts as 5 lines  
  tSpinTriple: 4, // T-Spin triple counts as 7 lines
  allClear: 4,    // Perfect clear gives big meter bonus
};

/**
 * Get effective lines for meter filling (actual lines + bonus)
 */
export function getEffectiveLinesForMeter(clearType: string, linesCleared: number): number {
  const bonus = ZONE_VIRTUAL_LINE_BONUS[clearType] || 0;
  return linesCleared + bonus;
}

// -----------------------------------------------------------------------------
// Zone Visual Effects Data
// -----------------------------------------------------------------------------

/**
 * Visual effect intensity based on Zone time remaining
 */
export function getZoneVisualIntensity(state: ZoneState): number {
  if (state.mode !== 'active' || state.maxTime === 0) return 0;
  
  const progress = state.timeRemaining / state.maxTime;
  
  // Intensity increases as time runs out
  if (progress > 0.5) return 0.3;
  if (progress > 0.25) return 0.6;
  if (progress > 0.1) return 0.8;
  return 1.0; // Max intensity in final moments
}

/**
 * Get Zone color based on lines cleared during Zone
 */
export function getZoneColor(linesCleared: number): string {
  if (linesCleared >= 18) return '#ff00ff'; // Magenta - incredible
  if (linesCleared >= 14) return '#ff5500'; // Orange - amazing
  if (linesCleared >= 10) return '#ffaa00'; // Gold - decuple+
  if (linesCleared >= 6) return '#00ffaa'; // Teal - great
  return '#00aaff'; // Blue - normal
}

// -----------------------------------------------------------------------------
// Zone State Utilities
// -----------------------------------------------------------------------------

/**
 * Get Zone meter as percentage (0-100)
 */
export function getZoneMeterPercentage(state: ZoneState): number {
  return (state.meter / ZONE_MAX_METER) * 100;
}

/**
 * Get remaining Zone time as percentage
 */
export function getZoneTimePercentage(state: ZoneState): number {
  if (state.maxTime === 0) return 0;
  return (state.timeRemaining / state.maxTime) * 100;
}

/**
 * Check if Zone meter is full
 */
export function isZoneMeterFull(state: ZoneState): boolean {
  return state.meter >= ZONE_MAX_METER;
}

/**
 * Check if Zone is currently active
 */
export function isZoneActive(state: ZoneState): boolean {
  return state.mode === 'active';
}

/**
 * Check if Zone meter has any charge
 */
export function hasZoneCharge(state: ZoneState): boolean {
  return state.meter > 0;
}
