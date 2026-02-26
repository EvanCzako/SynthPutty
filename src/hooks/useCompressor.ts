import { useEffect } from "react";

export function useCompressor(
    audioCtx: AudioContext,
    masterGain: GainNode,
    analyser?: AnalyserNode,
) {
    useEffect(() => {
        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -18; // dB
        compressor.knee.value = 18;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        masterGain.disconnect();
        masterGain.connect(compressor);
        if (analyser) {
            compressor.connect(analyser);
            analyser.connect(audioCtx.destination);
        } else {
            compressor.connect(audioCtx.destination);
        }

        return () => {
            masterGain.disconnect();
            compressor.disconnect();
            if (analyser) analyser.disconnect();
        };
    }, [audioCtx, masterGain, analyser]);
}
