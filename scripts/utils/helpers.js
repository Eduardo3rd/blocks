/**
 * General purpose utility functions for the game
 */

// Random piece generation using 7-bag system
export function createBag() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    const bag = [];
    
    while (pieces.length > 0) {
        const index = Math.floor(Math.random() * pieces.length);
        bag.push(pieces.splice(index, 1)[0]);
    }
    
    console.log('Created new bag:', bag);
    return bag;
}

// Debounce function for input handling
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for limiting function calls
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Calculate dimensions based on grid size
export function calculateDimensions(gridSize, width, height) {
    return {
        width: width * gridSize,
        height: height * gridSize,
        gridSize
    };
}

// Deep clone an object or array
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }

    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

// Format time in milliseconds to MM:SS format
export function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Calculate frame time for animations
export function calculateFrameTime(fps) {
    return 1000 / fps;
}

// Linear interpolation
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// Ease in/out function
export function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Check if mobile device
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Generate unique ID
export function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Clamp number between min and max
export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

// Calculate aspect ratio
export function calculateAspectRatio(width, height) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
}

// Parse query string parameters
export function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}
