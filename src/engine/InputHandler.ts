// =============================================================================
// TETRIS EFFECT CLONE - INPUT HANDLER
// DAS/ARR implementation, input buffering, keyboard/gamepad handling
// Gamepad mappings match Tetris Effect defaults
// =============================================================================

import { InputAction, InputConfig, DEFAULT_INPUT_CONFIG } from './types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type KeyBinding = {
  action: InputAction;
  keys: string[];  // KeyboardEvent.code values
};

export type InputCallback = (action: InputAction) => void;

interface KeyState {
  pressed: boolean;
  pressTime: number;
  lastRepeatTime: number;
}

// -----------------------------------------------------------------------------
// Default Key Bindings
// -----------------------------------------------------------------------------

export const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
  { action: 'moveLeft', keys: ['ArrowLeft', 'KeyA'] },
  { action: 'moveRight', keys: ['ArrowRight', 'KeyD'] },
  { action: 'softDrop', keys: ['ArrowDown', 'KeyS'] },
  { action: 'hardDrop', keys: ['Space', 'ArrowUp'] },
  { action: 'rotateCW', keys: ['KeyX', 'KeyW'] },
  { action: 'rotateCCW', keys: ['KeyZ', 'ControlLeft', 'ControlRight'] },
  { action: 'rotate180', keys: ['KeyA'] }, // Note: conflicts with moveLeft on some layouts
  { action: 'hold', keys: ['ShiftLeft', 'ShiftRight', 'KeyC'] },
  { action: 'zone', keys: ['KeyE', 'Enter'] },
  { action: 'pause', keys: ['Escape', 'KeyP'] },
];

// -----------------------------------------------------------------------------
// Input Handler Class
// -----------------------------------------------------------------------------

export class InputHandler {
  private config: InputConfig;
  private keyBindings: Map<string, InputAction> = new Map();
  private keyStates: Map<string, KeyState> = new Map();
  private callback: InputCallback | null = null;
  private animationFrameId: number | null = null;
  private enabled: boolean = false;
  
  // Actions that support DAS/ARR (auto-repeat)
  private repeatableActions: Set<InputAction> = new Set([
    'moveLeft',
    'moveRight',
    'softDrop',
  ]);
  
  constructor(config?: Partial<InputConfig>, bindings?: KeyBinding[]) {
    this.config = { ...DEFAULT_INPUT_CONFIG, ...config };
    this.setupBindings(bindings || DEFAULT_KEY_BINDINGS);
  }
  
  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------
  
  private setupBindings(bindings: KeyBinding[]): void {
    this.keyBindings.clear();
    
    for (const binding of bindings) {
      for (const key of binding.keys) {
        this.keyBindings.set(key, binding.action);
      }
    }
  }
  
