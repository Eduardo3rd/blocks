import { DEFAULT_FEATURES } from '../config/constants.js';

class StorageSystem {
    constructor() {
        this.storageKeys = {
            HIGH_SCORE: 'tetrisHighScore',
            FEATURES: 'tetrisFeatures',
            SETTINGS: 'tetrisSettings',
            MUTE: 'tetrisMuted'
        };
    }

    // High Score Methods
    getHighScore() {
        const score = localStorage.getItem(this.storageKeys.HIGH_SCORE);
        return score ? parseInt(score) : 0;
    }

    setHighScore(score) {
        localStorage.setItem(this.storageKeys.HIGH_SCORE, score.toString());
    }

    resetHighScore() {
        localStorage.removeItem(this.storageKeys.HIGH_SCORE);
    }

    // Feature Toggle Methods
    getFeatures() {
        try {
            const stored = localStorage.getItem(this.storageKeys.FEATURES);
            return stored ? JSON.parse(stored) : DEFAULT_FEATURES;
        } catch (error) {
            console.error('Error loading features:', error);
            return DEFAULT_FEATURES;
        }
    }

    setFeatures(features) {
        try {
            localStorage.setItem(this.storageKeys.FEATURES, JSON.stringify(features));
        } catch (error) {
            console.error('Error saving features:', error);
        }
    }

    // Game Settings Methods
    getSettings() {
        try {
            const stored = localStorage.getItem(this.storageKeys.SETTINGS);
            return stored ? JSON.parse(stored) : {
                startingLevel: 1,
                dropSpeed: 1.0
            };
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                startingLevel: 1,
                dropSpeed: 1.0
            };
        }
    }

    setSettings(settings) {
        try {
            localStorage.setItem(this.storageKeys.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    // Audio Mute State
    getMuteState() {
        return localStorage.getItem(this.storageKeys.MUTE) === 'true';
    }

    setMuteState(muted) {
        localStorage.setItem(this.storageKeys.MUTE, muted.toString());
    }

    // Clear all stored data
    clearAllData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Check if storage is available
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Create and export a singleton instance
const storageSystem = new StorageSystem();
export default storageSystem;
