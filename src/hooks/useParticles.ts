// =============================================================================
// PARTICLE SYSTEM HOOK - Project Synesthesia
// React integration for the particle system
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { ParticleSystem, createParticleSystem } from '../engine/ParticleSystem';
import { GameEvent } from '../engine/types';
import { PIECE_COLORS } from '../engine/Piece';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface UseParticlesReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  emitHardDrop: (x: number, y: number, color: string, width?: number) => void;
  emitLineClear: (y: number, colors: string[]) => void;
  emitLockPiece: (cells: { x: number; y: number }[], color: string) => void;
  clear: () => void;
}

// Board dimensions for coordinate mapping
const CELL_SIZE = 27;
const BOARD_PADDING = 14;  // Account for board wrapper padding

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

export function useParticles(): UseParticlesReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  
  // Initialize particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create particle system
    const ps = createParticleSystem();
    ps.attach(canvas);
    ps.start();
    particleSystemRef.current = ps;
    
    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        ps.resize(width, height);
      }
    });
    
    // Observe parent container
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
      // Initial size
      const rect = canvas.parentElement.getBoundingClientRect();
      ps.resize(rect.width, rect.height);
    }
    
    return () => {
      resizeObserver.disconnect();
      ps.stop();
      ps.detach();
      particleSystemRef.current = null;
    };
  }, []);
  
  // Emit hard drop particles
  const emitHardDrop = useCallback((x: number, y: number, color: string, width: number = 1) => {
    const ps = particleSystemRef.current;
    if (!ps) return;
    
    // Convert grid coordinates to canvas coordinates
    const canvasX = BOARD_PADDING + x * CELL_SIZE + CELL_SIZE / 2;
    const canvasY = BOARD_PADDING + y * CELL_SIZE + CELL_SIZE;
    
    ps.emitHardDrop(canvasX, canvasY, color, width);
  }, []);
  
  // Emit line clear particles
  const emitLineClear = useCallback((y: number, colors: string[]) => {
    const ps = particleSystemRef.current;
    if (!ps) return;
    
    const canvasY = BOARD_PADDING + y * CELL_SIZE + CELL_SIZE / 2;
    ps.emitLineClear(canvasY, 10, colors);
  }, []);
  
  // Emit lock piece particles
  const emitLockPiece = useCallback((cells: { x: number; y: number }[], color: string) => {
    const ps = particleSystemRef.current;
    if (!ps) return;
    
    // Convert grid coordinates to canvas coordinates
    const canvasCells = cells.map(cell => ({
      x: BOARD_PADDING + cell.x * CELL_SIZE + CELL_SIZE / 2,
      y: BOARD_PADDING + cell.y * CELL_SIZE + CELL_SIZE / 2,
    }));
    
    ps.emitLockPiece(canvasCells, color);
  }, []);
  
  // Clear all particles
  const clear = useCallback(() => {
    particleSystemRef.current?.clear();
  }, []);
  
  return {
    canvasRef,
    emitHardDrop,
    emitLineClear,
    emitLockPiece,
    clear,
  };
}

// -----------------------------------------------------------------------------
// Game Event Handler Hook
// -----------------------------------------------------------------------------

/**
 * Hook that automatically emits particles based on game events
 */
export function useParticleEffects(
  addEventListener: (listener: (event: GameEvent) => void) => () => void
): UseParticlesReturn {
  const particles = useParticles();
  
  useEffect(() => {
    const unsubscribe = addEventListener((event: GameEvent) => {
      switch (event.type) {
        case 'pieceLocked':
          // Emit subtle lock effect
          // Note: We'd need piece cells here, which isn't in the current event
          break;
          
        case 'linesCleared':
          // Emit line clear particles for each cleared line
          for (const lineY of event.lines) {
            // Get colors for the line (we'd need board state for accurate colors)
            // For now, use a gradient based on clear type
            const baseColor = event.clearType === 'tetris' ? '#00f0f0' :
                             event.clearType.includes('tSpin') ? '#a000f0' :
                             '#60a0ff';
            particles.emitLineClear(lineY, [baseColor]);
          }
          break;
      }
    });
    
    return unsubscribe;
  }, [addEventListener, particles]);
  
  return particles;
}

export default useParticles;
