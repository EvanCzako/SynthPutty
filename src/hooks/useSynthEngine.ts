import { useEffect, useRef } from "react";
import { useSynthStore } from "../store/synthStore";

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

interface OscillatorVoice {
    osc: OscillatorNode;
    gain: GainNode;
}

type VoiceChain = {
    oscillators: OscillatorNode[];
    filter: BiquadFilterNode;
    gain: GainNode;
};

export function useSynthEngine() {
    const {
        waveform,
        filterType,
        filterCutoff,
        detune,
        voices,
        activeNotes,
		setActiveNotes
    } = useSynthStore();

    const playingNotesRef = useRef<Record<number, VoiceChain[]>>({});

    // Cleanup and rebuild notes if waveform, voices, or detune change
    useEffect(() => {
        const playingNotes = playingNotesRef.current;

        for (const noteStr of Object.keys(playingNotes)) {
            const note = Number(noteStr);
            const chains = playingNotes[note];

            // Fade out existing
            chains.forEach(({ oscillators, gain }) => {
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    audioCtx.currentTime + 0.05
                );
                oscillators.forEach((osc) => osc.stop(audioCtx.currentTime + 0.05));
            });
            delete playingNotes[note];
        }

        // Rebuild with new settings for all held notes
        for (const noteStr of Object.keys(activeNotes)) {
            const note = Number(noteStr);
            const freq = midiToFreq(note);
            const velocity = activeNotes[note].velocity;
            const chains: VoiceChain[] = [];

            for (let i = 0; i < voices; i++) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                const filter = audioCtx.createBiquadFilter();

                const spread = (i - (voices - 1) / 2) * detune;

                osc.type = waveform;
                osc.frequency.value = freq;
                osc.detune.value = spread;

                filter.type = filterType;
                filter.frequency.value = filterCutoff;

                gain.gain.value = velocity / 127;

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start();

                chains.push({ oscillators: [osc], filter, gain });
            }

            playingNotes[note] = chains;
        }
    }, [waveform, detune, voices]);

    // Apply real-time filter updates to active notes
    useEffect(() => {
        const playingNotes = playingNotesRef.current;
        for (const chains of Object.values(playingNotes)) {
            chains.forEach(({ filter }) => {
                filter.type = filterType;
                filter.frequency.setTargetAtTime(filterCutoff, audioCtx.currentTime, 0.01);
            });
        }
    }, [filterType, filterCutoff]);

    // Start/stop notes based on activeNotes
    useEffect(() => {
        const playingNotes = playingNotesRef.current;

        // Start new notes
        for (const noteStr of Object.keys(activeNotes)) {
            const note = Number(noteStr);
            if (!playingNotes[note]) {
                const freq = midiToFreq(note);
                const velocity = activeNotes[note].velocity;
                const chains: VoiceChain[] = [];

                for (let i = 0; i < voices; i++) {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    const filter = audioCtx.createBiquadFilter();

                    const spread = (i - (voices - 1) / 2) * detune;

                    osc.type = waveform;
                    osc.frequency.value = freq;
                    osc.detune.value = spread;

                    filter.type = filterType;
                    filter.frequency.value = filterCutoff;

                    gain.gain.value = velocity / 127;

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(audioCtx.destination);

                    osc.start();

                    chains.push({ oscillators: [osc], filter, gain });
                }

                playingNotes[note] = chains;
            }
        }

        // Stop released notes
        for (const noteStr of Object.keys(playingNotes)) {
            const note = Number(noteStr);
            if (!activeNotes[note]) {
                const chains = playingNotes[note];
                chains.forEach(({ oscillators, gain }) => {
                    gain.gain.exponentialRampToValueAtTime(
                        0.001,
                        audioCtx.currentTime + 0.1
                    );
                    oscillators.forEach((osc) => osc.stop(audioCtx.currentTime + 0.1));
                });
                delete playingNotes[note];
            }
        }
    }, [activeNotes]);


    // Clear function to manually stop all notes
    const clearAllNotes = () => {
        const playingNotes = playingNotesRef.current;
        for (const note in playingNotes) {
            const chains = playingNotes[note];
            chains.forEach(({ oscillators, gain }) => {
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    audioCtx.currentTime + 0.1
                );
                oscillators.forEach((osc) => osc.stop(audioCtx.currentTime + 0.1));
            });
        }
        playingNotesRef.current = {};
        setActiveNotes({}); // Clear from store
    };

    return { clearAllNotes };
}

// Helpers
function midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
}
