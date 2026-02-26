import { useEffect, useRef } from "react";
import { useCompressor } from "./useCompressor";
import { useSynthStore } from "../store/synthStore";

type VoiceChain = {
    oscillators: OscillatorNode[];
    filter: BiquadFilterNode;
    gain: GainNode;
};

const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();

const vibOsc = audioCtx.createOscillator();
const vibGain = audioCtx.createGain();

vibOsc.type = "sine";
vibOsc.frequency.value = useSynthStore.getState().vibratoRate;
vibGain.gain.value = useSynthStore.getState().vibratoDepth;

vibOsc.connect(vibGain);
vibOsc.start();

const masterGain = audioCtx.createGain();
masterGain.gain.value = 1;
const analyser = audioCtx.createAnalyser();

export function useSynthEngine() {
    useCompressor(audioCtx, masterGain, analyser);
    const {
        waveform,
        filterType,
        filterCutoff,
        detune,
        voices,
        activeNotes,
        setActiveNotes,
        masterVolume,
        filterEnabled,
        vibratoRate,
        vibratoDepth,
        setAnalyserNode,
        analyserNode,
        setVibratoOsc,
        vibratoOsc,
        vibratoGain,
        filterQ,
        attack,
        release,
    } = useSynthStore();

    const playingNotesRef = useRef<Record<number, VoiceChain[]>>({});
    const prevActiveNotesRef = useRef<Record<number, { velocity: number }>>({});

    if (!analyserNode) {
        setAnalyserNode(analyser);
    }
    if (!vibratoOsc) {
        setVibratoOsc(vibOsc, vibGain);
    }

    const clearAllNotes = () => {
        const playingNotes = playingNotesRef.current;
        for (const note in playingNotes) {
            const chains = playingNotes[note];
            chains.forEach(({ oscillators, gain }) => {
                const now = audioCtx.currentTime;

                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(gain.gain.value, now);

                gain.gain.linearRampToValueAtTime(0.001, now + release);

                oscillators.forEach(
                    (osc) => osc.stop(now + release + 0.05),
                );
            });
        }
        playingNotesRef.current = {};
        setActiveNotes({});
    };

    useEffect(() => {
        masterGain.gain.setTargetAtTime(
            masterVolume,
            audioCtx.currentTime,
            0.01,
        );
    }, [masterVolume]);

    useEffect(() => {
        const playingNotes = playingNotesRef.current;

        for (const noteStr of Object.keys(playingNotes)) {
            const note = Number(noteStr);
            const chains = playingNotes[note];

            chains.forEach(({ oscillators, gain }) => {
                const now = audioCtx.currentTime;

                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(gain.gain.value, now);

                gain.gain.linearRampToValueAtTime(0.001, now + release);

                oscillators.forEach(
                    (osc) => osc.stop(now + release + 0.05),
                );
            });
            delete playingNotes[note];
        }

        const totalActiveNotes = Object.keys(activeNotes).length || 1;
        const totalOscillators = totalActiveNotes * voices;

        for (const noteStr of Object.keys(activeNotes)) {
            const note = Number(noteStr);
            const freq = midiToFreq(note);
            const velocity = activeNotes[note].velocity;
            const chains: VoiceChain[] = [];

            for (let i = 0; i < voices; i++) {
                const osc = audioCtx.createOscillator();
                if (vibratoGain) {
                    vibratoGain.connect(osc.detune);
                }
                const gain = audioCtx.createGain();
                const filter = audioCtx.createBiquadFilter();

                const step = voices > 1 ? detune / (voices - 1) : 0;
                const spread = i * step - detune / 2;

                osc.type = waveform;
                osc.frequency.value = freq;
                if (spread) {
                    osc.detune.setTargetAtTime(
                        spread,
                        audioCtx.currentTime,
                        0.05,
                    );
                } else {
                    osc.detune.value = 0;
                }

                filter.type = filterType;
                filter.frequency.value = filterCutoff;

                const now = audioCtx.currentTime;
                const velocityGain =
                    (velocity / 127) * (masterVolume / (totalOscillators + 1));

                gain.gain.setValueAtTime(0.001, now);

                gain.gain.linearRampToValueAtTime(velocityGain, now + attack);

                if (filterEnabled) {
                    osc.connect(filter);
                    filter.connect(gain);
                } else {
                    osc.connect(gain);
                }

                gain.connect(masterGain);
                osc.start(now);

                chains.push({ oscillators: [osc], filter, gain });
            }

            playingNotes[note] = chains;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waveform, voices, masterVolume]);

    useEffect(() => {
        const prevNotes = prevActiveNotesRef.current;
        const nextNotes = activeNotes;
        const now = audioCtx.currentTime;

        const newNotes = Object.keys(nextNotes)
            .map(Number)
            .filter((note) => !prevNotes[note]);

        const releasedNotes = Object.keys(prevNotes)
            .map(Number)
            .filter((note) => !nextNotes[note]);

        for (const note of releasedNotes) {
            const chains = playingNotesRef.current[note];
            if (chains) {
                chains.forEach(({ oscillators, gain }) => {
                    gain.gain.cancelScheduledValues(now);
                    gain.gain.setValueAtTime(gain.gain.value, now);
                    gain.gain.linearRampToValueAtTime(0.001, now + release);
                    oscillators.forEach((osc) =>
                        osc.stop(now + release + 0.05),
                    );
                });
                delete playingNotesRef.current[note];
            }
        }

        for (const note of newNotes) {
            const freq = midiToFreq(note);
            const velocity = nextNotes[note].velocity;
            const chains: VoiceChain[] = [];

            const totalOscillators = voices;

            for (let i = 0; i < voices; i++) {
                const osc = audioCtx.createOscillator();
                if (vibratoGain) {
                    vibratoGain.connect(osc.detune);
                }
                const gain = audioCtx.createGain();
                const filter = audioCtx.createBiquadFilter();

                const step = voices > 1 ? detune / (voices - 1) : 0;
                const spread = i * step - detune / 2;

                osc.type = waveform;
                osc.frequency.value = freq;
                osc.detune.value = spread;

                filter.type = filterType;
                filter.frequency.value = filterCutoff;
                filter.Q.value = filterQ;

                const velocityGain =
                    (velocity / 127) * (masterVolume / (totalOscillators + 1));

                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(velocityGain, now + attack);

                if (filterEnabled) {
                    osc.connect(filter);
                    filter.connect(gain);
                } else {
                    osc.connect(gain);
                }

                gain.connect(masterGain);
                osc.start(now);

                chains.push({ oscillators: [osc], filter, gain });
            }

            playingNotesRef.current[note] = chains;
        }

        prevActiveNotesRef.current = { ...nextNotes };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeNotes]);

    useEffect(() => {
        const playingNotes = playingNotesRef.current;
        for (const chains of Object.values(playingNotes)) {
            const numVoices = chains.length;

            chains.forEach((chain, i) => {
                const spread = (i - (numVoices - 1) / 2) * detune;
                chain.oscillators.forEach((osc) => {
                    osc.detune.setTargetAtTime(
                        spread,
                        audioCtx.currentTime,
                        0.05,
                    );
                });
            });
        }
    }, [detune]);

    useEffect(() => {
        if (vibratoOsc) {
            vibratoOsc.frequency.setTargetAtTime(
                vibratoRate,
                audioCtx.currentTime,
                0.05,
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vibratoRate]);

    useEffect(() => {
        if (vibratoGain) {
            vibratoGain.gain.setTargetAtTime(
                vibratoDepth,
                audioCtx.currentTime,
                0.05,
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vibratoDepth]);

    useEffect(() => {
        const playingNotes = playingNotesRef.current;
        for (const chains of Object.values(playingNotes)) {
            chains.forEach(({ oscillators, filter, gain }) => {
                oscillators.forEach((osc) => {
                    try {
                        osc.disconnect();
                    } catch {}
                });
                try {
                    filter.disconnect();
                } catch {}
                try {
                    gain.disconnect();
                } catch {}

                if (filterEnabled) {
                    oscillators.forEach((osc) => osc.connect(filter));
                    filter.connect(gain);
                } else {
                    oscillators.forEach((osc) => osc.connect(gain));
                }
                gain.connect(masterGain);

                filter.type = filterType;
                filter.frequency.setTargetAtTime(
                    filterCutoff,
                    audioCtx.currentTime,
                    0.01,
                );
                filter.Q.value = filterQ;
            });
        }
    }, [filterEnabled, filterType, filterCutoff, filterQ]);

    return { clearAllNotes };
}

function midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
}
