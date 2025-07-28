import { useEffect, useRef } from "react";
import { useSynthStore } from "../store/synthStore";

const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)();

export function useSynthEngine() {
    const { waveform, filterType, filterCutoff, detune, voices, activeNotes } =
        useSynthStore();

    const playingNotesRef = useRef<Record<number, OscillatorVoice[]>>({});

    useEffect(() => {
        const playingNotes = playingNotesRef.current;

        // Start new notes
        for (const noteStr of Object.keys(activeNotes)) {
            const note = Number(noteStr);
            if (!playingNotes[note]) {
                const freq = midiToFreq(note);
                const velocity = activeNotes[note].velocity;
                const voiceGroup: OscillatorVoice[] = [];

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

                    voiceGroup.push({ osc, gain });
                }

                playingNotes[note] = voiceGroup;
            }
        }

        // Stop released notes
        for (const noteStr of Object.keys(playingNotes)) {
            const note = Number(noteStr);
            if (!activeNotes[note]) {
                const voices = playingNotes[note];
                voices.forEach(({ osc, gain }) => {
                    gain.gain.exponentialRampToValueAtTime(
                        0.001,
                        audioCtx.currentTime + 0.1,
                    );
                    osc.stop(audioCtx.currentTime + 0.1);
                });
                delete playingNotes[note];
            }
        }
    }, [waveform, filterType, filterCutoff, detune, voices, activeNotes]);
}

// Helpers

function midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
}

interface OscillatorVoice {
    osc: OscillatorNode;
    gain: GainNode;
}
