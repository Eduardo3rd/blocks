class AudioSystem {
    constructor() {
        this.sounds = {};
        this.initialized = false;
        this.enabled = true;
        // Start with dummy play function
        this.play = this.dummyPlay;
    }

    async init() {
        try {
            // Don't try to load audio files yet - just use dummy function
            this.initialized = true;
            console.log('Audio system initialized (dummy mode)');
        } catch (error) {
            console.error('Error initializing audio:', error);
            this.enabled = false;
        }
    }

    dummyPlay(soundName) {
        // console.log('Audio not ready:', soundName);
    }
}

const audioSystem = new AudioSystem();
export default audioSystem;
