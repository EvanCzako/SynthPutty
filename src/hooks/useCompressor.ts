import { useEffect } from "react";
import { useSynthStore } from "../store/synthStore";

export function useCompressor(audioCtx: AudioContext, masterGain: GainNode) {
  useEffect(() => {
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -18; // dB
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    masterGain.disconnect();
    masterGain.connect(compressor);
    compressor.connect(audioCtx.destination);

    return () => {
      masterGain.disconnect();
      compressor.disconnect();
    };
  }, [audioCtx, masterGain]);
}
