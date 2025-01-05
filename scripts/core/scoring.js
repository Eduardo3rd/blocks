import { SPEED, COMBO_WINDOW } from '../config/constants.js';

class Scoring {
    constructor() {
        this.reset();
    }

    reset() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.lastClearTime = 0;
    }

    getDropSpeed() {
        // Get current level's speed, default to highest level if beyond max
        return SPEED.LEVELS[this.level] || SPEED.LEVELS[29];
    }

    updateScore(linesCleared, dropCount = 0) {
        // Base points for lines cleared
        const linePoints = {
            1: 100,
            2: 300,
            3: 500,
            4: 800
        };

        if (linesCleared > 0) {
            // Calculate line clear points
            const basePoints = linePoints[linesCleared] || 0;
            const levelMultiplier = this.level;
            
            // Add combo bonus if within time window
            const now = Date.now();
            if (now - this.lastClearTime < COMBO_WINDOW) {
                this.combo++;
            } else {
                this.combo = 0;
            }
            this.lastClearTime = now;

            // Calculate total points including level and combo
            const comboBonus = this.combo > 1 ? this.combo * 50 : 0;
            const totalPoints = (basePoints * levelMultiplier) + comboBonus;

            // Update score
            this.score += totalPoints;

            // Update lines and check for level up
            this.lines += linesCleared;
            this.checkLevelUp();
        }

        // Add points for dropping
        this.score += dropCount;

        // Check if current score is higher than high score and update in real time
        if (this.score > this.getHighScore()) {
            localStorage.setItem('tetrisHighScore', this.score.toString());
            // Return updated high score in the game state
            return true;
        }
    }

    checkLevelUp() {
        // Level up every 10 lines
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
        }
    }

    setStartingLevel(level) {
        this.level = level;
        // Adjust lines to match the starting level
        this.lines = (level - 1) * 10;
    }

    getState() {
        // Check and update high score if needed
        if (this.score > this.getHighScore()) {
            localStorage.setItem('tetrisHighScore', this.score.toString());
        }

        return {
            score: this.score,
            level: this.level,
            lines: this.lines,
            combo: this.combo,
            highScore: this.getHighScore()
        };
    }

    // High score handling
    updateHighScore() {
        const currentHighScore = this.getHighScore();
        if (this.score > currentHighScore) {
            localStorage.setItem('tetrisHighScore', this.score.toString());
            return true;
        }
        return false;
    }

    getHighScore() {
        const stored = localStorage.getItem('tetrisHighScore');
        return stored ? parseInt(stored) : 0;
    }

    resetHighScore() {
        localStorage.removeItem('tetrisHighScore');
    }
}

export default Scoring;
