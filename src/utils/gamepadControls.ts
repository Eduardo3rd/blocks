import { GameState } from './types';
import { moveHorizontal } from './gameLogic';
import React from 'react';

declare global {
  interface WindowEventMap {
    gamepadconnected: GamepadEvent;
    gamepaddisconnected: GamepadEvent;
  }
}

// Map PS5 button indices to their common names
const PS5_BUTTONS = {
  CROSS: 0,      // A/Cross
  CIRCLE: 1,     // B/Circle
  SQUARE: 2,     // X/Square
  TRIANGLE: 3,   // Y/Triangle
  L1: 4,         // Left Bumper
  R1: 5,         // Right Bumper
  L2: 6,         // Left Trigger
  R2: 7,         // Right Trigger
  SHARE: 8,      // Share
  OPTIONS: 9,    // Options/Start
  L3: 10,        // Left Stick Press
  R3: 11,        // Right Stick Press
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
  PS: 16         // PS Button
} as const;

// Map PS5 axes indices
const PS5_AXES = {
  LEFT_STICK_X: 0,
  LEFT_STICK_Y: 1,
  RIGHT_STICK_X: 2,
  RIGHT_STICK_Y: 3
};

export interface GamepadState {
  dpadLeft: boolean;
  dpadRight: boolean;
  dpadUp: boolean;
  dpadDown: boolean;
  cross: boolean;
  circle: boolean;
  square: boolean;
  triangle: boolean;
  l1: boolean;
  r1: boolean;
  options: boolean;  // Add options/start button
}

export const getGamepadState = (): GamepadState | null => {
  try {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0];

    if (!gamepad) return null;

    if (!gamepad.buttons || gamepad.buttons.length < 17) {
      console.warn('Gamepad does not have expected button layout');
      return null;
    }

    return {
      dpadLeft: gamepad.buttons[PS5_BUTTONS.DPAD_LEFT]?.pressed ?? false,
      dpadRight: gamepad.buttons[PS5_BUTTONS.DPAD_RIGHT]?.pressed ?? false,
      dpadUp: gamepad.buttons[PS5_BUTTONS.DPAD_UP]?.pressed ?? false,
      dpadDown: gamepad.buttons[PS5_BUTTONS.DPAD_DOWN]?.pressed ?? false,
      cross: gamepad.buttons[PS5_BUTTONS.CROSS]?.pressed ?? false,
      circle: gamepad.buttons[PS5_BUTTONS.CIRCLE]?.pressed ?? false,
      square: gamepad.buttons[PS5_BUTTONS.SQUARE]?.pressed ?? false,
      triangle: gamepad.buttons[PS5_BUTTONS.TRIANGLE]?.pressed ?? false,
      l1: gamepad.buttons[PS5_BUTTONS.L1]?.pressed ?? false,
      r1: gamepad.buttons[PS5_BUTTONS.R1]?.pressed ?? false,
      options: gamepad.buttons[PS5_BUTTONS.OPTIONS]?.pressed ?? false,
    };
  } catch (error) {
    console.error('Error accessing gamepad:', error);
    return null;
  }
};

// Use a class to manage state instead of module-level variables
class GamepadStateManager {
  private previousState: GamepadState | null = null;
  private lastButtonPressTime: number | null = null;
  private lastMoveTime = 0;

  getNewPresses(): GamepadState | null {
    const currentState = getGamepadState();
    if (!currentState) return null;

    const newPresses: GamepadState = {
      dpadLeft: currentState.dpadLeft && (!this.previousState?.dpadLeft),
      dpadRight: currentState.dpadRight && (!this.previousState?.dpadRight),
      dpadUp: currentState.dpadUp && (!this.previousState?.dpadUp),
      dpadDown: currentState.dpadDown && (!this.previousState?.dpadDown),
      cross: currentState.cross && (!this.previousState?.cross),
      circle: currentState.circle && (!this.previousState?.circle),
      square: currentState.square && (!this.previousState?.square),
      triangle: currentState.triangle && (!this.previousState?.triangle),
      l1: currentState.l1 && (!this.previousState?.l1),
      r1: currentState.r1 && (!this.previousState?.r1),
      options: currentState.options && (!this.previousState?.options),
    };

    this.previousState = currentState;
    return newPresses;
  }

  handleInput(
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    settings: { das: number; arr: number }
  ): void {
    const gamepad = navigator.getGamepads()?.[0];
    if (!gamepad?.buttons) return;

    const now = Date.now();
    const dpadLeft = gamepad.buttons[PS5_BUTTONS.DPAD_LEFT]?.pressed ?? false;
    const dpadRight = gamepad.buttons[PS5_BUTTONS.DPAD_RIGHT]?.pressed ?? false;

    if (dpadLeft || dpadRight) {
      const direction = dpadLeft ? -1 : 1;
      const keyHoldTime = now - (this.lastButtonPressTime ?? now);

      if (!this.lastButtonPressTime) {
        setGameState(prev => moveHorizontal(prev, direction));
        this.lastButtonPressTime = now;
      } else if (keyHoldTime >= settings.das) {
        if (now - this.lastMoveTime >= settings.arr) {
          setGameState(prev => moveHorizontal(prev, direction));
          this.lastMoveTime = now;
        }
      }
    } else {
      this.lastButtonPressTime = null;
    }
  }
}

export const gamepadManager = new GamepadStateManager();
export const getNewPresses = () => gamepadManager.getNewPresses();
export const handleGamepadInput = (...args: Parameters<GamepadStateManager['handleInput']>) => 
  gamepadManager.handleInput(...args); 