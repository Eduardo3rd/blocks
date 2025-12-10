// =============================================================================
// PARTICLE SYSTEM - Project Synesthesia
// High-performance particle effects for visual feedback
// Renders on a dedicated canvas for 60fps performance
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  type: ParticleType;
}

export type ParticleType = 'spark' | 'dust' | 'glow' | 'trail';

export interface EmitterConfig {
  x: number;
  y: number;
  count: number;
  color: string;
  spread: number;
  speed: number;
  size: number;
  life: number;
  gravity?: number | undefined;
  type?: ParticleType | undefined;
}

// Predefined effect configurations
export interface EffectConfig {
  hardDrop: Omit<EmitterConfig, 'x' | 'y' | 'color'>;
  lineClear: Omit<EmitterConfig, 'x' | 'y' | 'color'>;
  lockPiece: Omit<EmitterConfig, 'x' | 'y' | 'color'>;
}

// -----------------------------------------------------------------------------
// Particle System Class
// -----------------------------------------------------------------------------

export class ParticleSystem {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  
  // Performance: Pre-allocate particle pool
  private particlePool: Particle[] = [];
  private readonly MAX_PARTICLES = 500;
  
  // Effect configurations
  private readonly effects: EffectConfig = {
    hardDrop: {
      count: 20,
      spread: Math.PI / 2,  // 90 degrees
      speed: 8,
      size: 4,
      life: 600,
      gravity: 0.3,
      type: 'spark',
    },
    lineClear: {
      count: 30,
      spread: Math.PI,
      speed: 4,
      size: 3,
      life: 800,
      gravity: -0.1,  // Float upward
      type: 'dust',
    },
    lockPiece: {
      count: 8,
      spread: Math.PI * 2,
      speed: 2,
      size: 3,
      life: 400,
      gravity: 0,
      type: 'glow',
    },
  };
  
