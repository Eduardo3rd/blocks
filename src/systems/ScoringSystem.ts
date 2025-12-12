// =============================================================================
// BLOCKS - SCORING SYSTEM
// Complete scoring logic with combos, T-spins, back-to-back, Zone bonuses
// =============================================================================

import { ClearType } from '../engine/types';

// -----------------------------------------------------------------------------
// Score Tables
// -----------------------------------------------------------------------------

/**
 * Base scores for each clear type (before level multiplier)
 * Based on standard block puzzle scoring
 */
export const BASE_SCORES: Record<ClearType, number> = {
  single: 100,
  double: 300,
  triple: 500,
  quad: 800,
  tSpinMini: 100,
  tSpinMiniSingle: 200,
  tSpinMiniDouble: 400,
  tSpin: 400,
  tSpinSingle: 800,
  tSpinDouble: 1200,
  tSpinTriple: 1600,
  allClear: 3500,
};

/**
 * Zone clear bonus scores (massive bonuses for large clears)
 */
export const ZONE_LINE_NAMES: Record<number, string> = {
  1: 'Single',
  2: 'Double',
  3: 'Triple',
  4: 'Quad',
  5: 'Penta',
  6: 'Hexa',
  7: 'Hepta',
  8: 'Octo',
  9: 'Nona',
  10: 'Deca',
  11: 'Undeca',
  12: 'Dodeca',
  13: 'Trideca',
  14: 'Quattuordeca',
  15: 'Quindeca',
  16: 'Sexdeca',
  17: 'Septendeca',
  18: 'Octodeca',
  19: 'Novemdeca',
  20: 'Perfecta',
  21: 'Ultima',
};

// Zone scores increase exponentially
export function getZoneLineScore(lines: number, level: number): number {
  if (lines <= 0) return 0;
  
  // Base scores for Zone clears
  const baseScore = (() => {
    if (lines <= 4) return lines * 200;
    if (lines <= 8) return 800 + (lines - 4) * 400;
    if (lines <= 12) return 2400 + (lines - 8) * 800;
    if (lines <= 16) return 5600 + (lines - 12) * 1600;
    return 12000 + (lines - 16) * 3200;
  })();
  
  return baseScore * level;
}

// -----------------------------------------------------------------------------
// Clear Type Utilities
// -----------------------------------------------------------------------------

/**
 * Get the display name for a clear type
 */
export function getClearTypeName(clearType: ClearType): string {
  const names: Record<ClearType, string> = {
    single: 'Single',
    double: 'Double',
    triple: 'Triple',
    quad: 'Quad',
    tSpinMini: 'T-Spin Mini',
    tSpinMiniSingle: 'T-Spin Mini Single',
    tSpinMiniDouble: 'T-Spin Mini Double',
    tSpin: 'T-Spin',
    tSpinSingle: 'T-Spin Single',
    tSpinDouble: 'T-Spin Double',
    tSpinTriple: 'T-Spin Triple',
    allClear: 'Perfect Clear',
  };
  
  return names[clearType] || clearType;
}

/**
 * Check if a clear type qualifies as "difficult" for back-to-back
 */
export function isDifficultClear(clearType: ClearType): boolean {
  const difficultTypes: ClearType[] = [
    'quad',
    'tSpinSingle',
    'tSpinDouble',
    'tSpinTriple',
    'tSpinMiniSingle',
    'tSpinMiniDouble',
    'allClear',
  ];
  
  return difficultTypes.includes(clearType);
}

/**
 * Check if a clear type is a T-spin variant
 */
export function isTSpinClear(clearType: ClearType): boolean {
  return clearType.startsWith('tSpin');
}

// -----------------------------------------------------------------------------
// Score Calculation
// -----------------------------------------------------------------------------

export interface ScoreCalculation {
  baseScore: number;
  levelMultiplier: number;
  backToBackMultiplier: number;
  comboBonus: number;
  totalScore: number;
}

/**
 * Calculate score for a line clear
 */
export function calculateClearScore(
  clearType: ClearType,
  level: number,
  combo: number,
  isBackToBack: boolean
): ScoreCalculation {
  const baseScore = BASE_SCORES[clearType] || 0;
  const levelMultiplier = level;
  
  // Back-to-back gives 1.5x on difficult clears
  const backToBackMultiplier = isBackToBack && isDifficultClear(clearType) ? 1.5 : 1;
  
  // Combo bonus: 50 * combo * level
  const comboBonus = combo > 0 ? 50 * combo * level : 0;
  
  const totalScore = Math.floor(baseScore * levelMultiplier * backToBackMultiplier) + comboBonus;
  
  return {
    baseScore,
    levelMultiplier,
    backToBackMultiplier,
    comboBonus,
    totalScore,
  };
}

/**
 * Calculate soft drop bonus
 * 1 point per cell dropped
 */
export function calculateSoftDropScore(cellsDropped: number): number {
  return cellsDropped;
}

/**
 * Calculate hard drop bonus
 * 2 points per cell dropped
 */
export function calculateHardDropScore(cellsDropped: number): number {
  return cellsDropped * 2;
}

// -----------------------------------------------------------------------------
// Combo System
// -----------------------------------------------------------------------------

export interface ComboInfo {
  count: number;
  bonus: number;
  multiplier: number;
}

/**
 * Calculate combo bonus
 */
export function getComboBonus(combo: number, level: number): number {
  if (combo <= 0) return 0;
  return 50 * combo * level;
}

/**
 * Get combo display name
 */
export function getComboName(combo: number): string {
  if (combo <= 0) return '';
  if (combo === 1) return 'Combo';
  return `${combo} Combo`;
}

