// ============================================================
// Donkey Kong JS - Audio System
// ============================================================

class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentSong = null;
        this.songAudio = null;
        this.muted = false;
        this.loaded = false;
    }

    async load(basePath) {
        const soundDefs = {
            'background-1': { type: 'mp3' },
            'background-2': { type: 'mp3' },
            'background-3': { type: 'mp3' },
            'death':        { type: 'wav' },
            'fall':         { type: 'wav' },
            'finish-board': { type: 'wav' },
            'finish-level-1': { type: 'wav' },
            'finish-level-2': { type: 'wav' },
            'get-item':     { type: 'wav' },
            'intro-scene':  { type: 'wav' },
            'jump':         { type: 'wav' },
            'smash':        { type: 'wav' },
            'spring':       { type: 'wav' },
            'start-board':  { type: 'wav' },
            'walk':         { type: 'wav' }
        };

        const promises = [];
        for (const [name, def] of Object.entries(soundDefs)) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = `${basePath}/${name}.${def.type}`;
            this.sounds[name] = audio;
            promises.push(new Promise((resolve) => {
                audio.addEventListener('canplaythrough', resolve, { once: true });
                audio.addEventListener('error', resolve, { once: true });
            }));
        }
        await Promise.all(promises);
        this.loaded = true;
    }

    play(name) {
        if (this.muted || !this.sounds[name]) return;
        try {
            const s = this.sounds[name];
            s.currentTime = 0;
            s.play().catch(() => {});
        } catch (e) {}
    }

    playSong(name, loop) {
        this.stopSong();
        if (this.muted || !this.sounds[name]) return;
        this.currentSong = name;
        this.songAudio = this.sounds[name];
        this.songAudio.loop = !!loop;
        this.songAudio.currentTime = 0;
        this.songAudio.play().catch(() => {});
    }

    stopSong() {
        if (this.songAudio) {
            this.songAudio.pause();
            this.songAudio.currentTime = 0;
            this.songAudio = null;
            this.currentSong = null;
        }
    }

    stopAll() {
        this.stopSong();
        for (const s of Object.values(this.sounds)) {
            s.pause();
            s.currentTime = 0;
        }
    }

    pauseSong() {
        if (this.songAudio) this.songAudio.pause();
    }

    resumeSong() {
        if (this.songAudio) this.songAudio.play().catch(() => {});
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) this.stopAll();
    }
}

const audioManager = new AudioManager();
