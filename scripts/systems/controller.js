import timingSystem from './timing.js';

// PS5 Controller Button Mappings
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
};

class ControllerSystem {
    constructor() {
        this.gamepad = null;
        this.connected = false;
        this.lastButtonStates = new Array(17).fill(false);
    }

    init() {
        console.log('Initializing controller system');
        window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
        window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));
    }

    handleGamepadConnected(event) {
        console.log('Gamepad connected:', event.gamepad);
        this.gamepad = event.gamepad;
        this.connected = true;
    }

    handleGamepadDisconnected(event) {
        console.log('Gamepad disconnected:', event.gamepad);
        if (this.gamepad && this.gamepad.index === event.gamepad.index) {
            this.gamepad = null;
            this.connected = false;
        }
    }

    update() {
        if (!this.connected) return null;

        const currentTime = performance.now();
        const gamepads = navigator.getGamepads();
        if (!gamepads || !gamepads[this.gamepad.index]) return null;

        const gamepad = gamepads[this.gamepad.index];
        
        // D-pad only movement
        const actions = {
            moveLeft: timingSystem.handleAction('moveLeft', 
                gamepad.buttons[PS5_BUTTONS.DPAD_LEFT].pressed, currentTime),
            moveRight: timingSystem.handleAction('moveRight', 
                gamepad.buttons[PS5_BUTTONS.DPAD_RIGHT].pressed, currentTime),
            softDrop: timingSystem.handleAction('softDrop', 
                gamepad.buttons[PS5_BUTTONS.DPAD_DOWN].pressed, currentTime),
            hardDrop: timingSystem.handleAction('hardDrop',
                this.isButtonNewlyPressed(gamepad, PS5_BUTTONS.CROSS), currentTime),
            rotateClockwise: timingSystem.handleAction('rotateClockwise', 
                gamepad.buttons[PS5_BUTTONS.CIRCLE].pressed, currentTime),
            rotateCounter: timingSystem.handleAction('rotateCounter', 
                gamepad.buttons[PS5_BUTTONS.SQUARE].pressed, currentTime),
            hold: timingSystem.handleAction('hold', 
                gamepad.buttons[PS5_BUTTONS.TRIANGLE].pressed, currentTime),
            pause: this.isButtonNewlyPressed(gamepad, PS5_BUTTONS.OPTIONS)
        };

        // Update button states
        gamepad.buttons.forEach((button, index) => {
            this.lastButtonStates[index] = button.pressed;
        });

        timingSystem.update(currentTime);
        return actions;
    }

    isButtonNewlyPressed(gamepad, buttonIndex) {
        const isPressed = gamepad.buttons[buttonIndex].pressed;
        const wasPressed = this.lastButtonStates[buttonIndex];
        return isPressed && !wasPressed;
    }

    vibrate(duration = 100, strongMagnitude = 0.5, weakMagnitude = 0.5) {
        if (!this.gamepad || !this.gamepad.vibrationActuator) return;
        
        this.gamepad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: duration,
            weakMagnitude: weakMagnitude,
            strongMagnitude: strongMagnitude
        });
    }

    cleanup() {
        window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
        window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    }
}

export default new ControllerSystem(); 