// -----------------------------------------------------------------------------
// Back-to-Back System
// -----------------------------------------------------------------------------

export interface BackToBackState {
  active: boolean;
  count: number;  // How many consecutive B2Bs
}

/**
 * Update back-to-back state after a clear
 */
export function updateBackToBack(
  currentState: BackToBackState,
  clearType: ClearType,
  linesCleared: number
): BackToBackState {
  if (linesCleared === 0) {
    // No clear - maintain current state
    return currentState;
  }
  
  const isDifficult = isDifficultClear(clearType);
  
  if (isDifficult) {
    return {
      active: currentState.active, // B2B is active if previous was also difficult
      count: currentState.active ? currentState.count + 1 : 0,
    };
  }
  
  // Non-difficult clear breaks B2B
  return {
    active: false,
    count: 0,
  };
}

// -----------------------------------------------------------------------------
// Perfect Clear (All Clear) Bonus
// -----------------------------------------------------------------------------

export const PERFECT_CLEAR_SCORES: Record<number, number> = {
  1: 800,   // Single Perfect Clear
  2: 1200,  // Double Perfect Clear
  3: 1800,  // Triple Perfect Clear
  4: 2000,  // Quad Perfect Clear (actually gives allClear type which is 3500)
};

/**
 * Get perfect clear bonus (in addition to normal clear)
 */
export function getPerfectClearBonus(linesCleared: number, level: number): number {
  const base = PERFECT_CLEAR_SCORES[linesCleared] || 800;
  return base * level;
}

// -----------------------------------------------------------------------------
// Statistics Tracking
// -----------------------------------------------------------------------------

export interface GameStats {
  score: number;
  level: number;
  linesCleared: number;
  
  // Clear counts
  singles: number;
  doubles: number;
  triples: number;
  quads: number;
  
  // T-spin counts
  tSpins: number;
  tSpinMinis: number;
  tSpinSingles: number;
  tSpinDoubles: number;
  tSpinTriples: number;
  
  // Special
  perfectClears: number;
  maxCombo: number;
  maxBackToBack: number;
  
  // Timing
  startTime: number;
  endTime: number | null;
  
  // Zone stats
  zonesActivated: number;
  zoneLinesCleared: number;
  maxZoneClear: number;
}

export function createEmptyStats(): GameStats {
  return {
    score: 0,
    level: 1,
    linesCleared: 0,
    singles: 0,
    doubles: 0,
    triples: 0,
    quads: 0,
    tSpins: 0,
    tSpinMinis: 0,
    tSpinSingles: 0,
    tSpinDoubles: 0,
    tSpinTriples: 0,
    perfectClears: 0,
    maxCombo: 0,
    maxBackToBack: 0,
    startTime: Date.now(),
    endTime: null,
    zonesActivated: 0,
    zoneLinesCleared: 0,
    maxZoneClear: 0,
  };
}

export function updateStatsForClear(
  stats: GameStats,
  clearType: ClearType,
  linesCleared: number,
  combo: number,
  backToBackCount: number
): GameStats {
  const newStats = { ...stats };
  
  newStats.linesCleared += linesCleared;
  newStats.maxCombo = Math.max(newStats.maxCombo, combo);
  newStats.maxBackToBack = Math.max(newStats.maxBackToBack, backToBackCount);
  
  switch (clearType) {
    case 'single':
      newStats.singles++;
      break;
    case 'double':
      newStats.doubles++;
      break;
    case 'triple':
      newStats.triples++;
      break;
    case 'quad':
      newStats.quads++;
      break;
    case 'tSpin':
    case 'tSpinMini':
      newStats.tSpins++;
      if (clearType === 'tSpinMini') newStats.tSpinMinis++;
      break;
    case 'tSpinSingle':
    case 'tSpinMiniSingle':
      newStats.tSpinSingles++;
      if (clearType === 'tSpinMiniSingle') newStats.tSpinMinis++;
      break;
    case 'tSpinDouble':
    case 'tSpinMiniDouble':
      newStats.tSpinDoubles++;
      if (clearType === 'tSpinMiniDouble') newStats.tSpinMinis++;
      break;
    case 'tSpinTriple':
      newStats.tSpinTriples++;
      break;
    case 'allClear':
      newStats.perfectClears++;
      break;
  }
  
  return newStats;
}

export function updateStatsForZone(
  stats: GameStats,
  linesCleared: number
): GameStats {
  return {
    ...stats,
    zonesActivated: stats.zonesActivated + 1,
    zoneLinesCleared: stats.zoneLinesCleared + linesCleared,
    maxZoneClear: Math.max(stats.maxZoneClear, linesCleared),
  };
}

// -----------------------------------------------------------------------------
// High Score Management
// -----------------------------------------------------------------------------

export interface HighScoreEntry {
  name: string;
  score: number;
  level: number;
  lines: number;
  date: number;
  stage?: string;
}

const HIGH_SCORES_KEY = 'blocks_high_scores';
const MAX_HIGH_SCORES = 10;

export function loadHighScores(): HighScoreEntry[] {
  try {
    const data = localStorage.getItem(HIGH_SCORES_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveHighScore(entry: HighScoreEntry): HighScoreEntry[] {
  const scores = loadHighScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  const topScores = scores.slice(0, MAX_HIGH_SCORES);
  
  try {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(topScores));
  } catch {
    // Storage might be full or unavailable
  }
  
  return topScores;
}

export function isHighScore(score: number): boolean {
  const scores = loadHighScores();
  if (scores.length < MAX_HIGH_SCORES) return true;
  return score > (scores[scores.length - 1]?.score ?? 0);
}
