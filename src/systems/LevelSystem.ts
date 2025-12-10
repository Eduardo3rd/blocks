// =============================================================================
// TETRIS EFFECT CLONE - LEVEL SYSTEM
// Journey mode stages, speed curves, and progression
// =============================================================================

import { StageInfo, SpeedCurve, JourneyProgress } from '../engine/types';

// -----------------------------------------------------------------------------
// Speed Curves
// Gravity values are in cells per second
// -----------------------------------------------------------------------------

/**
 * Standard speed curve (similar to Tetris Guidelines)
 */
export const STANDARD_SPEED_CURVE: SpeedCurve = {
  startLevel: 1,
  gravity: [
    1.0,   // Level 1
    1.2,   // Level 2
    1.5,   // Level 3
    1.8,   // Level 4
    2.2,   // Level 5
    2.7,   // Level 6
    3.3,   // Level 7
    4.0,   // Level 8
    5.0,   // Level 9
    6.0,   // Level 10
    7.5,   // Level 11
    9.0,   // Level 12
    11.0,  // Level 13
    14.0,  // Level 14
    18.0,  // Level 15
    22.0,  // Level 16
    28.0,  // Level 17
    35.0,  // Level 18
    45.0,  // Level 19
    60.0,  // Level 20 (20G approximation)
  ],
  lockDelay: 500,
};

/**
 * Beginner-friendly speed curve
 */
export const BEGINNER_SPEED_CURVE: SpeedCurve = {
  startLevel: 1,
  gravity: [
    0.5,   // Level 1
    0.6,   // Level 2
    0.7,   // Level 3
    0.8,   // Level 4
    1.0,   // Level 5
    1.2,   // Level 6
    1.5,   // Level 7
    1.8,   // Level 8
    2.2,   // Level 9
    2.7,   // Level 10
    3.3,   // Level 11
    4.0,   // Level 12
    5.0,   // Level 13
    6.0,   // Level 14
    7.5,   // Level 15
  ],
  lockDelay: 600,
};

/**
 * Master speed curve (fast from the start)
 */
export const MASTER_SPEED_CURVE: SpeedCurve = {
  startLevel: 10,
  gravity: [
    6.0,   // Level 10
    7.5,   // Level 11
    9.0,   // Level 12
    11.0,  // Level 13
    14.0,  // Level 14
    18.0,  // Level 15
    22.0,  // Level 16
    28.0,  // Level 17
    35.0,  // Level 18
    45.0,  // Level 19
    60.0,  // Level 20
  ],
  lockDelay: 400,
};

// -----------------------------------------------------------------------------
// Journey Mode Stages
// -----------------------------------------------------------------------------

export const JOURNEY_STAGES: StageInfo[] = [
  // Area 1: Calm beginnings
  {
    id: 'stage-1-ocean',
    name: 'The Deep',
    theme: 'ocean',
    clearGoal: 30,
    speedCurve: BEGINNER_SPEED_CURVE,
    musicTrack: 'ocean',
  },
  {
    id: 'stage-2-forest',
    name: 'Forest Dawn',
    theme: 'forest',
    clearGoal: 40,
    speedCurve: BEGINNER_SPEED_CURVE,
    musicTrack: 'forest',
  },
  
  // Area 2: Building intensity
  {
    id: 'stage-3-desert',
    name: 'Desert Wind',
    theme: 'desert',
    clearGoal: 50,
    speedCurve: STANDARD_SPEED_CURVE,
    musicTrack: 'desert',
  },
  {
    id: 'stage-4-city',
    name: 'Neon City',
    theme: 'city',
    clearGoal: 60,
    speedCurve: STANDARD_SPEED_CURVE,
    musicTrack: 'city',
  },
  
  // Area 3: Challenge stages
  {
    id: 'stage-5-aurora',
    name: 'Aurora',
    theme: 'aurora',
    clearGoal: 80,
    speedCurve: STANDARD_SPEED_CURVE,
    musicTrack: 'aurora',
  },
  {
    id: 'stage-6-cosmos',
    name: 'Cosmos',
    theme: 'cosmos',
    clearGoal: 100,
    speedCurve: STANDARD_SPEED_CURVE,
    musicTrack: 'cosmos',
  },
  
  // Area 4: Master stages
  {
    id: 'stage-7-storm',
    name: 'Storm',
    theme: 'storm',
    clearGoal: 120,
    speedCurve: MASTER_SPEED_CURVE,
    musicTrack: 'storm',
  },
  {
    id: 'stage-8-finale',
    name: 'Metamorphosis',
    theme: 'finale',
    clearGoal: 150,
    speedCurve: MASTER_SPEED_CURVE,
    musicTrack: 'finale',
  },
];

// -----------------------------------------------------------------------------
// Stage Utilities
// -----------------------------------------------------------------------------

/**
 * Get a stage by ID
 */
export function getStageById(id: string): StageInfo | undefined {
  return JOURNEY_STAGES.find(stage => stage.id === id);
}

/**
 * Get stage index
 */
export function getStageIndex(id: string): number {
  return JOURNEY_STAGES.findIndex(stage => stage.id === id);
}

/**
 * Get next stage after completing one
 */
export function getNextStage(currentId: string): StageInfo | null {
  const index = getStageIndex(currentId);
  if (index === -1 || index >= JOURNEY_STAGES.length - 1) {
    return null;
  }
  return JOURNEY_STAGES[index + 1] ?? null;
}

/**
 * Check if all stages are completed
 */
export function isJourneyComplete(progress: JourneyProgress): boolean {
  return JOURNEY_STAGES.every(stage => progress.completedStages.includes(stage.id));
}

