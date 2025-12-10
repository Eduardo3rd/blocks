// =============================================================================
// AUDIO SYSTEM - Project Synesthesia
// Web Audio API based audio with quantized SFX and layered music
// =============================================================================

import { ClearType } from '../engine/types';
import { useEffect, useRef, useCallback } from 'react';

// -----------------------------------------------------------------------------
// Sound Effect Types
// -----------------------------------------------------------------------------

export type SoundEffect =
  | 'move'
  | 'rotate'
  | 'rotateFail'
  | 'softDrop'
  | 'hardDrop'
  | 'lock'
  | 'hold'
  | 'lineClear'
  | 'tetris'
  | 'tSpin'
  | 'combo'
  | 'backToBack'
  | 'perfectClear'
  | 'levelUp'
  | 'zoneActivate'
  | 'zoneTick'
  | 'zoneEnd'
  | 'gameOver'
  | 'menuSelect'
  | 'menuBack';

// Musical scale for quantized SFX (C Major Pentatonic)
const SCALE_FREQUENCIES = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
];

// -----------------------------------------------------------------------------
// Audio System Class
// -----------------------------------------------------------------------------

export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  private enabled: boolean = true;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.5;
  private currentMusicTrack: string | null = null;
  private isZoneActive: boolean = false;
  
  // Music layers
  private musicLayers: AudioBufferSourceNode[] = [];
  private musicLayerGains: GainNode[] = [];
  private currentLevel: number = 1;
  
  // Low-pass filter for Zone mode effect
  private zoneFilter: BiquadFilterNode | null = null;
  
  // Note index for quantized rotation sounds
  private noteIndex: number = 0;
  
  constructor() {
    // Audio context will be created on first user interaction
  }
  
  // ---------------------------------------------------------------------------
  // Initialization (must be called from user gesture)
  // ---------------------------------------------------------------------------
  
  async initialize(): Promise<void> {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new AudioContext();
      
      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      
      // Create SFX gain
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
      
      // Create music gain with zone filter
      this.zoneFilter = this.audioContext.createBiquadFilter();
      this.zoneFilter.type = 'lowpass';
      this.zoneFilter.frequency.value = 20000; // Full frequency when not in zone
      this.zoneFilter.Q.value = 1;
      
      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.zoneFilter);
      this.zoneFilter.connect(this.masterGain);
      
      console.log('[Audio] Initialized');
    } catch (error) {
      console.error('[Audio] Failed to initialize:', error);
    }
  }
  
  // Ensure context is running (for browsers that suspend audio)
  // OPTIMIZED: Non-blocking - don't await, just fire and forget
  private ensureContextRunning(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume().catch(() => {
        // Ignore errors - context will be resumed on next user interaction
      });
    }
  }
  
  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------
  
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
  
  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }
  
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume;
    }
  }
  
  // ---------------------------------------------------------------------------
  // Quantized Sound Effects (Synthesized)
  // ---------------------------------------------------------------------------
  
  /**
   * Play a quantized tone based on piece height
   * Higher Y position = higher pitch (from the scale)
   */
  playQuantizedTone(heightRatio: number = 0.5, duration: number = 0.1): void {
    if (!this.enabled || !this.audioContext || !this.sfxGain) return;
    
    this.ensureContextRunning();
    
    // Select note based on height ratio (0-1)
    const noteIndex = Math.floor(heightRatio * (SCALE_FREQUENCIES.length - 1));
    const frequency = SCALE_FREQUENCIES[noteIndex] ?? SCALE_FREQUENCIES[0] ?? 440;
    
    const now = this.audioContext.currentTime;
    
    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    // Create envelope
    const envelope = this.audioContext.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.3, now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.connect(envelope);
    envelope.connect(this.sfxGain);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
  
  /**
   * Play rotation sound - cycles through scale notes
   */
  playRotateSound(): void {
    if (!this.enabled || !this.audioContext || !this.sfxGain) return;
    
    this.ensureContextRunning();
    
    const frequency = SCALE_FREQUENCIES[this.noteIndex];
    this.noteIndex = (this.noteIndex + 1) % SCALE_FREQUENCIES.length;
    
    const now = this.audioContext.currentTime;
    
    // Create oscillator for main tone
    const osc1 = this.audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = frequency || 440;
    
    // Add slight harmonic
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = (frequency || 440) * 2;
    
    // Envelope
    const envelope = this.audioContext.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.15, now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    const envelope2 = this.audioContext.createGain();
    envelope2.gain.setValueAtTime(0, now);
    envelope2.gain.linearRampToValueAtTime(0.05, now + 0.01);
    envelope2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc1.connect(envelope);
    osc2.connect(envelope2);
    envelope.connect(this.sfxGain);
    envelope2.connect(this.sfxGain);
    
    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now);
    osc2.stop(now + 0.1);
  }
  
  /**
   * Play hard drop impact sound
   */
  playHardDropSound(): void {
    if (!this.enabled || !this.audioContext || !this.sfxGain) return;
    
    this.ensureContextRunning();
    
    const now = this.audioContext.currentTime;
    
    // Low thud
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    
    // Noise burst
    const noiseBuffer = this.createNoiseBuffer(0.1);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    // High pass filter for noise
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.15);
    noise.start(now);
    noise.stop(now + 0.1);
  }
  
  /**
   * Play line clear sound
   */
  playLineClearSound(lineCount: number): void {
    if (!this.enabled || !this.audioContext || !this.sfxGain) return;
    
    this.ensureContextRunning();
    
    const now = this.audioContext.currentTime;
    
    // Base frequency increases with line count
    const baseFreq = 400 + (lineCount * 100);
    
    // Arpeggio up
    for (let i = 0; i < lineCount; i++) {
      const freq = baseFreq * Math.pow(1.25, i);
      const startTime = now + (i * 0.05);
      
      const osc = this.audioContext.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const env = this.audioContext.createGain();
      env.gain.setValueAtTime(0, startTime);
      env.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
      
      osc.connect(env);
      env.connect(this.sfxGain);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    }
  }
  
  /**
   * Play tetris (4-line) sound
   */
  playTetrisSound(): void {
    if (!this.enabled || !this.audioContext || !this.sfxGain) return;
    
    this.ensureContextRunning();
    
    const now = this.audioContext.currentTime;
    
    // Triumphant chord arpeggio (C major)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    
    notes.forEach((freq, i) => {
      const startTime = now + (i * 0.04);
      
      const osc = this.audioContext!.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      const filter = this.audioContext!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, startTime);
      filter.frequency.linearRampToValueAtTime(500, startTime + 0.3);
      
      const env = this.audioContext!.createGain();
      env.gain.setValueAtTime(0, startTime);
      env.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      
      osc.connect(filter);
      filter.connect(env);
      env.connect(this.sfxGain!);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }
  
  // ---------------------------------------------------------------------------
  // Helper: Create noise buffer
  // ---------------------------------------------------------------------------
  
  private createNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.audioContext!.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext!.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }
  
  // ---------------------------------------------------------------------------
  // Main SFX Interface
  // ---------------------------------------------------------------------------
  
  playSfx(effect: SoundEffect): void {
    if (!this.enabled) return;
    
    // Initialize on first interaction if needed
    if (!this.audioContext) {
      this.initialize();
      return;
    }
    
    switch (effect) {
      case 'rotate':
        this.playRotateSound();
        break;
      case 'hardDrop':
        this.playHardDropSound();
        break;
      case 'lineClear':
        this.playLineClearSound(1);
        break;
      case 'tetris':
        this.playTetrisSound();
        break;
      case 'move':
        this.playQuantizedTone(0.3, 0.05);
        break;
      case 'lock':
        this.playQuantizedTone(0.2, 0.08);
        break;
      case 'hold':
        this.playQuantizedTone(0.6, 0.1);
        break;
      case 'softDrop':
        this.playQuantizedTone(0.1, 0.03);
        break;
      case 'tSpin':
        this.playLineClearSound(3);
        break;
      case 'combo':
        this.playQuantizedTone(0.7, 0.15);
        break;
      case 'levelUp':
        this.playTetrisSound();
        break;
      case 'zoneActivate':
        this.playQuantizedTone(0.9, 0.3);
        break;
      case 'zoneEnd':
        this.playLineClearSound(4);
        break;
      default:
        console.debug(`[Audio] SFX: ${effect}`);
    }
  }
  
  /**
   * Play appropriate sound for a line clear
   */
  playClearSound(clearType: ClearType, combo: number, backToBack: boolean): void {
    if (!this.enabled) return;
    
    // Determine which sound to play based on clear type
    if (clearType === 'tetris') {
      this.playSfx('tetris');
    } else if (clearType.startsWith('tSpin')) {
      this.playSfx('tSpin');
    } else if (clearType === 'allClear') {
      this.playTetrisSound();
      this.playTetrisSound(); // Double for emphasis
    } else {
      const lineCount = clearType === 'single' ? 1 :
                       clearType === 'double' ? 2 :
                       clearType === 'triple' ? 3 : 1;
      this.playLineClearSound(lineCount);
    }
    
    // Additional sounds for combos and B2B
    if (combo > 1) {
      setTimeout(() => this.playSfx('combo'), 100);
    }
    
    if (backToBack) {
      setTimeout(() => this.playQuantizedTone(0.8, 0.2), 150);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Zone Mode Audio Effects
  // ---------------------------------------------------------------------------
  
  setZoneMode(active: boolean): void {
    this.isZoneActive = active;
    
    if (!this.zoneFilter || !this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    if (active) {
      // Apply low-pass filter for "underwater" effect
      this.zoneFilter.frequency.linearRampToValueAtTime(800, now + 0.3);
    } else {
      // Remove filter
      this.zoneFilter.frequency.linearRampToValueAtTime(20000, now + 0.3);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Music (Placeholder - would need actual audio files)
  // ---------------------------------------------------------------------------
  
  playMusic(track: string): void {
    if (!this.enabled) return;
    
    if (this.currentMusicTrack === track) return;
    
    this.currentMusicTrack = track;
    console.debug(`[Audio] Play music: ${track}`);
  }
  
  stopMusic(): void {
    this.currentMusicTrack = null;
    this.musicLayers.forEach(layer => {
      try {
        layer.stop();
      } catch {
        // Ignore errors if already stopped
      }
    });
    this.musicLayers = [];
    console.debug('[Audio] Stop music');
  }
  
  pauseMusic(): void {
    if (this.audioContext?.state === 'running') {
      this.audioContext.suspend();
    }
  }
  
  resumeMusic(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  /**
   * Set music intensity based on level
   * Controls which layers are active
   */
  setMusicIntensity(level: number): void {
    this.currentLevel = level;
    
    // In a full implementation, this would:
    // - Unmute bass layer at level 1
    // - Add percussion at level 5
    // - Add melody at level 10
    console.debug(`[Audio] Music intensity for level: ${level}`);
  }
  
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  
  destroy(): void {
    this.stopMusic();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.zoneFilter = null;
  }
}

// -----------------------------------------------------------------------------
// Singleton Instance
// -----------------------------------------------------------------------------

let audioInstance: AudioSystem | null = null;

export function getAudioSystem(): AudioSystem {
  if (!audioInstance) {
    audioInstance = new AudioSystem();
  }
  return audioInstance;
}

// -----------------------------------------------------------------------------
// React Hook
// -----------------------------------------------------------------------------

export function useAudio(): AudioSystem {
  const audioRef = useRef<AudioSystem>(getAudioSystem());
  
  useEffect(() => {
    // Initialize on mount
    const initAudio = () => {
      audioRef.current.initialize();
      // Remove listener after first interaction
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);
  
  return audioRef.current;
}

// -----------------------------------------------------------------------------
// Game Event Audio Hook
// -----------------------------------------------------------------------------

import { GameEvent } from '../engine/types';

export function useGameAudio(
  addEventListener: (listener: (event: GameEvent) => void) => () => void,
  level: number,
  isZoneActive: boolean
): AudioSystem {
  const audio = useAudio();
  
  // Update music intensity based on level
  useEffect(() => {
    audio.setMusicIntensity(level);
  }, [audio, level]);
  
  // Handle zone mode audio
  useEffect(() => {
    audio.setZoneMode(isZoneActive);
  }, [audio, isZoneActive]);
  
  // Handle game events
  useEffect(() => {
    const unsubscribe = addEventListener((event: GameEvent) => {
      switch (event.type) {
        case 'pieceMoved':
          audio.playSfx('move');
          break;
        case 'pieceRotated':
          audio.playSfx('rotate');
          break;
        case 'pieceLocked':
          audio.playSfx('lock');
          break;
        case 'linesCleared':
          audio.playClearSound(event.clearType, 0, false);
          break;
        case 'hold':
          audio.playSfx('hold');
          break;
        case 'levelUp':
          audio.playSfx('levelUp');
          break;
        case 'zoneActivated':
          audio.playSfx('zoneActivate');
          break;
        case 'zoneEnded':
          audio.playSfx('zoneEnd');
          break;
        case 'gameOver':
          audio.playSfx('gameOver');
          break;
        case 'comboIncreased':
          if (event.count > 1) {
            audio.playSfx('combo');
          }
          break;
        case 'backToBack':
          audio.playQuantizedTone(0.8, 0.2);
          break;
      }
    });
    
    return unsubscribe;
  }, [addEventListener, audio]);
  
  return audio;
}
