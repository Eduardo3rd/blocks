// =============================================================================
// TETRIS EFFECT CLONE - GAME ENGINE
// Main game loop, state machine, and event coordination
// =============================================================================

import {
  GameState,
  GamePhase,
  GameEvent,
  GameEventListener,
  Tetromino,
  TetrominoType,
  Board,
  ClearType,
  LockState,
  ComboState,
  ZoneState,
  InputAction,
  StageInfo,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  LOCK_DELAY_DEFAULT,
  MAX_LOCK_RESETS,
  ZONE_MAX_METER,
  ZONE_DURATION,
  ZONE_FILL_PER_LINE,
} from './types';
import {
  createEmptyBoard,
  checkCollision,
  movePiece,
  rotatePiece,
  rotatePiece180,
  lockPiece,
  findCompletedLines,
  clearLines,
  zonePushLinesToBottom,
  clearZoneLines,
  isPerfectClear,
  detectTSpin,
  determineClearType,
  isDifficultClear,
  getGhostY,
  hardDrop as boardHardDrop,
  isOnGround,
  canSpawn,
} from './Board';
import {
  createPiece,
  createBagGenerator,
  clonePiece,
} from './Piece';

// -----------------------------------------------------------------------------
// Game Engine Class
// -----------------------------------------------------------------------------

export class GameEngine {
  private state: GameState;
  private listeners: GameEventListener[] = [];
  private bagGenerator: () => TetrominoType;
  private lastFrameTime: number = 0;
  private gravityAccumulator: number = 0;
  private lastRotationWasWallKick: boolean = false;
  
  constructor(stage?: StageInfo) {
    this.bagGenerator = createBagGenerator();
    this.state = this.createInitialState(stage);
  }
  
  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  
  private createInitialState(stage?: StageInfo): GameState {
    const nextPieces: TetrominoType[] = [];
    for (let i = 0; i < 5; i++) {
      nextPieces.push(this.bagGenerator());
    }
    
    return {
      phase: 'idle',
      board: createEmptyBoard(),
      currentPiece: null,
      ghostY: 0,
      holdPiece: null,
      canHold: true,
      nextPieces,
      score: 0,
      level: stage?.speedCurve.startLevel ?? 1,
      linesCleared: 0,
      lock: this.createLockState(),
      combo: this.createComboState(),
      zone: this.createZoneState(),
      lastClear: null,
      stage: stage ?? null,
    };
  }
  
  private createLockState(): LockState {
    return {
      isLocking: false,
      lockTimer: LOCK_DELAY_DEFAULT,
      moveResets: 0,
      lowestY: 0,
    };
  }
  
  private createComboState(): ComboState {
    return {
      count: 0,
      backToBack: false,
      lastClearType: null,
    };
  }
  
  private createZoneState(): ZoneState {
    return {
      meter: 0,
      isActive: false,
      stackedLines: 0,
      timeRemaining: ZONE_DURATION,
    };
  }
  
  getState(): GameState {
    return this.state;
  }
  
  // ---------------------------------------------------------------------------
  // Event System
  // ---------------------------------------------------------------------------
  
