import React from "react";
import { useSynthStore } from "../store/synthStore";
import { useFontStore } from "../store/fontStore";
import oscStyles from "../styles/OscillatorControls.module.css";
import filterStyles from "../styles/FilterControls.module.css";
import appStyles from "../App.module.css";

export const SynthControls: React.FC = () => {
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
        filterType,
        filterCutoff,
        setFilterType,
        setFilterCutoff,
        filterEnabled,
        setFilterEnabled,
        filterQ,
        setFilterQ,
    } = useSynthStore();

    const { fontSize } = useFontStore();

    return (
        <div className={oscStyles.controls} style={{ fontSize: fontSize }}>
            {/* Oscillator Controls */}
            <label className={appStyles.controlsSliderContainer}>
                Waveform:
                <select
                    value={waveform}
                    onChange={(e) => setWaveform(e.target.value as any)}
                    className={oscStyles.comboBox}
                >
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="triangle">Triangle</option>
                    <option value="sawtooth">Sawtooth</option>
                </select>
            </label>

            <label className={appStyles.controlsSliderContainer}>
                Voices: {voices}
                <input
                    type="range"
                    min={1}
                    max={8}
                    value={voices}
                    onChange={(e) => setVoices(Number(e.target.value))}
                    className={oscStyles.slider}
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
                    className={oscStyles.slider}
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
                    className={oscStyles.slider}
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
                    className={oscStyles.slider}
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
                    className={oscStyles.slider}
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
                    className={oscStyles.slider}
                    onChange={(e) => setRelease(parseFloat(e.target.value))}
                />
            </label>

            {/* Filter Controls */}
            <label className={appStyles.controlsSliderContainer}>
                Enable Filter
                <input
                    type="checkbox"
                    checked={filterEnabled}
                    onChange={(e) => setFilterEnabled(e.target.checked)}
                    className={filterStyles.checkBox}
                />
            </label>

            <label className={appStyles.controlsSliderContainer}>
                Type:
                <select
                    value={filterType}
                    className={filterStyles.comboBox}
                    onChange={(e) =>
                        setFilterType(
                            e.target.value as
                                | "lowpass"
                                | "bandpass"
                                | "highpass",
                        )
                    }
                >
                    <option value="lowpass">Lowpass</option>
                    <option value="bandpass">Bandpass</option>
                    <option value="highpass">Highpass</option>
                </select>
            </label>

            <label className={appStyles.controlsSliderContainer}>
                Cutoff (Hz): {filterCutoff}
                <input
                    type="range"
                    min={100}
                    max={10000}
                    step={1}
                    value={filterCutoff}
                    className={filterStyles.slider}
                    onChange={(e) => setFilterCutoff(Number(e.target.value))}
                />
            </label>

            <label className={appStyles.controlsSliderContainer}>
                Resonance: {filterQ.toFixed(1)}
                <input
                    type="range"
                    min={0.1}
                    max={20}
                    step={0.1}
                    value={filterQ}
                    className={filterStyles.slider}
                    onChange={(e) => setFilterQ(Number(e.target.value))}
                />
            </label>
        </div>
    );
};