  constructor() {
    // Pre-allocate particle pool
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.particlePool.push(this.createEmptyParticle());
    }
  }
  
  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  
  /**
   * Attach to a canvas element
   */
  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    
    if (this.ctx) {
      // Enable smooth rendering
      this.ctx.imageSmoothingEnabled = true;
    }
  }
  
  /**
   * Detach from canvas and cleanup
   */
  detach(): void {
    this.stop();
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
  }
  
  /**
   * Resize canvas to match container
   */
  resize(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
  
  // ---------------------------------------------------------------------------
  // Particle Pool Management
  // ---------------------------------------------------------------------------
  
  private createEmptyParticle(): Particle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      size: 0,
      color: '#fff',
      alpha: 1,
      decay: 0,
      gravity: 0,
      type: 'spark',
    };
  }
  
  private getParticle(): Particle | null {
    // Try to reuse from pool
    const pooled = this.particlePool.pop();
    if (pooled) return pooled;
    
    // Create new if under limit
    if (this.particles.length < this.MAX_PARTICLES) {
      return this.createEmptyParticle();
    }
    
    return null;
  }
  
  private returnParticle(particle: Particle): void {
    if (this.particlePool.length < this.MAX_PARTICLES) {
      this.particlePool.push(particle);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Emitter Methods
  // ---------------------------------------------------------------------------
  
  /**
   * Emit particles at a position
   */
  emit(config: EmitterConfig): void {
    const {
      x, y, count, color, spread, speed, size, life,
      gravity = 0,
      type = 'spark',
    } = config;
    
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;
      
      // Calculate random direction within spread
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      const velocity = speed * (0.5 + Math.random() * 0.5);
      
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * velocity;
      particle.vy = Math.sin(angle) * velocity;
      particle.life = life;
      particle.maxLife = life;
      particle.size = size * (0.5 + Math.random() * 0.5);
      particle.color = color;
      particle.alpha = 1;
      particle.decay = 1 / life;
      particle.gravity = gravity;
      particle.type = type;
      
      this.particles.push(particle);
    }
  }
  
  /**
   * Hard drop effect - sparks burst upward from landing position
   */
  emitHardDrop(x: number, y: number, color: string, width: number = 1): void {
    const config = this.effects.hardDrop;
    
    // Emit along the width of the piece
    for (let i = 0; i < width; i++) {
      this.emit({
        x: x + i * 27 + 13,  // Center of each cell
        y,
        count: Math.floor(config.count / width),
        color,
        spread: config.spread,
        speed: config.speed,
        size: config.size,
        life: config.life,
        gravity: config.gravity,
        type: config.type,
      });
    }
  }
  
  /**
   * Line clear effect - particles dissolve from cleared line
   */
  emitLineClear(y: number, width: number, colors: string[]): void {
    const config = this.effects.lineClear;
    const cellWidth = 27;
    
    for (let i = 0; i < width; i++) {
      const color = colors[i % colors.length] || '#fff';
      this.emit({
        x: i * cellWidth + cellWidth / 2 + 12,  // Offset for board position
        y,
        count: Math.floor(config.count / width),
        color,
        spread: config.spread,
        speed: config.speed,
        size: config.size,
        life: config.life,
        gravity: config.gravity,
        type: config.type,
      });
    }
  }
  
  /**
   * Lock piece effect - subtle glow at lock position
   */
  emitLockPiece(cells: { x: number; y: number }[], color: string): void {
    const config = this.effects.lockPiece;
    const cellSize = 27;
    
    for (const cell of cells) {
      this.emit({
        x: cell.x * cellSize + cellSize / 2 + 12,
        y: cell.y * cellSize + cellSize / 2,
        count: config.count,
        color,
        spread: config.spread,
        speed: config.speed,
        size: config.size,
        life: config.life,
        gravity: config.gravity,
        type: config.type,
      });
    }
  }
  
  // ---------------------------------------------------------------------------
  // Animation Loop
  // ---------------------------------------------------------------------------
  
  /**
   * Start the particle animation loop
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.update.bind(this));
  }
  
  /**
   * Stop the animation loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  /**
   * Main update loop
   */
  private update(timestamp: number): void {
    if (!this.isRunning) return;
    
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Render
    this.render();
    
    // Continue loop
    this.animationId = requestAnimationFrame(this.update.bind(this));
  }
  
  /**
   * Update all particle physics
   */
  private updateParticles(deltaTime: number): void {
    const dt = deltaTime / 16.67;  // Normalize to ~60fps
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p) continue;
      
      // Update life
      p.life -= deltaTime;
      
      // Remove dead particles
      if (p.life <= 0) {
        this.returnParticle(p);
        this.particles.splice(i, 1);
        continue;
      }
      
      // Update alpha based on remaining life
      p.alpha = p.life / p.maxLife;
      
      // Apply gravity
      p.vy += p.gravity * dt;
      
      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Apply friction
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
  }
  
  /**
   * Render all particles to canvas
   */
  private render(): void {
    if (!this.ctx || !this.canvas) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render each particle
    for (const p of this.particles) {
      this.renderParticle(p);
    }
  }
  
  /**
   * Render a single particle
   */
  private renderParticle(p: Particle): void {
    if (!this.ctx) return;
    
    this.ctx.save();
    this.ctx.globalAlpha = p.alpha;
    
    switch (p.type) {
      case 'spark':
        this.renderSpark(p);
        break;
      case 'dust':
        this.renderDust(p);
        break;
      case 'glow':
        this.renderGlow(p);
        break;
      case 'trail':
        this.renderTrail(p);
        break;
    }
    
    this.ctx.restore();
  }
  
  /**
   * Render spark particle (sharp, bright)
   */
  private renderSpark(p: Particle): void {
    if (!this.ctx) return;
    
    // Core
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Glow
    this.ctx.fillStyle = p.color;
    this.ctx.shadowColor = p.color;
    this.ctx.shadowBlur = p.size * 2;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * Render dust particle (soft, fading)
   */
  private renderDust(p: Particle): void {
    if (!this.ctx) return;
    
    const gradient = this.ctx.createRadialGradient(
      p.x, p.y, 0,
      p.x, p.y, p.size
    );
    gradient.addColorStop(0, p.color);
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * Render glow particle (halo effect)
   */
  private renderGlow(p: Particle): void {
    if (!this.ctx) return;
    
    this.ctx.shadowColor = p.color;
    this.ctx.shadowBlur = p.size * 3;
    this.ctx.fillStyle = p.color;
    this.ctx.globalAlpha = p.alpha * 0.5;
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    this.ctx.fill();
  }
  
  /**
   * Render trail particle (elongated)
   */
  private renderTrail(p: Particle): void {
    if (!this.ctx) return;
    
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    const length = Math.max(speed * 2, p.size);
    const angle = Math.atan2(p.vy, p.vx);
    
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(angle);
    
    const gradient = this.ctx.createLinearGradient(-length, 0, p.size, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, p.color);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(-length, -p.size / 2, length + p.size, p.size);
    
    this.ctx.restore();
  }
  
  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------
  
  /**
   * Get current particle count
   */
  getParticleCount(): number {
    return this.particles.length;
  }
  
  /**
   * Clear all particles
   */
  clear(): void {
    for (const p of this.particles) {
      this.returnParticle(p);
    }
    this.particles = [];
    
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// -----------------------------------------------------------------------------
// Singleton Instance
// -----------------------------------------------------------------------------

let particleSystemInstance: ParticleSystem | null = null;

export function getParticleSystem(): ParticleSystem {
  if (!particleSystemInstance) {
    particleSystemInstance = new ParticleSystem();
  }
  return particleSystemInstance;
}

export function createParticleSystem(): ParticleSystem {
  return new ParticleSystem();
}
