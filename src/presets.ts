import type { FilterType, WaveformType } from './store/synthStore';

/*
 * A preset is every sound-shaping parameter at once. The store's initial state
 * IS `PRESETS[0].params`, so "Default" and "what the app opens with" cannot
 * drift apart -- they are the same object.
 *
 * Every preset must set every parameter: a partial preset would leave whatever
 * the previous one happened to set, so the same preset would sound different
 * depending on what came before it.
 */
export type PresetParams = {
    waveform: WaveformType;
    filterEnabled: boolean;
    filterType: FilterType;
    filterCutoff: number;
    filterQ: number;
    voices: number;
    detune: number;
    vibratoDepth: number;
    vibratoRate: number;
    attack: number;
    release: number;
};

export type Preset = { name: string; params: PresetParams };

export const PRESETS: readonly Preset[] = [
    {
        name: 'Default',
        params: {
            waveform: 'sine',
            filterEnabled: false,
            filterType: 'lowpass',
            filterCutoff: 1200,
            filterQ: 1,
            voices: 1,
            detune: 0,
            vibratoDepth: 0,
            vibratoRate: 0,
            attack: 0.05,
            release: 0.3,
        },
    },
    {
        name: 'Supersaw',
        params: {
            waveform: 'sawtooth',
            filterEnabled: true,
            filterType: 'lowpass',
            filterCutoff: 1200,
            filterQ: 5,
            voices: 3,
            detune: 20,
            vibratoDepth: 15,
            vibratoRate: 5,
            attack: 0.05,
            release: 0.4,
        },
    },
    {
        name: 'Hollow',
        params: {
            waveform: 'square',
            filterEnabled: true,
            filterType: 'lowpass',
            filterCutoff: 5050,
            filterQ: 3,
            voices: 3,
            detune: 20,
            vibratoDepth: 15,
            vibratoRate: 5,
            attack: 0.02,
            release: 0.3,
        },
    },
    {
        name: 'Warble',
        params: {
            waveform: 'sine',
            filterEnabled: false,
            filterType: 'lowpass',
            filterCutoff: 5050,
            filterQ: 1,
            voices: 1,
            detune: 0,
            vibratoDepth: 34,
            vibratoRate: 5,
            attack: 0.1,
            release: 0.5,
        },
    },
];
