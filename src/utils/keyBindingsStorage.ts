import { InputAction } from '../engine/types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface KeyBindings {
  moveLeft: string;
  moveRight: string;
  softDrop: string;
  hardDrop: string;
  rotateCW: string;
  rotateCCW: string;
  rotate180: string;
  hold: string;
  zone: string;
  pause: string;
}

export type KeyBinding = {
  action: InputAction;
  keys: string[];
};

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const STORAGE_KEY = 'tetris-key-bindings';

// Default key bindings (one primary key per action)
export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  softDrop: 'ArrowDown',
  hardDrop: 'Space',
  rotateCW: 'ArrowUp',
  rotateCCW: 'KeyZ',
  rotate180: 'KeyA',
  hold: 'KeyC',
  zone: 'KeyE',
  pause: 'Escape',
};

// Action display names for the UI
export const ACTION_DISPLAY_NAMES: Record<InputAction, string> = {
  moveLeft: 'Move Left',
  moveRight: 'Move Right',
  softDrop: 'Soft Drop',
  hardDrop: 'Hard Drop',
  rotateCW: 'Rotate Clockwise',
  rotateCCW: 'Rotate Counter-CW',
  rotate180: 'Rotate 180°',
  hold: 'Hold Piece',
  zone: 'Zone',
  pause: 'Pause',
};

// Order of actions for display
export const ACTION_ORDER: InputAction[] = [
  'moveLeft',
  'moveRight',
  'softDrop',
  'hardDrop',
  'rotateCW',
  'rotateCCW',
  'rotate180',
  'hold',
  'zone',
  'pause',
];

// -----------------------------------------------------------------------------
// Key Display Names
// -----------------------------------------------------------------------------

const KEY_DISPLAY_MAP: Record<string, string> = {
  // Arrow keys
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  
  // Special keys
  Space: 'SPACE',
  Escape: 'ESC',
  Enter: 'ENTER',
  Tab: 'TAB',
  Backspace: 'BACKSPACE',
  Delete: 'DELETE',
  ShiftLeft: 'L-SHIFT',
  ShiftRight: 'R-SHIFT',
  ControlLeft: 'L-CTRL',
  ControlRight: 'R-CTRL',
  AltLeft: 'L-ALT',
  AltRight: 'R-ALT',
  MetaLeft: 'L-META',
  MetaRight: 'R-META',
  CapsLock: 'CAPS',
  
  // Number row
  Digit0: '0',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',
  
  // Numpad
  Numpad0: 'NUM 0',
  Numpad1: 'NUM 1',
  Numpad2: 'NUM 2',
  Numpad3: 'NUM 3',
  Numpad4: 'NUM 4',
  Numpad5: 'NUM 5',
  Numpad6: 'NUM 6',
  Numpad7: 'NUM 7',
  Numpad8: 'NUM 8',
  Numpad9: 'NUM 9',
  NumpadAdd: 'NUM +',
  NumpadSubtract: 'NUM -',
  NumpadMultiply: 'NUM *',
  NumpadDivide: 'NUM /',
  NumpadEnter: 'NUM ENTER',
  NumpadDecimal: 'NUM .',
  
  // Function keys
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
  
  // Punctuation
  Comma: ',',
  Period: '.',
  Slash: '/',
  Semicolon: ';',
  Quote: "'",
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Minus: '-',
  Equal: '=',
  Backquote: '`',
};

/**
 * Convert a KeyboardEvent.code to a human-readable display name
 */
export function getKeyDisplayName(keyCode: string): string {
  // Check if we have a custom mapping
  if (KEY_DISPLAY_MAP[keyCode]) {
    return KEY_DISPLAY_MAP[keyCode];
  }
  
  // Handle letter keys (KeyA -> A)
  if (keyCode.startsWith('Key')) {
    return keyCode.slice(3);
  }
  
  // Fallback: return the code as-is
  return keyCode;
}

// -----------------------------------------------------------------------------
// Storage Functions
// -----------------------------------------------------------------------------

/**
 * Get the default key bindings
 */
export function getDefaultBindings(): KeyBindings {
  return { ...DEFAULT_KEY_BINDINGS };
}

/**
 * Load key bindings from localStorage, or return defaults if not found
 */
export function loadKeyBindings(): KeyBindings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<KeyBindings>;
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_KEY_BINDINGS, ...parsed };
    }
  } catch (error) {
    console.error('Error loading key bindings:', error);
  }
  return getDefaultBindings();
}

/**
 * Save key bindings to localStorage
 */
export function saveKeyBindings(bindings: KeyBindings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch (error) {
    console.error('Error saving key bindings:', error);
  }
}

/**
 * Clear saved key bindings (reset to defaults)
 */
export function clearKeyBindings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing key bindings:', error);
  }
}

// -----------------------------------------------------------------------------
// Conversion Functions
// -----------------------------------------------------------------------------

/**
 * Convert KeyBindings map to KeyBinding[] array for InputHandler
 */
export function keyBindingsToArray(bindings: KeyBindings): KeyBinding[] {
  return ACTION_ORDER.map((action) => ({
    action,
    keys: [bindings[action]],
  }));
}

/**
 * Check if a key is already assigned to an action
 * Returns the action it's assigned to, or null if not assigned
 */
export function findConflictingAction(
  bindings: KeyBindings,
  keyCode: string,
  excludeAction?: InputAction
): InputAction | null {
  for (const action of ACTION_ORDER) {
    if (action === excludeAction) continue;
    if (bindings[action] === keyCode) {
      return action;
    }
  }
  return null;
}