  setConfig(config: Partial<InputConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  getConfig(): InputConfig {
    return { ...this.config };
  }
  
  setCallback(callback: InputCallback): void {
    this.callback = callback;
  }
  
  /**
   * Update key bindings at runtime
   */
  setBindings(bindings: KeyBinding[]): void {
    this.setupBindings(bindings);
    // Clear current key states to prevent stuck keys
    this.keyStates.clear();
  }
  
  /**
   * Get current key bindings
   */
  getBindings(): KeyBinding[] {
    // Reconstruct bindings from the map
    const actionToKeys = new Map<InputAction, string[]>();
    
    for (const [key, action] of this.keyBindings) {
      if (!actionToKeys.has(action)) {
        actionToKeys.set(action, []);
      }
      actionToKeys.get(action)!.push(key);
    }
    
    return Array.from(actionToKeys.entries()).map(([action, keys]) => ({
      action,
      keys,
    }));
  }
  
  // ---------------------------------------------------------------------------
  // Enable/Disable
  // ---------------------------------------------------------------------------
  
  enable(): void {
    if (this.enabled) return;
    
    this.enabled = true;
    
    // Add event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    
    // Start update loop
    this.startUpdateLoop();
  }
  
  disable(): void {
    if (!this.enabled) return;
    
    this.enabled = false;
    
    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    
    // Stop update loop
    this.stopUpdateLoop();
    
    // Clear states
    this.keyStates.clear();
  }
  
  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Prevent default for game keys
    const action = this.keyBindings.get(event.code);
    if (action) {
      event.preventDefault();
    }
    
    // Ignore repeated keydown events (browser auto-repeat)
    if (event.repeat) return;
    
    if (!action) return;
    
    const now = performance.now();
    
    // Set key state
    this.keyStates.set(event.code, {
      pressed: true,
      pressTime: now,
      lastRepeatTime: now,
    });
    
    // Immediately fire the action
    this.fireAction(action);
  };
  
  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keyStates.delete(event.code);
  };
  
  private handleBlur = (): void => {
    // Clear all key states when window loses focus
    this.keyStates.clear();
  };
  
  // ---------------------------------------------------------------------------
  // Update Loop (for DAS/ARR)
  // ---------------------------------------------------------------------------
  
  private startUpdateLoop(): void {
    if (this.animationFrameId !== null) return;
    
    const loop = () => {
      this.update(performance.now());
      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    this.animationFrameId = requestAnimationFrame(loop);
  }
  
  private stopUpdateLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  private update(currentTime: number): void {
    // OPTIMIZED: Early exit if no keys are held
    if (this.keyStates.size === 0) return;
    
    // Process DAS/ARR for held keys
    for (const [keyCode, state] of this.keyStates) {
      if (!state.pressed) continue;
      
      const action = this.keyBindings.get(keyCode);
      if (!action || !this.repeatableActions.has(action)) continue;
      
      const holdDuration = currentTime - state.pressTime;
      
      // Check if DAS threshold has been reached
      if (holdDuration >= this.config.das) {
        // Check if enough time has passed since last repeat
        const timeSinceLastRepeat = currentTime - state.lastRepeatTime;
        
        // ARR of 0 means instant (move as fast as possible, but cap at 16ms/60fps)
        const arr = this.config.arr === 0 ? 16 : this.config.arr;
        
        if (timeSinceLastRepeat >= arr) {
          this.fireAction(action);
          state.lastRepeatTime = currentTime;
        }
      }
    }
  }
  
  private fireAction(action: InputAction): void {
    if (this.callback) {
      this.callback(action);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Manual Input (for touch controls, etc.)
  // ---------------------------------------------------------------------------
  
  triggerAction(action: InputAction): void {
    this.fireAction(action);
  }
  
  // ---------------------------------------------------------------------------
  // State Queries
  // ---------------------------------------------------------------------------
  
  isActionPressed(action: InputAction): boolean {
    for (const [keyCode, state] of this.keyStates) {
      if (state.pressed && this.keyBindings.get(keyCode) === action) {
        return true;
      }
    }
    return false;
  }
  
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  
  destroy(): void {
    this.disable();
    this.callback = null;
  }
}

// -----------------------------------------------------------------------------
// Gamepad Button Indices (Standard Gamepad Layout)
// -----------------------------------------------------------------------------

enum GamepadButton {
  // Face buttons
  Cross = 0,        // A on Xbox, Cross on PlayStation
  Circle = 1,       // B on Xbox, Circle on PlayStation
  Square = 2,       // X on Xbox, Square on PlayStation
  Triangle = 3,     // Y on Xbox, Triangle on PlayStation
  
  // Shoulder buttons
  L1 = 4,           // LB on Xbox
  R1 = 5,           // RB on Xbox
  L2 = 6,           // LT on Xbox
  R2 = 7,           // RT on Xbox
  
  // Center buttons
  Share = 8,        // Back/Select/Share
  Options = 9,      // Start/Options
  L3 = 10,          // Left stick click
  R3 = 11,          // Right stick click
  
  // D-pad
  DpadUp = 12,
  DpadDown = 13,
  DpadLeft = 14,
  DpadRight = 15,
  
  // System
  PS = 16,          // PlayStation/Xbox button
  Touchpad = 17,    // PlayStation touchpad click
}

// -----------------------------------------------------------------------------
// Gamepad Handler - Tetris Effect PS5 Default Mappings
// -----------------------------------------------------------------------------

export class GamepadHandler {
  private callback: InputCallback | null = null;
  private animationFrameId: number | null = null;
  private config: InputConfig;
  private enabled: boolean = false;
  
  // Previous state tracking
  private previousButtonStates: Map<number, boolean[]> = new Map();
  private previousAxisStates: Map<number, { left: string | null; right: string | null }> = new Map();
  
  // DAS/ARR state tracking
  private buttonHoldStates: Map<string, { pressTime: number; lastRepeatTime: number }> = new Map();
  
  // Tetris Effect PS5 Default Button Mappings
  // https://gamefaqs.gamespot.com/ps4/240623-tetris-effect/faqs/77557
  private buttonMappings: Map<GamepadButton, InputAction> = new Map([
    // Face buttons
    [GamepadButton.Cross, 'rotateCCW'],      // Cross = Rotate Counter-Clockwise
    [GamepadButton.Circle, 'rotateCW'],      // Circle = Rotate Clockwise
    [GamepadButton.Square, 'hold'],          // Square = Hold (alternate)
    [GamepadButton.Triangle, 'zone'],        // Triangle = Zone (alternate)
    
    // Shoulder buttons
    [GamepadButton.L1, 'hold'],              // L1 = Hold
    [GamepadButton.R1, 'hold'],              // R1 = Hold
    [GamepadButton.L2, 'zone'],              // L2 = Zone
    [GamepadButton.R2, 'zone'],              // R2 = Zone
    
    // D-pad
    [GamepadButton.DpadUp, 'hardDrop'],      // D-pad Up = Hard Drop
    [GamepadButton.DpadDown, 'softDrop'],    // D-pad Down = Soft Drop
    [GamepadButton.DpadLeft, 'moveLeft'],    // D-pad Left = Move Left
    [GamepadButton.DpadRight, 'moveRight'],  // D-pad Right = Move Right
    
    // System buttons
    [GamepadButton.Options, 'pause'],        // Options = Pause
    [GamepadButton.Share, 'pause'],          // Share = Pause (alternate)
  ]);
  
  // Actions that support DAS/ARR
  private repeatableActions: Set<InputAction> = new Set([
    'moveLeft',
    'moveRight',
    'softDrop',
  ]);
  
  // Analog stick deadzone
  private deadzone = 0.4;
  
  constructor(config?: Partial<InputConfig>) {
    this.config = { ...DEFAULT_INPUT_CONFIG, ...config };
  }
  
  setCallback(callback: InputCallback): void {
    this.callback = callback;
  }
  
  setConfig(config: Partial<InputConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    
    // Listen for gamepad connection events
    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    
    this.startPolling();
    
    // Log any already-connected gamepads
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (gamepad) {
        console.log(`Gamepad detected: ${gamepad.id}`);
      }
    }
  }
  
  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    
    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    
    this.stopPolling();
    this.buttonHoldStates.clear();
    this.previousButtonStates.clear();
    this.previousAxisStates.clear();
  }
  
  private handleGamepadConnected = (event: GamepadEvent): void => {
    console.log(`Gamepad connected: ${event.gamepad.id} (index: ${event.gamepad.index})`);
    
    // Check if it's a PlayStation controller
    const id = event.gamepad.id.toLowerCase();
    if (id.includes('dualsense') || id.includes('dualshock') || id.includes('playstation')) {
      console.log('PlayStation controller detected - using Tetris Effect mappings');
    }
  };
  
  private handleGamepadDisconnected = (event: GamepadEvent): void => {
    console.log(`Gamepad disconnected: ${event.gamepad.id}`);
    
    // Clean up state for this gamepad
    this.previousButtonStates.delete(event.gamepad.index);
    this.previousAxisStates.delete(event.gamepad.index);
    
    // Remove hold states for this gamepad
    const prefix = `${event.gamepad.index}:`;
    for (const key of this.buttonHoldStates.keys()) {
      if (key.startsWith(prefix)) {
        this.buttonHoldStates.delete(key);
      }
    }
  };
  
  private startPolling(): void {
    if (this.animationFrameId !== null) return;
    
    const poll = () => {
      this.pollGamepads();
      this.animationFrameId = requestAnimationFrame(poll);
    };
    
    this.animationFrameId = requestAnimationFrame(poll);
  }
  
  private stopPolling(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  private pollGamepads(): void {
    const gamepads = navigator.getGamepads();
    const now = performance.now();
    
    for (const gamepad of gamepads) {
      if (!gamepad) continue;
      
      this.pollButtons(gamepad, now);
      this.pollAnalogSticks(gamepad, now);
    }
  }
  
  private pollButtons(gamepad: Gamepad, now: number): void {
    const previousStates = this.previousButtonStates.get(gamepad.index) || [];
    const currentStates: boolean[] = [];
    
    for (let i = 0; i < gamepad.buttons.length; i++) {
      const button = gamepad.buttons[i];
      if (!button) {
        currentStates[i] = false;
        continue;
      }
      
      const isPressed = button.pressed || button.value > 0.5;
      currentStates[i] = isPressed;
      
      const wasPressed = previousStates[i] || false;
      const action = this.buttonMappings.get(i as GamepadButton);
      
      if (!action) continue;
      
      const stateKey = `${gamepad.index}:btn:${i}`;
      
      if (isPressed && !wasPressed) {
        // Button just pressed
        this.fireAction(action);
        
        if (this.repeatableActions.has(action)) {
          this.buttonHoldStates.set(stateKey, { 
            pressTime: now, 
            lastRepeatTime: now 
          });
        }
      } else if (!isPressed && wasPressed) {
        // Button released
        this.buttonHoldStates.delete(stateKey);
      } else if (isPressed && this.repeatableActions.has(action)) {
        // Button held - handle DAS/ARR
        this.handleDASARR(stateKey, action, now);
      }
    }
    
    this.previousButtonStates.set(gamepad.index, currentStates);
  }
  
  private pollAnalogSticks(gamepad: Gamepad, now: number): void {
    const previousAxis = this.previousAxisStates.get(gamepad.index) || { left: null, right: null };
    
    // Left stick (axes 0 and 1)
    const leftX = gamepad.axes[0] ?? 0;
    const leftY = gamepad.axes[1] ?? 0;
    
    // Determine left stick direction
    let leftDirection: string | null = null;
    
    if (Math.abs(leftX) > this.deadzone || Math.abs(leftY) > this.deadzone) {
      // Prioritize horizontal movement (more common in Tetris)
      if (Math.abs(leftX) > Math.abs(leftY)) {
        leftDirection = leftX < -this.deadzone ? 'left' : leftX > this.deadzone ? 'right' : null;
      } else {
        leftDirection = leftY < -this.deadzone ? 'up' : leftY > this.deadzone ? 'down' : null;
      }
    }
    
    // Map stick direction to action
    const directionToAction: Record<string, InputAction> = {
      'left': 'moveLeft',
      'right': 'moveRight',
      'up': 'hardDrop',
      'down': 'softDrop',
    };
    
    const stateKey = `${gamepad.index}:stick:left`;
    
    if (leftDirection !== previousAxis.left) {
      // Direction changed
      this.buttonHoldStates.delete(stateKey);
      
      if (leftDirection) {
        const action = directionToAction[leftDirection];
        if (action) {
          this.fireAction(action);
          
          if (this.repeatableActions.has(action)) {
            this.buttonHoldStates.set(stateKey, {
              pressTime: now,
              lastRepeatTime: now,
            });
          }
        }
      }
    } else if (leftDirection) {
      // Same direction held
      const action = directionToAction[leftDirection];
      if (action && this.repeatableActions.has(action)) {
        this.handleDASARR(stateKey, action, now);
      }
    }
    
    this.previousAxisStates.set(gamepad.index, { 
      left: leftDirection, 
      right: previousAxis.right 
    });
  }
  
  private handleDASARR(stateKey: string, action: InputAction, now: number): void {
    const state = this.buttonHoldStates.get(stateKey);
    if (!state) return;
    
    const holdDuration = now - state.pressTime;
    
    if (holdDuration >= this.config.das) {
      const timeSinceRepeat = now - state.lastRepeatTime;
      // ARR of 0 means instant but cap at 16ms for 60fps responsiveness
      const arr = this.config.arr === 0 ? 16 : this.config.arr;
      
      if (timeSinceRepeat >= arr) {
        this.fireAction(action);
        state.lastRepeatTime = now;
      }
    }
  }
  
  private fireAction(action: InputAction): void {
    if (this.callback) {
      this.callback(action);
    }
  }
  
  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------
  
  getConnectedGamepads(): Gamepad[] {
    const gamepads = navigator.getGamepads();
    return Array.from(gamepads).filter((gp): gp is Gamepad => gp !== null);
  }
  
  isGamepadConnected(): boolean {
    return this.getConnectedGamepads().length > 0;
  }
  
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  
  destroy(): void {
    this.disable();
    this.callback = null;
  }
}

// -----------------------------------------------------------------------------
// Factory Functions
// -----------------------------------------------------------------------------

export function createInputHandler(config?: Partial<InputConfig>): InputHandler {
  return new InputHandler(config);
}

export function createGamepadHandler(config?: Partial<InputConfig>): GamepadHandler {
  return new GamepadHandler(config);
}
