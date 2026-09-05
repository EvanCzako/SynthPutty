import { create } from 'zustand';
import { PRESETS } from '../presets';

export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';
export type FilterType = 'lowpass' | 'bandpass' | 'highpass';

/* Held notes beyond this are ignored. Each note is `voices` oscillators, so
 * ten notes at eight voices is already eighty running oscillators. */
export const MAX_HELD_NOTES = 10;

export interface SynthState {
    waveform: WaveformType;
    filterType: FilterType;
    filterCutoff: number;
    filterQ: number;
    filterEnabled: boolean;
    detune: number;
    voices: number;
    vibratoRate: number;
    vibratoDepth: number;
    attack: number;
    release: number;
    masterVolume: number;

    /* MIDI note number -> velocity. Written by every input source (piano,
     * computer keyboard, MIDI device) and read by the audio engine. */
    activeNotes: Record<number, { velocity: number }>;

    /* Flips once the AudioContext exists, which cannot happen before the
     * first user gesture. Drives the "press a key to start" hint. */
    audioReady: boolean;
    midiEnabled: boolean;
    midiError: string | null;

    setWaveform: (waveform: WaveformType) => void;
    setFilterType: (type: FilterType) => void;
    setFilterCutoff: (cutoff: number) => void;
    setFilterQ: (q: number) => void;
    setFilterEnabled: (enabled: boolean) => void;
    setDetune: (detune: number) => void;
    setVoices: (voices: number) => void;
    setVibratoRate: (rate: number) => void;
    setVibratoDepth: (depth: number) => void;
    setAttack: (attack: number) => void;
    setRelease: (release: number) => void;
    setMasterVolume: (volume: number) => void;

    /* Index into PRESETS. Kept here rather than in the component so the
     * label and the parameters it names cannot disagree. */
    presetIndex: number;
    cyclePreset: () => void;

    setAudioReady: (ready: boolean) => void;
    setMidiEnabled: (enabled: boolean) => void;
    setMidiError: (message: string | null) => void;

    noteOn: (note: number, velocity: number) => void;
    noteOff: (note: number) => void;
    /* Releases everything at once. The engine watches activeNotes, so
     * emptying it is all that "all notes off" needs to do. */
    panic: () => void;
}

export const useSynthStore = create<SynthState>((set) => ({
    /* The opening sound is the first preset, not a second copy of it. */
    ...PRESETS[0].params,
    presetIndex: 0,
    masterVolume: 0.5,

    activeNotes: {},

    audioReady: false,
    midiEnabled: false,
    midiError: null,

    setWaveform: (waveform) => set({ waveform }),
    setFilterType: (filterType) => set({ filterType }),
    setFilterCutoff: (filterCutoff) => set({ filterCutoff }),
    setFilterQ: (filterQ) => set({ filterQ }),
    setFilterEnabled: (filterEnabled) => set({ filterEnabled }),
    setDetune: (detune) => set({ detune }),
    setVoices: (voices) => set({ voices }),
    setVibratoRate: (vibratoRate) => set({ vibratoRate }),
    setVibratoDepth: (vibratoDepth) => set({ vibratoDepth }),
    setAttack: (attack) => set({ attack }),
    setRelease: (release) => set({ release }),
    setMasterVolume: (masterVolume) => set({ masterVolume }),

    /* One set() for all eleven parameters. Applying them one setter at a time
     * meant eleven renders and eleven passes through the audio effects, which
     * restarted every held note several times over. */
    cyclePreset: () =>
        set((state) => {
            const presetIndex = (state.presetIndex + 1) % PRESETS.length;
            return { presetIndex, ...PRESETS[presetIndex].params };
        }),

    setAudioReady: (audioReady) => set({ audioReady }),
    /* Turning MIDI off also clears any past failure, so re-enabling starts
     * from a clean slate rather than showing a stale error. */
    setMidiEnabled: (midiEnabled) => set({ midiEnabled, midiError: null }),
    setMidiError: (midiError) => set({ midiError }),

    noteOn: (note, velocity) =>
        set((state) => {
            if (state.activeNotes[note]) return state;
            if (Object.keys(state.activeNotes).length >= MAX_HELD_NOTES) return state;
            return { activeNotes: { ...state.activeNotes, [note]: { velocity } } };
        }),

    noteOff: (note) =>
        set((state) => {
            if (!state.activeNotes[note]) return state;
            const next = { ...state.activeNotes };
            delete next[note];
            return { activeNotes: next };
        }),

    panic: () =>
        set((state) => (Object.keys(state.activeNotes).length ? { activeNotes: {} } : state)),
}));
