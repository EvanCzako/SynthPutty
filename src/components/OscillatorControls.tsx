import React from "react";
import { useSynthStore } from "../store/synthStore";
import { useFontStore } from "../store/fontStore";
import styles from "../styles/OscillatorControls.module.css";
import appStyles from "../App.module.css";

export const OscillatorControls: React.FC = () => {
    const {
        waveform,
        voices,
        detune,
        setWaveform,
        setVoices,
        setDetune,
        vibratoRate,
        setVibratoRate,
        vibratoDepth,
        setVibratoDepth,
        attack,
        setAttack,
        release,
        setRelease,
    } = useSynthStore();

    const { fontSize } = useFontStore();

    return (
        <div className={styles.controls} style={{ fontSize: fontSize }}>
            
			<h2 className={styles.controlsHeader}>Oscillator</h2>

            <label className={appStyles.controlsSliderContainer}>
                Waveform:
                <select
                    value={waveform}
                    onChange={(e) => setWaveform(e.target.value as any)}
                >
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                    <option value="sawtooth">Sawtooth</option>
                </select>
            </label>

            <label className={appStyles.controlsSliderContainer}>
                Voices:
                <input
                    type="number"
                    min={1}
                    max={8}
                    value={voices}
                    onChange={(e) => setVoices(Number(e.target.value))}
                />
            </label>

            <label className={appStyles.controlsSliderContainer}>
                Detune (¢): {detune}
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={detune}
                    onChange={(e) => setDetune(Number(e.target.value))}
                />
            </label>

            <label className={appStyles.controlsSliderContainer}>
                Vibrato Rate (Hz): {vibratoRate.toFixed(1)}
                <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.1"
                    value={vibratoRate}
                    onChange={(e) => setVibratoRate(parseFloat(e.target.value))}
                />
            </label>

            <label className={appStyles.controlsSliderContainer}>
                Vibrato Depth (¢): {vibratoDepth.toFixed(0)}
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={vibratoDepth}
                    onChange={(e) =>
                        setVibratoDepth(parseFloat(e.target.value))
                    }
                />
            </label>

            <label className={appStyles.controlsSliderContainer}>
                Attack (sec): {attack}
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={attack}
                    onChange={(e) => setAttack(parseFloat(e.target.value))}
                />
            </label>

            <label className={appStyles.controlsSliderContainer}>
                Release (sec): {release}
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={release}
                    onChange={(e) => setRelease(parseFloat(e.target.value))}
                />
            </label>
        </div>
    );
};
