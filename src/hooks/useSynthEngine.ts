import { useEffect, useRef } from 'react';
import { getAudio, midiToFreq } from '../audio/engine';
import { useSynthStore } from '../store/synthStore';

type Voice = {
    osc: OscillatorNode;
    filter: BiquadFilterNode;
    gain: GainNode;
};

/* A gain of exactly 0 is illegal for an exponential ramp and inaudible for a
 * linear one, so releases ramp to this instead. */
const SILENCE = 0.001;

/* Extra time after a release finishes before the oscillator is stopped, so the
 * ramp is never cut off mid-fade. */
const STOP_PAD_S = 0.05;

/* Every parameter that can be nudged rather than rebuilt uses this time
 * constant, which is short enough to feel instant and long enough not to click. */
const RAMP_S = 0.02;

/*
 * Drives the audio graph from the store.
 *
 * The division of labour matters: parameters that a running oscillator can
 * accept live (waveform, detune, filter, vibrato, volume) are *ramped* on the
 * existing nodes. Only `voices`, which changes how many oscillators a note
 * needs, rebuilds anything -- and masterVolume is applied once, on masterGain,
 * so dragging the volume slider no longer tears down and restarts every note.
 */
export function useSynthEngine() {
    const activeNotes = useSynthStore((s) => s.activeNotes);
    const waveform = useSynthStore((s) => s.waveform);
    const voices = useSynthStore((s) => s.voices);
    const detune = useSynthStore((s) => s.detune);
    const filterType = useSynthStore((s) => s.filterType);
    const filterCutoff = useSynthStore((s) => s.filterCutoff);
    const filterQ = useSynthStore((s) => s.filterQ);
    const filterEnabled = useSynthStore((s) => s.filterEnabled);
    const vibratoRate = useSynthStore((s) => s.vibratoRate);
    const vibratoDepth = useSynthStore((s) => s.vibratoDepth);
    const attack = useSynthStore((s) => s.attack);
    const release = useSynthStore((s) => s.release);
    const masterVolume = useSynthStore((s) => s.masterVolume);
    /* Flips exactly once, when the first gesture creates the graph. Every
     * parameter effect below bails while it is false, so each one takes it
     * as a dependency to re-apply itself the moment audio exists. */
    const audioReady = useSynthStore((s) => s.audioReady);

    const playing = useRef<Record<number, Voice[]>>({});
    const prevNotes = useRef<Record<number, { velocity: number }>>({});

    /* The note-start path reads these, and it runs from an effect rather than
     * from the render that changed them, so a ref is the honest source. */
    const params = useRef({
        waveform,
        voices,
        detune,
        filterType,
        filterCutoff,
        filterQ,
        filterEnabled,
        attack,
        release,
    });
    params.current = {
        waveform,
        voices,
        detune,
        filterType,
        filterCutoff,
        filterQ,
        filterEnabled,
        attack,
        release,
    };

    /* ---- Note on / note off ------------------------------------------- */

    useEffect(() => {
        /* Notes cannot start before the first gesture created the context.
         * The gesture handlers call ensureAudio(); this only observes. */
        const audio = getAudio();
        if (!audio) return;

        const { ctx, masterGain, vibratoGain } = audio;
        const now = ctx.currentTime;
        const p = params.current;

        for (const key of Object.keys(prevNotes.current)) {
            const note = Number(key);
            if (activeNotes[note]) continue;
            releaseVoices(playing.current[note], ctx, p.release);
            delete playing.current[note];
        }

        for (const key of Object.keys(activeNotes)) {
            const note = Number(key);
            if (prevNotes.current[note]) continue;
            playing.current[note] = startVoices({
                ctx,
                destination: masterGain,
                vibratoGain,
                freq: midiToFreq(note),
                velocity: activeNotes[note].velocity,
                now,
                ...p,
            });
        }

        prevNotes.current = activeNotes;
    }, [activeNotes, audioReady]);

    /* Stop everything still sounding when the hook unmounts, so a hot reload
     * or a route change does not leave oscillators running forever. */
    useEffect(() => {
        const held = playing.current;
        return () => {
            const audio = getAudio();
            if (!audio) return;
            for (const chains of Object.values(held)) {
                releaseVoices(chains, audio.ctx, 0);
            }
        };
    }, []);

    /* ---- Live parameter ramps ------------------------------------------ */

    useEffect(() => {
        const audio = getAudio();
        if (!audio) return;
        audio.masterGain.gain.setTargetAtTime(masterVolume, audio.ctx.currentTime, RAMP_S);
    }, [masterVolume, audioReady]);

    useEffect(() => {
        forEachVoice((voice) => {
            voice.osc.type = waveform;
        });
    }, [waveform, audioReady]);

    useEffect(() => {
        const audio = getAudio();
        if (!audio) return;
        const now = audio.ctx.currentTime;
        for (const chains of Object.values(playing.current)) {
            const spread = chains.length > 1 ? detune / (chains.length - 1) : 0;
            chains.forEach((voice, i) => {
                voice.osc.detune.setTargetAtTime(i * spread - detune / 2, now, RAMP_S);
            });
        }
    }, [detune, audioReady]);

    useEffect(() => {
        const audio = getAudio();
        if (!audio) return;
        const now = audio.ctx.currentTime;
        forEachVoice((voice) => {
            voice.filter.type = filterType;
            voice.filter.frequency.setTargetAtTime(filterCutoff, now, RAMP_S);
            voice.filter.Q.setTargetAtTime(filterQ, now, RAMP_S);
        });
    }, [filterType, filterCutoff, filterQ, audioReady]);

    /* Bypassing the filter is a rewiring rather than a ramp, so it is the one
     * filter change that touches connections. */
    useEffect(() => {
        const audio = getAudio();
        if (!audio) return;
        forEachVoice((voice) => {
            voice.osc.disconnect();
            voice.filter.disconnect();
            if (filterEnabled) {
                voice.osc.connect(voice.filter);
                voice.filter.connect(voice.gain);
            } else {
                voice.osc.connect(voice.gain);
            }
        });
    }, [filterEnabled, audioReady]);

    useEffect(() => {
        const audio = getAudio();
        if (!audio) return;
        audio.vibratoOsc.frequency.setTargetAtTime(vibratoRate, audio.ctx.currentTime, RAMP_S);
    }, [vibratoRate, audioReady]);

    useEffect(() => {
        const audio = getAudio();
        if (!audio) return;
        audio.vibratoGain.gain.setTargetAtTime(vibratoDepth, audio.ctx.currentTime, RAMP_S);
    }, [vibratoDepth, audioReady]);

    /* Changing the voice count changes how many oscillators a note owns, so
     * this is the only parameter that has to rebuild sounding notes. */
    useEffect(() => {
        const audio = getAudio();
        if (!audio) return;
        const { ctx, masterGain, vibratoGain } = audio;
        const now = ctx.currentTime;
        const p = params.current;
        const held = useSynthStore.getState().activeNotes;

        for (const key of Object.keys(playing.current)) {
            const note = Number(key);
            releaseVoices(playing.current[note], ctx, p.release);
            delete playing.current[note];
        }
        for (const key of Object.keys(held)) {
            const note = Number(key);
            playing.current[note] = startVoices({
                ctx,
                destination: masterGain,
                vibratoGain,
                freq: midiToFreq(note),
                velocity: held[note].velocity,
                now,
                ...p,
            });
        }
        // Rebuilding on any other parameter would restart every held note.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voices]);

    function forEachVoice(fn: (voice: Voice) => void) {
        for (const chains of Object.values(playing.current)) chains.forEach(fn);
    }
}

/* ---- Voice construction and teardown ----------------------------------- */

type StartArgs = {
    ctx: AudioContext;
    destination: AudioNode;
    vibratoGain: GainNode;
    freq: number;
    velocity: number;
    now: number;
    waveform: OscillatorType;
    voices: number;
    detune: number;
    filterType: BiquadFilterType;
    filterCutoff: number;
    filterQ: number;
    filterEnabled: boolean;
    attack: number;
};

function startVoices(args: StartArgs): Voice[] {
    const {
        ctx,
        destination,
        vibratoGain,
        freq,
        velocity,
        now,
        waveform,
        voices,
        detune,
        filterType,
        filterCutoff,
        filterQ,
        filterEnabled,
        attack,
    } = args;

    const chains: Voice[] = [];
    const spread = voices > 1 ? detune / (voices - 1) : 0;
    /* Headroom only: master volume lives on masterGain, and the compressor
     * catches what stacking several notes adds on top. Applying volume here
     * too was what forced a full rebuild on every volume change. */
    const peak = (velocity / 127) * (1 / (voices + 1));

    for (let i = 0; i < voices; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = waveform;
        osc.frequency.value = freq;
        osc.detune.value = i * spread - detune / 2;
        vibratoGain.connect(osc.detune);

        filter.type = filterType;
        filter.frequency.value = filterCutoff;
        filter.Q.value = filterQ;

        gain.gain.setValueAtTime(SILENCE, now);
        gain.gain.linearRampToValueAtTime(peak, now + attack);

        if (filterEnabled) {
            osc.connect(filter);
            filter.connect(gain);
        } else {
            osc.connect(gain);
        }
        gain.connect(destination);

        /* Without this every played note leaves a vibratoGain -> osc.detune
         * edge and three orphaned nodes behind for the life of the page. */
        osc.onended = () => {
            try {
                vibratoGain.disconnect(osc.detune);
            } catch {
                /* Already torn down by a previous release. */
            }
            osc.disconnect();
            filter.disconnect();
            gain.disconnect();
        };

        osc.start(now);
        chains.push({ osc, filter, gain });
    }

    return chains;
}

function releaseVoices(chains: Voice[] | undefined, ctx: AudioContext, release: number): void {
    if (!chains) return;
    const now = ctx.currentTime;
    for (const { osc, gain } of chains) {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(gain.gain.value, SILENCE), now);
        gain.gain.linearRampToValueAtTime(SILENCE, now + release);
        osc.stop(now + release + STOP_PAD_S);
    }
}
