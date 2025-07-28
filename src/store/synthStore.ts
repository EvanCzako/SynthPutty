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
    masterVolume: number;
    filterEnabled: boolean;
    vibratoRate: number;
    vibratoDepth: number;
	vibratoOsc: OscillatorNode | null;
	vibratoGain: GainNode | null;
	analyserNode: AnalyserNode | null;
	lfos: OscillatorNode[];
	lfoGains: GainNode[];

	setLFOs: (lfos: OscillatorNode[], gains: GainNode[]) => void;
	setAnalyserNode: (node: AnalyserNode) => void;
    setVibratoRate: (rate: number) => void;
    setVibratoDepth: (depth: number) => void;
    setFilterEnabled: (enabled: boolean) => void;
    setWaveform: (waveform: WaveformType) => void;
    setFilterType: (type: FilterType) => void;
    setFilterCutoff: (cutoff: number) => void;
    setDetune: (detune: number) => void;
    setVoices: (voices: number) => void;
    noteOn: (note: number, velocity: number) => void;
    noteOff: (note: number) => void;
    setActiveNotes: (activeNotes: Record<number, { velocity: number }>) => void;
    setMasterVolume: (volume: number) => void;
}

export const useSynthStore = create<SynthState>((set, get) => ({
    waveform: "sine",
    filterType: "lowpass",
    filterCutoff: 800,
    detune: 0,
    voices: 1,
    activeNotes: {},
    masterVolume: 1,
    filterEnabled: true,
    vibratoRate: 0, // in Hz
    vibratoDepth: 0, // in cents (detune range)
	vibratoOsc: null,
	vibratoGain: null,
	analyserNode: null,
	lfos: [],
	lfoGains: [],
	
	setLFOs: (lfos: OscillatorNode[], gains: GainNode[]) => set( { lfos, lfoGains: gains} ),
	setAnalyserNode: (node) => set({ analyserNode: node }),
    setVibratoRate: (rate: number) => set({ vibratoRate: rate }),
    setVibratoDepth: (depth: number) => set({ vibratoDepth: depth }),
    setFilterEnabled: (enabled: boolean) => set({ filterEnabled: enabled }),
    setWaveform: (waveform) => set({ waveform }),
    setFilterType: (filterType) => set({ filterType }),
    setFilterCutoff: (filterCutoff) => set({ filterCutoff }),
    setDetune: (detune) => set({ detune }),
    setVoices: (voices) => set({ voices }),
    setActiveNotes: (activeNotes: Record<number, { velocity: number }>) =>
        set({ activeNotes }),
    setMasterVolume: (volume: number) => set({ masterVolume: volume }),

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
