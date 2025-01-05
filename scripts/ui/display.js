import { GRID, DISPLAY } from '../config/constants.js';
import { COLORS, BLOCK_STYLE } from '../config/colors.js';

class DisplaySystem {
    constructor() {
        console.log('DisplaySystem constructor called');
        this.elements = {
            score: document.getElementById('score-display'),
            highScore: document.getElementById('high-score-display'),
            level: document.getElementById('level-display'),
            lines: document.getElementById('lines-display')
        };

        this.values = {
            score: 0,
            highScore: 0,
            level: 1,
            lines: 0
        };

        this.visible = {
            score: true,
            highScore: true,
            level: true,
            lines: true
        };
    }

    init() {
        // Add visible class to all elements
        Object.values(this.elements).forEach(element => {
            if (element) {
                element.classList.add('visible');
            }
        });
    }

    updateScore(score) {
        this.values.score = score;
        if (this.elements.score) {
            this.elements.score.querySelector('.score-value').textContent = 
                this.formatNumber(score);
        }
    }

    updateHighScore(score) {
        if (score === undefined || score === null) {
            console.warn('Attempted to update high score with undefined/null value');
            return;
        }
        this.values.highScore = score;
        if (this.elements.highScore) {
            this.elements.highScore.querySelector('.score-value').textContent = 
                this.formatNumber(score);
        }
    }

    updateLevel(level) {
        this.values.level = level;
        if (this.elements.level) {
            this.elements.level.querySelector('.score-value').textContent = level;
        }
    }

    updateLines(lines) {
        this.values.lines = lines;
        if (this.elements.lines) {
            this.elements.lines.querySelector('.score-value').textContent = lines;
        }
    }

    // Update all displays at once
    updateAll(gameState) {
        const {score, highScore, level, lines} = gameState;
        this.updateScore(score);
        this.updateHighScore(highScore);
        this.updateLevel(level);
        this.updateLines(lines);
    }

    // Toggle visibility of displays
    toggleDisplay(type, show) {
        const element = this.elements[type];
        if (element) {
            this.visible[type] = show;
            element.style.opacity = show ? '1' : '0';
        }
    }

    // Format numbers with commas
    formatNumber(num) {
        if (num === undefined || num === null) {
            console.warn('Attempted to format undefined/null number');
            return '0';
        }
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Show/hide all displays
    showAll() {
        Object.keys(this.elements).forEach(key => {
            this.toggleDisplay(key, true);
        });
    }

    hideAll() {
        Object.keys(this.elements).forEach(key => {
            this.toggleDisplay(key, false);
        });
    }

    // Flash a display briefly
    async flashDisplay(type, duration = 500) {
        const element = this.elements[type];
        if (!element) return;

        const originalOpacity = element.style.opacity;
        element.style.opacity = '0';
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        element.style.opacity = '1';
        
        await new Promise(resolve => setTimeout(resolve, duration));
        
        element.style.opacity = originalOpacity;
    }

    // Get current values
    getValues() {
        return { ...this.values };
    }

    // Reset all displays
    reset() {
        this.updateScore(0);
        this.updateLevel(1);
        this.updateLines(0);
        // Don't reset high score
    }

    drawBlock(ctx, x, y, type, alpha = 1) {
        const blockSize = GRID - DISPLAY.GRID_LINE_WIDTH;
        const xPos = x * GRID;
        const yPos = y * GRID;

        // Draw grid lines
        ctx.fillStyle = DISPLAY.GRID_COLOR;
        ctx.fillRect(xPos, yPos, GRID, GRID);

        // Draw main block
        ctx.fillStyle = COLORS[type];
        ctx.globalAlpha = alpha;

        // Main block fill
        ctx.fillRect(xPos, yPos, blockSize, blockSize);

        // Draw border
        ctx.strokeStyle = alpha < 1 ? BLOCK_STYLE.ghostBorder : BLOCK_STYLE.border;
        ctx.lineWidth = BLOCK_STYLE.borderWidth;
        ctx.strokeRect(
            xPos + BLOCK_STYLE.borderWidth/2, 
            yPos + BLOCK_STYLE.borderWidth/2, 
            blockSize - BLOCK_STYLE.borderWidth, 
            blockSize - BLOCK_STYLE.borderWidth
        );

        // Draw highlight (top and left edges)
        ctx.fillStyle = BLOCK_STYLE.highlight;
        ctx.beginPath();
        ctx.moveTo(xPos, yPos);
        ctx.lineTo(xPos + blockSize, yPos);
        ctx.lineTo(xPos + blockSize - 4, yPos + 4);
        ctx.lineTo(xPos + 4, yPos + 4);
        ctx.lineTo(xPos + 4, yPos + blockSize - 4);
        ctx.lineTo(xPos, yPos + blockSize);
        ctx.closePath();
        ctx.fill();

        // Draw shadow (bottom and right edges)
        ctx.fillStyle = BLOCK_STYLE.shadow;
        ctx.beginPath();
        ctx.moveTo(xPos + blockSize, yPos);
        ctx.lineTo(xPos + blockSize, yPos + blockSize);
        ctx.lineTo(xPos, yPos + blockSize);
        ctx.lineTo(xPos + 4, yPos + blockSize - 4);
        ctx.lineTo(xPos + blockSize - 4, yPos + blockSize - 4);
        ctx.lineTo(xPos + blockSize - 4, yPos + 4);
        ctx.closePath();
        ctx.fill();

        // Reset global alpha
        ctx.globalAlpha = 1;
    }

    drawGridLines(ctx, width, height) {
        ctx.strokeStyle = DISPLAY.GRID_COLOR;
        ctx.lineWidth = DISPLAY.GRID_LINE_WIDTH;

        // Draw vertical lines
        for (let x = 0; x <= width; x += GRID) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += GRID) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }
}

// Create and export singleton instance
const displaySystem = new DisplaySystem();
console.log('DisplaySystem created:', displaySystem);
console.log('DisplaySystem methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(displaySystem)));
export default displaySystem;
