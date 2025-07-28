// src/store/synthStore.ts
import { create } from "zustand";

export type WaveformType = "sine" | "square" | "triangle" | "sawtooth";
export type FilterType = "lowpass" | "highpass";

interface SynthState {
    waveform: WaveformType;
    filterType: FilterType;
    filterCutoff: number;
    detune: number;
    voices: number;
    activeNotes: Record<number, { velocity: number }>;

    setWaveform: (waveform: WaveformType) => void;
    setFilterType: (type: FilterType) => void;
    setFilterCutoff: (cutoff: number) => void;
    setDetune: (detune: number) => void;
    setVoices: (voices: number) => void;
    noteOn: (note: number, velocity: number) => void;
    noteOff: (note: number) => void;
}

export const useSynthStore = create<SynthState>((set) => ({
    waveform: "sine",
    filterType: "lowpass",
    filterCutoff: 800,
    detune: 0,
    voices: 1,
    activeNotes: {},

    setWaveform: (waveform) => set({ waveform }),
    setFilterType: (filterType) => set({ filterType }),
    setFilterCutoff: (filterCutoff) => set({ filterCutoff }),
    setDetune: (detune) => set({ detune }),
    setVoices: (voices) => set({ voices }),

    noteOn: (note, velocity) =>
        set((state) => ({
            activeNotes: { ...state.activeNotes, [note]: { velocity } },
        })),

    noteOff: (note) =>
        set((state) => {
            const newNotes = { ...state.activeNotes };
            delete newNotes[note];
            return { activeNotes: newNotes };
        }),
}));
