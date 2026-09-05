/*
 * Ownership of the Web Audio graph.
 *
 * The context is created lazily, on the first user gesture, rather than at
 * module scope: a context constructed before any interaction starts in the
 * `suspended` state and browsers will not start it, so the app would load
 * looking fine and play nothing.
 *
 * Graph:
 *   oscillator(s) -> [filter] -> voice gain -> masterGain -> compressor
 *                                                        -> analyser -> out
 *
 * The vibrato LFO is one oscillator for the whole app, connected to the
 * `detune` param of every voice oscillator.
 */

export type AudioGraph = {
    ctx: AudioContext;
    masterGain: GainNode;
    analyser: AnalyserNode;
    vibratoGain: GainNode;
    vibratoOsc: OscillatorNode;
};

/* Matches the compressor a mastering chain would use: enough to catch a
 * ten-note chord of sawtooths without audibly pumping a single note. */
const COMPRESSOR = {
    threshold: -18,
    knee: 18,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
} as const;

let graph: AudioGraph | null = null;
const readyListeners = new Set<() => void>();

/*
 * Idempotent. Call from inside a user-gesture handler -- a pointerdown or a
 * keydown -- not from an effect that happens to run soon after.
 */
export function ensureAudio(): AudioGraph {
    if (graph) {
        /* A context can be suspended again later (tab backgrounded on mobile,
         * an OS audio-route change), so re-check on every gesture. */
        if (graph.ctx.state === 'suspended') void graph.ctx.resume();
        return graph;
    }

    const Ctor =
        window.AudioContext ??
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor!();

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = COMPRESSOR.threshold;
    compressor.knee.value = COMPRESSOR.knee;
    compressor.ratio.value = COMPRESSOR.ratio;
    compressor.attack.value = COMPRESSOR.attack;
    compressor.release.value = COMPRESSOR.release;

    const analyser = ctx.createAnalyser();

    const vibratoOsc = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibratoOsc.type = 'sine';
    vibratoOsc.frequency.value = 0;
    vibratoGain.gain.value = 0;
    vibratoOsc.connect(vibratoGain);
    vibratoOsc.start();

    masterGain.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(ctx.destination);

    graph = { ctx, masterGain, analyser, vibratoGain, vibratoOsc };

    if (ctx.state === 'suspended') void ctx.resume();
    readyListeners.forEach((listener) => listener());
    return graph;
}

/* Null until the first gesture. Callers that only observe -- the spectrum
 * display -- must not force the context into existence. */
export function getAudio(): AudioGraph | null {
    return graph;
}

/* The spectrum display mounts before any audio exists and needs to re-render
 * once it does. */
export function onAudioReady(listener: () => void): () => void {
    readyListeners.add(listener);
    return () => readyListeners.delete(listener);
}

export function midiToFreq(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
}
