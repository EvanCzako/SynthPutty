import { useEffect, useRef } from "react";
import { useSynthStore } from "../store/synthStore";

type VoiceChain = {
    oscillators: OscillatorNode[];
    filter: BiquadFilterNode;
    gain: GainNode;
    lfos?: OscillatorNode[];
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
masterGain.connect(analyser);
analyser.connect(audioCtx.destination);
masterGain.connect(audioCtx.destination);

export function useSynthEngine() {
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
		filterQ
    } = useSynthStore();

    const playingNotesRef = useRef<Record<number, VoiceChain[]>>({});
	
	if (!analyserNode) {
		setAnalyserNode(analyser);
	}
	if (!vibratoOsc) {
		setVibratoOsc(vibOsc, vibGain);
	}

	

    // Clear function to manually stop all notes
    const clearAllNotes = () => {
        const playingNotes = playingNotesRef.current;
        for (const note in playingNotes) {
            const chains = playingNotes[note];
            chains.forEach(({ oscillators, gain, lfos }) => {
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    audioCtx.currentTime + 0.1,
                );
                oscillators.forEach((osc) =>
                    osc.stop(audioCtx.currentTime + 0.1),
                );
                lfos?.forEach((lfo) => {
                    lfo.stop(audioCtx.currentTime + 0.1);
                });
            });
        }
        playingNotesRef.current = {};
        setActiveNotes({});
    };

    // Update master volume
    useEffect(() => {
        masterGain.gain.setTargetAtTime(
            masterVolume,
            audioCtx.currentTime,
            0.01,
        );
    }, [masterVolume]);

    // Cleanup and rebuild notes if waveform, voices, or detune change
    useEffect(() => {
        const playingNotes = playingNotesRef.current;

        for (const noteStr of Object.keys(playingNotes)) {
            const note = Number(noteStr);
            const chains = playingNotes[note];

            // Fade out existing
            chains.forEach(({ oscillators, gain, lfos }) => {
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    audioCtx.currentTime + 0.05,
                );
                oscillators.forEach((osc) =>
                    osc.stop(audioCtx.currentTime + 0.05),
                );
                lfos?.forEach((lfo) => {
                    lfo.stop(audioCtx.currentTime + 0.05);
                });
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
					osc.detune.setTargetAtTime(spread, audioCtx.currentTime, 0.05);
				} else {
					osc.detune.value = 0;
				}

				filter.type = filterType;
				filter.frequency.value = filterCutoff;

				gain.gain.value =
					(velocity / 127) * (masterVolume / (totalOscillators + 1));

				if (filterEnabled) {
					osc.connect(filter);
					filter.connect(gain);
				} else {
					osc.connect(gain);
				}

				gain.connect(masterGain);
				osc.start();

				chains.push({ oscillators: [osc], filter, gain });
			}

			playingNotes[note] = chains;

        }
    }, [waveform, voices, activeNotes]);

	// For detune
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
						0.05
					);
				});
			});
		}
	}, [detune]);


	// For persisting lfos/vibratos
	useEffect(() => {
		if (vibratoOsc) {
			vibratoOsc.frequency.setTargetAtTime(vibratoRate, audioCtx.currentTime, 0.05);
		}
	}, [vibratoRate]);

	useEffect(() => {
		if (vibratoGain) {
			vibratoGain.gain.setTargetAtTime(vibratoDepth, audioCtx.currentTime, 0.05);
		}
	}, [vibratoDepth]);



    // When filterEnabled changes, update all playing notes connections
    useEffect(() => {
        const playingNotes = playingNotesRef.current;
        for (const chains of Object.values(playingNotes)) {
            chains.forEach(({ oscillators, filter, gain }) => {
                // Disconnect existing connections first
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

                // Reconnect based on filterEnabled
                if (filterEnabled) {
                    oscillators.forEach((osc) => osc.connect(filter));
                    filter.connect(gain);
                } else {
                    oscillators.forEach((osc) => osc.connect(gain));
                }
                gain.connect(masterGain);

                // Update filter params anyway for safety
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
                    const lfo = audioCtx.createOscillator();
                    const lfoGain = audioCtx.createGain();

                    // LFO setup
                    lfo.type = "sine";
                    lfo.frequency.value = vibratoRate;
                    lfoGain.gain.value = vibratoDepth;

                    // Connect LFO to detune
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.detune);

                    // Start LFO
                    lfo.start();

                    const gain = audioCtx.createGain();
                    const filter = audioCtx.createBiquadFilter();

                    const spread = (i - (voices - 1) / 2) * detune;

                    osc.type = waveform;
                    osc.frequency.value = freq;
                    osc.detune.setTargetAtTime(spread, audioCtx.currentTime, 0.05);

                    filter.type = filterType;
                    filter.frequency.value = filterCutoff;

                    gain.gain.value = velocity / 127;

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(masterGain);

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
                        audioCtx.currentTime + 0.1,
                    );
                    oscillators.forEach((osc) =>
                        osc.stop(audioCtx.currentTime + 0.1),
                    );
                });
                delete playingNotes[note];
            }
        }
    }, [activeNotes]);

    return { clearAllNotes };
}

// Helpers
function midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
}
