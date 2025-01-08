class TimingSystem {
    constructor() {
        // Core timing configuration - Classic Tetris style
        this.timings = {
            moveRepeat: 50,      // Time between movement repeats (ms) - faster for responsive movement
            dropRepeat: 50,      // Time between soft drop repeats (ms)
            debounceDelay: 32,   // Minimum time between any input registration (ms)
            hardDropDelay: 250,  // Minimum time between hard drops (ms)
            rotateDelay: 100,    // Minimum time between rotations (ms)
            holdDelay: 250       // Minimum time between hold actions (ms)
        };

        // Initialize timers for all action types
        this.actionTimers = {
            moveLeft: { lastAction: 0, lastInput: 0 },
            moveRight: { lastAction: 0, lastInput: 0 },
            softDrop: { lastAction: 0, lastInput: 0 },
            rotateClockwise: { lastInput: 0, lastAction: 0 },  // Added lastAction for rotation
            rotateCounter: { lastInput: 0, lastAction: 0 },    // Added lastAction for rotation
            hold: { lastInput: 0, lastAction: 0 },             // Added lastAction for hold
            hardDrop: { lastInput: 0, lastAction: 0 },
            pause: { lastInput: 0 }
        };

        this.lastTime = performance.now();
    }

    handleAction(action, isPressed, currentTime) {
        const timer = this.actionTimers[action];
        if (!timer) return false;

        // Basic debounce for all inputs
        if (currentTime - timer.lastInput < this.timings.debounceDelay) {
            return false;
        }

        if (!isPressed) {
            timer.lastAction = 0;
            return false;
        }

        // Update last input time
        timer.lastInput = currentTime;

        // Special handling for hard drop to prevent multiple drops
        if (action === 'hardDrop') {
            if (currentTime - timer.lastAction < this.timings.hardDropDelay) {
                return false;
            }
            timer.lastAction = currentTime;
            return true;
        }

        // Special handling for rotations
        if (action === 'rotateClockwise' || action === 'rotateCounter') {
            if (currentTime - timer.lastAction < this.timings.rotateDelay) {
                return false;
            }
            timer.lastAction = currentTime;
            return true;
        }

        // Special handling for hold piece
        if (action === 'hold') {
            if (currentTime - timer.lastAction < this.timings.holdDelay) {
                return false;
            }
            timer.lastAction = currentTime;
            return true;
        }

        // Immediate actions (just pause now)
        if (action === 'pause') {
            return isPressed;
        }

        // Movement and soft drop - instant first press, then repeat
        if (action === 'moveLeft' || action === 'moveRight' || action === 'softDrop') {
            const repeatRate = (action === 'softDrop') ? this.timings.dropRepeat : this.timings.moveRepeat;
            
            // If it's the first press or enough time has passed since last action
            if (timer.lastAction === 0 || (currentTime - timer.lastAction >= repeatRate)) {
                timer.lastAction = currentTime;
                return true;
            }
        }

        return false;
    }

    update(currentTime = performance.now()) {
        this.lastTime = currentTime;
    }

    reset() {
        Object.values(this.actionTimers).forEach(timer => {
            timer.lastAction = 0;
            timer.lastInput = 0;
        });
        this.lastTime = performance.now();
    }
}

export default new TimingSystem(); 