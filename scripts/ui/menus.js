import storageSystem from '../systems/storage.js';
import { DEFAULT_FEATURES } from '../config/constants.js';
import audioSystem from '../systems/audio.js';

class MenuSystem {
    constructor() {
        this.menus = {
            start: document.getElementById('start-menu'),
            pause: document.getElementById('pause-menu'),
            settings: document.getElementById('developer-menu'),
            gameOver: document.querySelector('.game-over')
        };
        
        this.callbacks = {};
    }

    init() {
        console.log('Initializing menu system');
        this.hideAllMenus();
        this.setupEventListeners();
        this.initializeLevelSelector();
        
        // Show start menu by default
        if (this.menus.start) {
            this.menus.start.style.display = 'block';
            console.log('Start menu initialized and displayed');
        } else {
            console.error('Start menu element not found during initialization');
        }
    }

    initializeLevelSelector() {
        const levelSelector = document.getElementById('starting-level');
        if (!levelSelector) return;

        // Clear existing options
        levelSelector.innerHTML = '';
        
        // Add levels 0-29
        for (let i = 0; i <= 29; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            levelSelector.appendChild(option);
        }

        // Set default level
        levelSelector.value = 0;
    }

    setupEventListeners() {
        // Start menu buttons
        const startButton = document.getElementById('start-button');
        const settingsButton = document.getElementById('settings-button');

        if (startButton) {
            startButton.addEventListener('click', () => {
                console.log('Start button clicked');
                if (this.callbacks.onStart) {
                    this.callbacks.onStart();
                }
            });
        }

        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                this.showMenu('settings');
            });
        }

        // Settings close button
        const settingsCloseButton = document.getElementById('settings-close');
        if (settingsCloseButton) {
            settingsCloseButton.addEventListener('click', () => {
                this.showMenu('start');
            });
        }

        // Pause menu buttons
        const resumeButton = document.getElementById('resume-button');
        const restartButton = document.getElementById('restart-button');

        if (resumeButton) {
            resumeButton.addEventListener('click', () => {
                if (this.callbacks.onResume) {
                    this.callbacks.onResume();
                }
            });
        }

        if (restartButton) {
            restartButton.addEventListener('click', () => {
                if (this.callbacks.onRestart) {
                    this.callbacks.onRestart();
                }
            });
        }
    }

    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }

    showMenu(menuName) {
        this.hideAllMenus();
        const menu = this.menus[menuName];
        if (menu) {
            menu.style.display = 'block';
            console.log(`Showing ${menuName} menu`);
        }
    }

    hideAllMenus() {
        Object.values(this.menus).forEach(menu => {
            if (menu) {
                menu.style.display = 'none';
            }
        });
    }

    showGameOver(finalScore) {
        this.hideAllMenus();
        if (this.menus.gameOver) {
            const scoreElement = this.menus.gameOver.querySelector('.final-score');
            if (scoreElement) {
                scoreElement.textContent = finalScore.toLocaleString();
            }
            this.menus.gameOver.classList.add('active');
        }
    }
}

const menuSystem = new MenuSystem();
export default menuSystem;