  addEventListener(listener: GameEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  private emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Game Flow
  // ---------------------------------------------------------------------------
  
  start(): void {
    if (this.state.phase !== 'idle') return;
    
    this.state = {
      ...this.state,
      phase: 'playing',
    };
    
    this.spawnNextPiece();
  }
  
  pause(): void {
    if (this.state.phase === 'playing') {
      this.state = { ...this.state, phase: 'paused' };
    } else if (this.state.phase === 'paused') {
      this.state = { ...this.state, phase: 'playing' };
    }
  }
  
  restart(stage?: StageInfo): void {
    this.bagGenerator = createBagGenerator();
    this.state = this.createInitialState(stage ?? this.state.stage ?? undefined);
    this.lastRotationWasWallKick = false;
    this.gravityAccumulator = 0;
  }
  
  private gameOver(): void {
    this.state = { ...this.state, phase: 'gameOver' };
    this.emit({ type: 'gameOver', finalScore: this.state.score });
  }
  
  // ---------------------------------------------------------------------------
  // Piece Spawning
  // ---------------------------------------------------------------------------
  
  private spawnNextPiece(): void {
    const nextType = this.state.nextPieces[0];
    if (!nextType) {
      this.gameOver();
      return;
    }
    const newPiece = createPiece(nextType);
    
    // Check if piece can spawn
    if (!canSpawn(this.state.board, newPiece)) {
      this.gameOver();
      return;
    }
    
    // Update next queue
    const newNextPieces = [...this.state.nextPieces.slice(1), this.bagGenerator()];
    
    this.state = {
      ...this.state,
      currentPiece: newPiece,
      ghostY: getGhostY(this.state.board, newPiece),
      nextPieces: newNextPieces,
      canHold: true,
      lock: this.createLockState(),
    };
    
    this.lastRotationWasWallKick = false;
    this.emit({ type: 'pieceSpawned', piece: newPiece });
  }
  
  // ---------------------------------------------------------------------------
  // Input Handling
  // ---------------------------------------------------------------------------
  
  handleInput(action: InputAction): void {
    if (this.state.phase !== 'playing' && this.state.phase !== 'zoneActive') {
      if (action === 'pause' && this.state.phase === 'paused') {
        this.pause();
      }
      return;
    }
    
    if (!this.state.currentPiece) return;
    
    switch (action) {
      case 'moveLeft':
        this.move(-1, 0);
        break;
      case 'moveRight':
        this.move(1, 0);
        break;
      case 'softDrop':
        this.move(0, 1, true);
        break;
      case 'hardDrop':
        this.doHardDrop();
        break;
      case 'rotateCW':
        this.rotate(true);
        break;
      case 'rotateCCW':
        this.rotate(false);
        break;
      case 'rotate180':
        this.rotate180();
        break;
      case 'hold':
        this.hold();
        break;
      case 'zone':
        this.activateZone();
        break;
      case 'pause':
        this.pause();
        break;
    }
  }
  
  private move(dx: number, dy: number, isSoftDrop: boolean = false): void {
    if (!this.state.currentPiece) return;
    
    const newPiece = movePiece(this.state.board, this.state.currentPiece, dx, dy);
    
    if (newPiece) {
      // OPTIMIZED: Direct mutation for high-frequency operations
      this.state.currentPiece = newPiece;
      this.state.ghostY = getGhostY(this.state.board, newPiece);
      
      // Award soft drop points
      if (isSoftDrop) {
        this.state.score += 1;
      }
      
      // Reset lock delay if moving horizontally while on ground
      if (dx !== 0 && isOnGround(this.state.board, newPiece)) {
        this.resetLockDelay(newPiece.position.y);
      }
      
      // Cancel lock if moved down
      if (dy > 0) {
        this.state.lock.isLocking = false;
      }
      
      this.lastRotationWasWallKick = false;
      this.emit({ type: 'pieceMoved', piece: newPiece });
    } else if (dy > 0) {
      // Couldn't move down - start lock
      this.startLock();
    }
  }
  
  private rotate(clockwise: boolean): void {
    if (!this.state.currentPiece) return;
    
    const result = rotatePiece(this.state.board, this.state.currentPiece, clockwise);
    
    if (result) {
      // OPTIMIZED: Direct mutation
      this.state.currentPiece = result.piece;
      this.state.ghostY = getGhostY(this.state.board, result.piece);
      this.lastRotationWasWallKick = result.wallKickUsed;
      
      // Reset lock delay
      if (isOnGround(this.state.board, result.piece)) {
        this.resetLockDelay(result.piece.position.y);
      }
      
      this.emit({ type: 'pieceRotated', piece: result.piece, wallKick: result.wallKickUsed });
    }
  }
  
  private rotate180(): void {
    if (!this.state.currentPiece) return;
    
    const result = rotatePiece180(this.state.board, this.state.currentPiece);
    
    if (result) {
      // OPTIMIZED: Direct mutation
      this.state.currentPiece = result.piece;
      this.state.ghostY = getGhostY(this.state.board, result.piece);
      this.lastRotationWasWallKick = result.wallKickUsed;
      
      if (isOnGround(this.state.board, result.piece)) {
        this.resetLockDelay(result.piece.position.y);
      }
      
      this.emit({ type: 'pieceRotated', piece: result.piece, wallKick: result.wallKickUsed });
    }
  }
  
  private doHardDrop(): void {
    if (!this.state.currentPiece) return;
    
    const { piece, distance } = boardHardDrop(this.state.board, this.state.currentPiece);
    
    // OPTIMIZED: Direct mutation
    this.state.currentPiece = piece;
    this.state.score += distance * 2;
    
    this.emit({ type: 'pieceMoved', piece });
    
    // Immediately lock
    this.lockCurrentPiece();
  }
  
  private hold(): void {
    if (!this.state.canHold || !this.state.currentPiece) return;
    
    const currentType = this.state.currentPiece.type;
    
    if (this.state.holdPiece === null) {
      // First hold - take from next queue
      this.state = {
        ...this.state,
        holdPiece: currentType,
        canHold: false,
      };
      this.spawnNextPiece();
    } else {
      // Swap with held piece
      const heldType = this.state.holdPiece;
      const newPiece = createPiece(heldType);
      
      if (!canSpawn(this.state.board, newPiece)) {
        return; // Can't swap
      }
      
      this.state = {
        ...this.state,
        currentPiece: newPiece,
        ghostY: getGhostY(this.state.board, newPiece),
        holdPiece: currentType,
        canHold: false,
        lock: this.createLockState(),
      };
    }
    
    this.lastRotationWasWallKick = false;
    this.emit({ type: 'hold', piece: currentType });
  }
  
  // ---------------------------------------------------------------------------
  // Lock Delay System
  // ---------------------------------------------------------------------------
  
  private startLock(): void {
    if (this.state.lock.isLocking) return;
    
    const piece = this.state.currentPiece;
    if (!piece) return;
    
    // OPTIMIZED: Direct mutation
    this.state.lock.isLocking = true;
    this.state.lock.lockTimer = LOCK_DELAY_DEFAULT;
    this.state.lock.lowestY = piece.position.y;
  }
  
  private resetLockDelay(currentY: number): void {
    const lock = this.state.lock;
    
    // Only reset if we haven't exceeded max resets and piece is at or below lowest Y
    if (lock.moveResets >= MAX_LOCK_RESETS) return;
    if (currentY < lock.lowestY) return; // Piece moved up (shouldn't happen normally)
    
    // OPTIMIZED: Direct mutation
    lock.lockTimer = LOCK_DELAY_DEFAULT;
    lock.moveResets += 1;
    lock.lowestY = Math.max(lock.lowestY, currentY);
  }
  
  private lockCurrentPiece(): void {
    if (!this.state.currentPiece) return;
    
    const piece = this.state.currentPiece;
    
    // Detect T-spin before locking
    const tSpin = detectTSpin(this.state.board, piece, this.lastRotationWasWallKick);
    
    // Lock piece onto board
    let newBoard = lockPiece(this.state.board, piece);
    
    this.emit({ type: 'pieceLocked', piece });
    
    // Find and clear lines (exclude zone lines at the bottom)
    const zoneLinesToExclude = this.state.phase === 'zoneActive' ? this.state.zone.stackedLines : 0;
    const completedLines = findCompletedLines(newBoard, zoneLinesToExclude);
    
    if (completedLines.length > 0 || tSpin) {
      this.handleLineClear(newBoard, completedLines, tSpin);
    } else {
      // No lines cleared - reset combo
      this.state = {
        ...this.state,
        board: newBoard,
        currentPiece: null,
        combo: { ...this.state.combo, count: 0 },
      };
      
      this.spawnNextPiece();
    }
  }
  
  // ---------------------------------------------------------------------------
  // Line Clear and Scoring
  // ---------------------------------------------------------------------------
  
  private handleLineClear(
    board: Board,
    lines: number[],
    tSpin: 'full' | 'mini' | null
  ): void {
    const isZoneActive = this.state.phase === 'zoneActive';
    
    if (isZoneActive && lines.length > 0) {
      // Zone mode: stack lines at bottom instead of clearing
      this.handleZoneLineClear(board, lines, tSpin);
      return;
    }
    
    // Clear the lines
    const newBoard = clearLines(board, lines);
    const perfectClear = lines.length > 0 && isPerfectClear(newBoard);
    
    // Determine clear type
    const clearType = determineClearType(lines.length, tSpin, perfectClear);
    const isDifficult = isDifficultClear(clearType);
    
    // Update combo
    const newCombo: ComboState = {
      count: lines.length > 0 ? this.state.combo.count + 1 : 0,
      backToBack: lines.length > 0 && isDifficult && this.state.combo.lastClearType !== null && isDifficultClear(this.state.combo.lastClearType),
      lastClearType: lines.length > 0 ? clearType : this.state.combo.lastClearType,
    };
    
    // Calculate score
    const score = this.calculateScore(clearType, lines.length, newCombo);
    
    // Update zone meter
    const newZoneMeter = Math.min(
      ZONE_MAX_METER,
      this.state.zone.meter + (lines.length * ZONE_FILL_PER_LINE)
    );
    
    // Update lines cleared and check level up
    const newLinesCleared = this.state.linesCleared + lines.length;
    const newLevel = Math.floor(newLinesCleared / 10) + 1;
    
    if (newLevel > this.state.level) {
      this.emit({ type: 'levelUp', level: newLevel });
    }
    
    this.state = {
      ...this.state,
      board: newBoard,
      currentPiece: null,
      score: this.state.score + score,
      level: newLevel,
      linesCleared: newLinesCleared,
      combo: newCombo,
      zone: { ...this.state.zone, meter: newZoneMeter },
      lastClear: {
        type: clearType,
        lines: lines.length,
        score,
        timestamp: Date.now(),
      },
    };
    
    // Emit events
    this.emit({ type: 'linesCleared', lines, clearType, score });
    
    if (newCombo.count > 1) {
      this.emit({ type: 'comboIncreased', count: newCombo.count });
    }
    
    if (newCombo.backToBack) {
      this.emit({ type: 'backToBack', clearType });
    }
    
    this.spawnNextPiece();
  }
  
  private calculateScore(clearType: ClearType, lines: number, combo: ComboState): number {
    const level = this.state.level;
    
    // Base scores
    const baseScores: Record<ClearType, number> = {
      single: 100,
      double: 300,
      triple: 500,
      tetris: 800,
      tSpinMini: 100,
      tSpinMiniSingle: 200,
      tSpinMiniDouble: 400,
      tSpin: 400,
      tSpinSingle: 800,
      tSpinDouble: 1200,
      tSpinTriple: 1600,
      allClear: 3500,
    };
    
    let score = (baseScores[clearType] || 0) * level;
    
    // Back-to-back bonus (1.5x)
    if (combo.backToBack && isDifficultClear(clearType)) {
      score = Math.floor(score * 1.5);
    }
    
    // Combo bonus
    if (combo.count > 0) {
      score += 50 * combo.count * level;
    }
    
    return score;
  }
  
  // ---------------------------------------------------------------------------
  // Zone System
  // ---------------------------------------------------------------------------
  
  private activateZone(): void {
    if (this.state.zone.meter < ZONE_MAX_METER) return;
    if (this.state.phase === 'zoneActive') return;
    
    this.state = {
      ...this.state,
      phase: 'zoneActive',
      zone: {
        ...this.state.zone,
        isActive: true,
        stackedLines: 0,
        timeRemaining: ZONE_DURATION,
      },
    };
    
    this.emit({ type: 'zoneActivated' });
  }
  
  private handleZoneLineClear(
    board: Board,
    lines: number[],
    tSpin: 'full' | 'mini' | null
  ): void {
    // In Zone mode, completed lines MOVE to the bottom (don't disappear!)
    // This is the signature Tetris Effect Zone mechanic:
    // - Completed lines stack at the bottom
    // - The blocks above shift down to fill the gaps
    // - Player continues playing on top of the zone lines
    // - When Zone ends, all stacked lines clear at once for massive points
    
    const currentStackedLines = this.state.zone.stackedLines;
    const newBoard = zonePushLinesToBottom(board, lines, currentStackedLines);
    const newStackedLines = currentStackedLines + lines.length;
    
    this.state = {
      ...this.state,
      board: newBoard,
      currentPiece: null,
      zone: {
        ...this.state.zone,
        stackedLines: newStackedLines,
      },
    };
    
    this.emit({ type: 'linesCleared', lines, clearType: 'single', score: 0 });
    
    this.spawnNextPiece();
  }
  
  private endZone(): void {
    const stackedLines = this.state.zone.stackedLines;
    
    // Clear all the zone lines that have stacked at the bottom
    const clearedBoard = clearZoneLines(this.state.board, stackedLines);
    
    // Calculate Zone clear bonus
    const zoneScore = this.calculateZoneScore(stackedLines);
    
    this.state = {
      ...this.state,
      phase: 'playing',
      board: clearedBoard,
      score: this.state.score + zoneScore,
      linesCleared: this.state.linesCleared + stackedLines,
      zone: {
        meter: 0,
        isActive: false,
        stackedLines: 0,
        timeRemaining: ZONE_DURATION,
      },
    };
    
    this.emit({ type: 'zoneEnded', linesCleared: stackedLines, score: zoneScore });
  }
  
  private calculateZoneScore(lines: number): number {
    // Zone scoring is exponential based on lines
    // Decuple (10) = massive bonus, etc.
    const level = this.state.level;
    
    if (lines === 0) return 0;
    if (lines <= 4) return lines * 200 * level;
    if (lines <= 9) return lines * 400 * level;
    if (lines <= 12) return lines * 800 * level;  // Decuple+
    if (lines <= 16) return lines * 1200 * level; // Dodecuple+
    return lines * 2000 * level; // Massive clears
  }
  
  // ---------------------------------------------------------------------------
  // Game Loop Update - Returns true if board state changed (for efficient rendering)
  // ---------------------------------------------------------------------------
  
  update(deltaTime: number): boolean {
    if (this.state.phase !== 'playing' && this.state.phase !== 'zoneActive') {
      return false;
    }
    
    let boardChanged = false;
    
    // Update Zone timer (mutate directly to avoid GC pressure)
    if (this.state.phase === 'zoneActive') {
      this.state.zone.timeRemaining -= deltaTime;
      
      if (this.state.zone.timeRemaining <= 0) {
        this.state.zone.timeRemaining = 0;
        this.endZone();
        boardChanged = true;
      }
      
      // No gravity in Zone mode
      return boardChanged;
    }
    
    // Apply gravity
    const gravityMoved = this.applyGravity(deltaTime);
    
    // Update lock delay (mutate directly to avoid GC pressure)
    if (this.state.lock.isLocking && this.state.currentPiece) {
      this.state.lock.lockTimer -= deltaTime;
      
      if (this.state.lock.lockTimer <= 0) {
        this.lockCurrentPiece();
        boardChanged = true;
      }
    }
    
    return boardChanged || gravityMoved;
  }
  
  private applyGravity(deltaTime: number): boolean {
    if (!this.state.currentPiece) return false;
    
    // Calculate gravity based on level
    // Gravity is in cells per second
    const gravity = this.getGravity();
    
    this.gravityAccumulator += gravity * (deltaTime / 1000);
    
    let pieceMoved = false;
    
    // Move down for each whole cell
    while (this.gravityAccumulator >= 1) {
      this.gravityAccumulator -= 1;
      
      const moved = movePiece(this.state.board, this.state.currentPiece!, 0, 1);
      
      if (moved) {
        // OPTIMIZED: Direct mutation for high-frequency updates
        this.state.currentPiece = moved;
        this.state.ghostY = getGhostY(this.state.board, moved);
        this.lastRotationWasWallKick = false;
        pieceMoved = true;
      } else {
        // Can't move down - start lock
        this.startLock();
        this.gravityAccumulator = 0;
        break;
      }
    }
    
    return pieceMoved;
  }
  
  private getGravity(): number {
    // Gravity curve (cells per second)
    // Based on modern Tetris guidelines
    const gravityTable: Record<number, number> = {
      1: 1,
      2: 1.2,
      3: 1.5,
      4: 1.8,
      5: 2.2,
      6: 2.7,
      7: 3.3,
      8: 4,
      9: 5,
      10: 6,
      11: 7.5,
      12: 9,
      13: 11,
      14: 14,
      15: 18,
      16: 22,
      17: 28,
      18: 35,
      19: 45,
      20: 60, // 20G approximation
    };
    
    const level = Math.min(this.state.level, 20);
    return gravityTable[level] ?? 60; // Default to 20G if not found
  }
}

// -----------------------------------------------------------------------------
// Factory Function
// -----------------------------------------------------------------------------

export function createGameEngine(stage?: StageInfo): GameEngine {
  return new GameEngine(stage);
}
