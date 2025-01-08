import controllerSystem from './controller.js';
import timingSystem from './timing.js';

class InputSystem {
    constructor() {
        console.log('InputSystem constructor called');
        
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

        this.keyMap = {
            'ArrowLeft': 'moveLeft',
            'ArrowRight': 'moveRight',
            'ArrowDown': 'softDrop',
            'Space': 'hardDrop',
            'ArrowUp': 'rotateClockwise',
            'KeyZ': 'rotateCounter',
            'KeyC': 'hold',
            'Escape': 'pause'
        };

        this.keyStates = {};
        
        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }

    init() {
        console.log('InputSystem init called');
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        controllerSystem.init();
    }

    update(deltaTime) {
        const currentTime = performance.now();
        
        // Reset all actions
        Object.keys(this.actions).forEach(action => {
            this.actions[action] = false;
        });

        // Handle keyboard input with timing controls
        Object.entries(this.keyStates).forEach(([key, isPressed]) => {
            if (!isPressed) return;
            
            const action = this.keyMap[key];
            if (!action) return;

            // Use timing system for all actions
            this.actions[action] = timingSystem.handleAction(action, isPressed, currentTime);
        });

        // Get and merge controller input
        const controllerActions = controllerSystem.update();
        if (controllerActions) {
            Object.keys(this.actions).forEach(action => {
                this.actions[action] = this.actions[action] || controllerActions[action];
            });
        }

        timingSystem.update(currentTime);
    }

    handleKeyDown(event) {
        if (event.repeat) return;
        
        const action = this.keyMap[event.code];
        if (action) {
            event.preventDefault();
            this.keyStates[event.code] = true;
        }
    }

    handleKeyUp(event) {
        const action = this.keyMap[event.code];
        if (action) {
            event.preventDefault();
            this.keyStates[event.code] = false;
            timingSystem.handleAction(action, false, performance.now());
        }
    }

    getActions() {
        return { ...this.actions };
    }

    reset() {
        Object.keys(this.actions).forEach(key => {
            this.actions[key] = false;
        });
        this.keyStates = {};
        timingSystem.reset();
    }

    cleanup() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        controllerSystem.cleanup();
    }
}

export default new InputSystem();
