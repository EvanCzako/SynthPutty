import React from "react";
import { useSynthStore } from "../store/synthStore";
import styles from "../styles/OscillatorControls.module.css";

export const OscillatorControls: React.FC = () => {
    const { waveform, voices, detune, setWaveform, setVoices, setDetune } =
        useSynthStore();

    return (
        <div className={styles.controls}>
            <h2>Oscillator</h2>

            <label>
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

            <label>
                Voices:
                <input
                    type="number"
                    min={1}
                    max={8}
                    value={voices}
                    onChange={(e) => setVoices(Number(e.target.value))}
                />
            </label>

            <label>
                Detune (cents):
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={detune}
                    onChange={(e) => setDetune(Number(e.target.value))}
                />
                <span>{detune}¢</span>
            </label>
        </div>
    );
};
