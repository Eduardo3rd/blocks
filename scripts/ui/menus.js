import storageSystem from '../systems/storage.js';
import { DEFAULT_FEATURES } from '../config/constants.js';
import audioSystem from '../systems/audio.js';

class MenuSystem {
    constructor() {
        console.log('MenuSystem constructor called');
        this.menus = {
            start: document.getElementById('start-menu'),
            pause: document.getElementById('pause-menu'),
            developer: document.getElementById('developer-menu'),
            gameOver: document.querySelector('.game-over')
        };
        console.log('Menus found:', this.menus);

        this.buttons = {
            start: document.getElementById('start-button'),
            settings: document.getElementById('settings-button'),
            resume: document.getElementById('resume-button'),
            restart: document.getElementById('restart-button'),
            settingsClose: document.getElementById('settings-close'),
            playAgain: document.getElementById('play-again-button'),
            mainMenu: document.getElementById('main-menu-button')
        };
        console.log('Buttons found:', this.buttons);

        this.callbacks = {
            onStart: null,
            onResume: null,
            onRestart: null,
            onSettingsChanged: null
        };
    }

    init() {
        console.log('MenuSystem init called');
        this.initializeMenus();
        this.initializeButtons();
        this.showMenu('start'); // Show start menu immediately
    }

    initializeMenus() {
        // Initialize feature toggles
        this.initializeFeatureToggles();
        
        // Initialize level selector
        this.initializeLevelSelector();
        
        // Set up menu transitions
        Object.values(this.menus).forEach(menu => {
            if (menu) {
                menu.style.transition = 'opacity 0.3s ease';
            }
        });
    }

    initializeFeatureToggles() {
        const features = storageSystem.getFeatures();
        
        // Set up toggle listeners
        const toggles = {
            'toggle-score': 'scoreDisplay',
            'toggle-level': 'levelDisplay',
            'toggle-lines': 'linesDisplay',
            'toggle-hold': 'holdPiece',
            'toggle-preview': 'previewPieces',
            'toggle-ghost': 'ghostPiece'
        };

        Object.entries(toggles).forEach(([id, feature]) => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.checked = features[feature];
                toggle.addEventListener('change', () => {
                    features[feature] = toggle.checked;
                    storageSystem.setFeatures(features);
                    if (this.callbacks.onSettingsChanged) {
                        this.callbacks.onSettingsChanged(features);
                    }
                });
            }
        });
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

        // Load saved level
        const settings = storageSystem.getSettings();
        levelSelector.value = settings.startingLevel || 1;

        // Save level changes
        levelSelector.addEventListener('change', () => {
            settings.startingLevel = parseInt(levelSelector.value);
            storageSystem.setSettings(settings);
        });
    }

    initializeButtons() {
        console.log('Initializing buttons');
        
        // Start button
        if (this.buttons.start) {
            this.buttons.start.onclick = () => {
                console.log('Start button clicked');
                if (this.callbacks.onStart) {
                    this.callbacks.onStart();
                } else {
                    console.error('No onStart callback registered');
                }
            };
        } else {
            console.error('Start button not found');
        }

        // Resume button
        if (this.buttons.resume) {
            this.buttons.resume.onclick = () => {
                console.log('Resume button clicked');
                if (this.callbacks.onResume) {
                    this.callbacks.onResume();
                } else {
                    console.error('No onResume callback registered');
                }
            };
        }

        // Settings button
        if (this.buttons.settings) {
            this.buttons.settings.onclick = () => {
                console.log('Settings button clicked');
                this.showMenu('developer');
            };
        }

        // Settings close button
        if (this.buttons.settingsClose) {
            this.buttons.settingsClose.onclick = () => {
                console.log('Settings close button clicked');
                this.showMenu('start');
            };
        }

        // Play Again button
        if (this.buttons.playAgain) {
            this.buttons.playAgain.onclick = () => {
                console.log('Play Again clicked');
                if (this.callbacks.onRestart) {
                    this.callbacks.onRestart();
                }
            };
        }

        // Main Menu button
        if (this.buttons.mainMenu) {
            this.buttons.mainMenu.onclick = () => {
                console.log('Main Menu clicked');
                location.reload();
            };
        }

        // ... rest of your button initialization
    }

    showMenu(menuName) {
        console.log(`Showing menu: ${menuName}`);
        
        // Hide all menus
        Object.values(this.menus).forEach(menu => {
            if (menu) {
                menu.style.display = 'none';
            }
        });

        // Show requested menu
        const menu = this.menus[menuName];
        if (menu) {
            console.log(`Display ${menuName} menu`);
            menu.style.display = 'block';
            this.currentMenu = menu;
        } else {
            console.error(`Menu ${menuName} not found`);
        }
    }

    hideAllMenus() {
        Object.values(this.menus).forEach(menu => {
            if (menu) {
                menu.style.display = 'none';
            }
        });
        this.currentMenu = null;
    }

    showGameOver(finalScore) {
        const gameOver = this.menus.gameOver;
        if (!gameOver) return;

        const scoreElement = gameOver.querySelector('.final-score');
        if (scoreElement) {
            scoreElement.textContent = finalScore;
        }

        gameOver.classList.add('active');
        this.currentMenu = gameOver;
    }

    setCallbacks(callbacks) {
        console.log('Setting callbacks:', callbacks);
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    getCurrentFeatures() {
        return storageSystem.getFeatures();
    }

    getStartingLevel() {
        const settings = storageSystem.getSettings();
        return settings.startingLevel || 1;
    }

    reset() {
        console.log('MenuSystem reset called');
        this.hideAllMenus();
        this.showMenu('start');
    }

    onStart() {
        audioSystem.init(); // Initialize audio on game start
        if (this.callbacks.onStart) {
            this.callbacks.onStart();
        }
    }

    onResume() {
        audioSystem.ensureInit(); // Ensure audio is initialized
        if (this.callbacks.onResume) {
            this.callbacks.onResume();
        }
    }
}

// Create and export a singleton instance
const menuSystem = new MenuSystem();
export default menuSystem;