// -----------------------------------------------------------------------------
// Gravity Calculation
// -----------------------------------------------------------------------------

/**
 * Get gravity (cells per second) for a given level and speed curve
 */
export function getGravity(level: number, speedCurve: SpeedCurve): number {
  const adjustedLevel = level - speedCurve.startLevel;
  const index = Math.max(0, Math.min(adjustedLevel, speedCurve.gravity.length - 1));
  return speedCurve.gravity[index] ?? 1;
}

/**
 * Convert gravity (cells/second) to drop interval (milliseconds)
 */
export function gravityToInterval(gravity: number): number {
  if (gravity >= 20) {
    // 20G mode: essentially instant drop
    return 0;
  }
  return Math.floor(1000 / gravity);
}

/**
 * Calculate level from lines cleared
 */
export function calculateLevel(linesCleared: number, startLevel: number = 1): number {
  return startLevel + Math.floor(linesCleared / 10);
}

// -----------------------------------------------------------------------------
// Progress Management
// -----------------------------------------------------------------------------

const PROGRESS_KEY = 'tetris_journey_progress';

/**
 * Create empty progress
 */
export function createEmptyProgress(): JourneyProgress {
  return {
    completedStages: [],
    currentStage: null,
    highScores: {},
  };
}

/**
 * Load progress from localStorage
 */
export function loadProgress(): JourneyProgress {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    if (!data) return createEmptyProgress();
    return JSON.parse(data);
  } catch {
    return createEmptyProgress();
  }
}

/**
 * Save progress to localStorage
 */
export function saveProgress(progress: JourneyProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Storage might be full or unavailable
    console.warn('Failed to save progress');
  }
}

/**
 * Mark a stage as completed
 */
export function completeStage(
  progress: JourneyProgress,
  stageId: string,
  score: number
): JourneyProgress {
  const newProgress = { ...progress };
  
  // Add to completed if not already
  if (!newProgress.completedStages.includes(stageId)) {
    newProgress.completedStages.push(stageId);
  }
  
  // Update high score
  if (!newProgress.highScores[stageId] || score > newProgress.highScores[stageId]) {
    newProgress.highScores[stageId] = score;
  }
  
  // Set current stage to next (or null if finished)
  const nextStage = getNextStage(stageId);
  newProgress.currentStage = nextStage?.id ?? null;
  
  return newProgress;
}

/**
 * Reset progress
 */
export function resetProgress(): JourneyProgress {
  const emptyProgress = createEmptyProgress();
  saveProgress(emptyProgress);
  return emptyProgress;
}

// -----------------------------------------------------------------------------
// Stage Unlock Logic
// -----------------------------------------------------------------------------

/**
 * Get all unlocked stages
 */
export function getUnlockedStages(progress: JourneyProgress): StageInfo[] {
  const unlocked: StageInfo[] = [];
  
  for (let i = 0; i < JOURNEY_STAGES.length; i++) {
    const stage = JOURNEY_STAGES[i];
    if (!stage) continue;
    
    // First stage is always unlocked
    if (i === 0) {
      unlocked.push(stage);
      continue;
    }
    
    // Other stages require previous to be completed
    const previousStage = JOURNEY_STAGES[i - 1];
    if (previousStage && progress.completedStages.includes(previousStage.id)) {
      unlocked.push(stage);
    }
  }
  
  return unlocked;
}

/**
 * Check if a specific stage is unlocked
 */
export function isStageUnlocked(stageId: string, progress: JourneyProgress): boolean {
  const unlocked = getUnlockedStages(progress);
  return unlocked.some(stage => stage.id === stageId);
}

// -----------------------------------------------------------------------------
// Theme Data (for future visual customization)
// -----------------------------------------------------------------------------

export interface ThemeColors {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

export const THEME_COLORS: Record<string, ThemeColors> = {
  ocean: {
    background: '#0a1628',
    primary: '#0077be',
    secondary: '#00a8e8',
    accent: '#00f0f0',
    text: '#ffffff',
  },
  forest: {
    background: '#0a1f0a',
    primary: '#228b22',
    secondary: '#32cd32',
    accent: '#90ee90',
    text: '#ffffff',
  },
  desert: {
    background: '#2a1810',
    primary: '#d2691e',
    secondary: '#f4a460',
    accent: '#ffd700',
    text: '#ffffff',
  },
  city: {
    background: '#0f0f1a',
    primary: '#ff00ff',
    secondary: '#00ffff',
    accent: '#ffff00',
    text: '#ffffff',
  },
  aurora: {
    background: '#0a0a1a',
    primary: '#4a0080',
    secondary: '#00ff80',
    accent: '#ff80ff',
    text: '#ffffff',
  },
  cosmos: {
    background: '#000010',
    primary: '#1a1a4e',
    secondary: '#4a4a9e',
    accent: '#ffffff',
    text: '#ffffff',
  },
  storm: {
    background: '#1a1a2e',
    primary: '#4a4a6e',
    secondary: '#8080a0',
    accent: '#ffff00',
    text: '#ffffff',
  },
  finale: {
    background: '#000000',
    primary: '#ff0000',
    secondary: '#ff8000',
    accent: '#ffff00',
    text: '#ffffff',
  },
};

const DEFAULT_THEME: ThemeColors = {
  background: '#0a1628',
  primary: '#0077be',
  secondary: '#00a8e8',
  accent: '#00f0f0',
  text: '#ffffff',
};

/**
 * Get theme colors for a stage
 */
export function getThemeColors(theme: string): ThemeColors {
  return THEME_COLORS[theme] ?? DEFAULT_THEME;
}
