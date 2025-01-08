import { SPEED, COMBO_WINDOW } from '../config/constants.js';

class Scoring {
    constructor() {
        this.score = 0;
        this.lines = 0;
        this.level = 0;
        this.combo = 0;
        this.backToBack = false;  // Track back-to-back difficult clears
        this.lastClearWasDifficult = false;  // Track if last clear was Tetris or T-spin
        this.highScore = this.loadHighScore();
    }

    updateScore(linesCleared, dropPoints = 0, isTSpin = false, isMini = false) {
        // Add drop points
        this.score += dropPoints;

        if (linesCleared === 0) {
            this.combo = 0;
            this.lastClearWasDifficult = false;
            return;
        }

        let points = 0;

        // Calculate base points for line clears and T-spins
        if (isTSpin) {
            if (isMini) {
                switch (linesCleared) {
                    case 1: points = 100; break;  // Mini T-spin Single
                    case 2: points = 400; break;  // Mini T-spin Double
                }
            } else {
                switch (linesCleared) {
                    case 1: points = 400; break;  // T-spin Single
                    case 2: points = 800; break;  // T-spin Double
                    case 3: points = 1600; break; // T-spin Triple
                }
            }
            this.lastClearWasDifficult = true;
        } else {
            // Regular line clear points
            switch (linesCleared) {
                case 1: points = 100; break;  // Single
                case 2: points = 300; break;  // Double
                case 3: points = 500; break;  // Triple
                case 4:
                    points = 800;  // Tetris
                    this.lastClearWasDifficult = true;
                    break;
                default:
                    this.lastClearWasDifficult = false;
            }
        }

        // Apply level multiplier
        points *= (this.level + 1);

        // Apply back-to-back bonus (50% more points)
        if (this.backToBack && this.lastClearWasDifficult) {
            points *= 1.5;
        }

        // Update back-to-back status
        if (this.lastClearWasDifficult) {
            this.backToBack = true;
        } else {
            this.backToBack = false;
        }

        // Add combo bonus
        if (this.combo > 0) {
            let comboPoints = 50;
            if (this.combo > 2) {
                comboPoints = 100;
            }
            points += comboPoints * (this.level + 1);
        }

        this.score += Math.floor(points);
        this.lines += linesCleared;
        this.combo++;

        // Update level every 10 lines
        this.level = Math.floor(this.lines / 10);

        // Update high score if necessary
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
    }

    getDropSpeed() {
        // Speed progression based on level (in milliseconds)
        const speeds = {
            0: 1000,    // 1 tile/sec
            1: 900,     
            2: 800,
            3: 700,
            4: 600,
            5: 500,
            6: 400,
            7: 350,
            8: 300,
            9: 250,
            10: 200,
            11: 180,
            12: 150,
            13: 130,
            14: 110,
            15: 100,
            16: 90,
            17: 80,
            18: 70,
            19: 50,
            20: 30,     // 30 tiles/sec
            // Levels 21-28 maintain ~30 tiles/sec
            29: 17      // "Kill screen" speed (~60 tiles/sec)
        };

        // Get speed for current level, defaulting to previous level's speed if not defined
        let speed = speeds[this.level];
        if (speed === undefined) {
            if (this.level >= 29) {
                speed = speeds[29];  // Kill screen speed
            } else if (this.level >= 20) {
                speed = speeds[20];  // Maintain level 20 speed
            }
        }

        return speed;
    }

    loadHighScore() {
        const saved = localStorage.getItem('tetrisHighScore');
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        localStorage.setItem('tetrisHighScore', this.highScore.toString());
    }

    reset() {
        this.score = 0;
        this.lines = 0;
        this.level = 0;
        this.combo = 0;
        this.backToBack = false;
        this.lastClearWasDifficult = false;
    }

    getState() {
        return {
            score: this.score,
            lines: this.lines,
            level: this.level,
            highScore: this.highScore,
            backToBack: this.backToBack
        };
    }

    setStartingLevel(level) {
        this.level = level;
        // Adjust lines to match the starting level
        this.lines = level * 10;
    }
}

export default Scoring;
