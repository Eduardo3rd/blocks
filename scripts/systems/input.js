import { INITIAL_DELAY, MOVE_SPEED, GAMEPAD_CONFIG } from '../config/constants.js';

class InputSystem {
    constructor() {
        console.log('InputSystem constructor called');
        
        // Key repeat timing configuration
        this.timings = {
            moveDelay: 170,      // Initial delay before repeating (ms)
            moveRepeat: 50,      // Time between repeats after initial delay (ms)
            rotateDelay: 250,    // Minimum time between rotations (ms)
            holdDelay: 250,      // Minimum time between hold actions (ms)
            dropRepeat: 50       // Time between soft drop repeats (ms)
        };

        // Initialize all tracked keys
        this.keys = {
            ArrowLeft: { pressed: false, heldTime: 0, lastAction: 0 },
            ArrowRight: { pressed: false, heldTime: 0, lastAction: 0 },
            ArrowDown: { pressed: false, heldTime: 0, lastAction: 0 },
            ArrowUp: { pressed: false, lastAction: 0 },
            KeyX: { pressed: false, lastAction: 0 },
            ControlLeft: { pressed: false, lastAction: 0 },
            KeyZ: { pressed: false, lastAction: 0 },
            Space: { pressed: false, lastAction: 0 },
            ShiftLeft: { pressed: false, lastAction: 0 },
            KeyC: { pressed: false, lastAction: 0 },
            Escape: { pressed: false, lastAction: 0 }
        };
        
        this.actions = {
            moveLeft: false,
            moveRight: false,
            softDrop: false,
            hardDrop: false,
            rotateClockwise: false,
            rotateCounter: false,
            hold: false,
            pause: false
        };

        this.lastTime = performance.now();
        
        // Bind methods to preserve context
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    init() {
        console.log('InputSystem init called');
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    handleKeyDown(event) {
        // Prevent default behavior for game controls
        if (this.keys.hasOwnProperty(event.code)) {
            event.preventDefault();
        }

        // Ignore key repeat events from the browser
        if (event.repeat) return;

        if (this.keys[event.code]) {
            this.keys[event.code].pressed = true;
            this.keys[event.code].heldTime = 0;
        }
    }

    handleKeyUp(event) {
        if (this.keys[event.code]) {
            this.keys[event.code].pressed = false;
            this.keys[event.code].heldTime = 0;
            this.keys[event.code].lastAction = 0;
        }

        // Clear corresponding actions
        switch (event.code) {
            case 'ArrowLeft': this.actions.moveLeft = false; break;
            case 'ArrowRight': this.actions.moveRight = false; break;
            case 'ArrowDown': this.actions.softDrop = false; break;
            case 'Space': this.actions.hardDrop = false; break;
            case 'ArrowUp':
            case 'KeyX': this.actions.rotateClockwise = false; break;
            case 'ControlLeft':
            case 'KeyZ': this.actions.rotateCounter = false; break;
            case 'ShiftLeft':
            case 'KeyC': this.actions.hold = false; break;
            case 'Escape': this.actions.pause = false; break;
        }
    }

    update(deltaTime) {
        const currentTime = performance.now();

        // Reset all actions
        Object.keys(this.actions).forEach(action => {
            this.actions[action] = false;
        });

        // Handle movement (with initial delay and repeat)
        this.handleMovement('ArrowLeft', 'moveLeft', currentTime);
        this.handleMovement('ArrowRight', 'moveRight', currentTime);
        this.handleMovement('ArrowDown', 'softDrop', currentTime, this.timings.dropRepeat);

        // Handle rotations (with debounce)
        this.handleRotation('ArrowUp', 'rotateClockwise', currentTime);
        this.handleRotation('KeyX', 'rotateClockwise', currentTime);
        this.handleRotation('ControlLeft', 'rotateCounter', currentTime);
        this.handleRotation('KeyZ', 'rotateCounter', currentTime);

        // Handle hold (with debounce)
        this.handleHold(['ShiftLeft', 'KeyC'], currentTime);

        // Handle hard drop and pause (immediate actions)
        if (this.keys.Space.pressed) {
            this.actions.hardDrop = true;
            this.keys.Space.pressed = false; // Auto-release to prevent holding
        }
        
        if (this.keys.Escape.pressed) {
            this.actions.pause = true;
            this.keys.Escape.pressed = false; // Auto-release to prevent holding
        }

        this.lastTime = currentTime;
    }

    handleMovement(key, action, currentTime, repeatRate = this.timings.moveRepeat) {
        if (!this.keys[key].pressed) return;

        const heldTime = this.keys[key].heldTime;
        const timeSinceLastAction = currentTime - this.keys[key].lastAction;

        // Initial press or after initial delay with repeat rate
        if (heldTime === 0 || 
            (heldTime >= this.timings.moveDelay && timeSinceLastAction >= repeatRate)) {
            this.actions[action] = true;
            this.keys[key].lastAction = currentTime;
        }

        this.keys[key].heldTime += currentTime - this.lastTime;
    }

    handleRotation(key, action, currentTime) {
        if (!this.keys[key].pressed) return;

        const timeSinceLastAction = currentTime - this.keys[key].lastAction;
        if (timeSinceLastAction >= this.timings.rotateDelay) {
            this.actions[action] = true;
            this.keys[key].lastAction = currentTime;
        }
    }

    handleHold(keys, currentTime) {
        for (const key of keys) {
            if (this.keys[key].pressed) {
                const timeSinceLastAction = currentTime - this.keys[key].lastAction;
                if (timeSinceLastAction >= this.timings.holdDelay) {
                    this.actions.hold = true;
                    this.keys[key].lastAction = currentTime;
                    break;
                }
            }
        }
    }

    getActions() {
        return { ...this.actions };
    }

    reset() {
        Object.keys(this.keys).forEach(key => {
            this.keys[key] = {
                pressed: false,
                heldTime: 0,
                lastAction: 0
            };
        });
        
        Object.keys(this.actions).forEach(action => {
            this.actions[action] = false;
        });

        this.lastTime = performance.now();
    }
}

const inputSystem = new InputSystem();
export default inputSystem;
