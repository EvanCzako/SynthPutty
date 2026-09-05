import React, { useId } from 'react';
import { useSynthStore, type FilterType, type WaveformType } from '../store/synthStore';
import { PRESETS } from '../presets';
import styles from '../styles/SynthControls.module.css';

const WAVEFORMS: readonly WaveformType[] = ['sine', 'square', 'triangle', 'sawtooth'];
const FILTER_TYPES: readonly FilterType[] = ['lowpass', 'bandpass', 'highpass'];

function capitalise(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function nextIn<T>(list: readonly T[], current: T): T {
    return list[(list.indexOf(current) + 1) % list.length];
}

/*
 * A labelled row. The label is a real <label htmlFor>, and the current value is
 * rendered next to it: a bare slider with no readout gives no way to tell 20%
 * resonance from 30%, or to reproduce a sound you liked.
 */
type SliderProps = {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format: (value: number) => string;
    onChange: (value: number) => void;
};

function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
    const id = useId();
    return (
        <div className={styles.control}>
            <label className={styles.controlLabel} htmlFor={id}>
                {label}
            </label>
            <input
                id={id}
                type="range"
                className={styles.slider}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
            <output className={styles.readout} htmlFor={id}>
                {format(value)}
            </output>
        </div>
    );
}

/* A control whose value is cycled by pressing it. The <label> points at the
 * button so the pairing is announced, and the button's own text is the value. */
function CycleControl({
    label,
    value,
    onClick,
}: {
    label: string;
    value: string;
    onClick: () => void;
}) {
    const id = useId();
    return (
        <div className={styles.control}>
            <label className={styles.controlLabel} htmlFor={id}>
                {label}
            </label>
            <button id={id} type="button" className={styles.cycleButton} onClick={onClick}>
                {value}
            </button>
        </div>
    );
}

const hz = (value: number) =>
    value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}`;
const seconds = (value: number) => `${value.toFixed(2)}s`;

export const SynthControls: React.FC = () => {
    const waveform = useSynthStore((s) => s.waveform);
    const voices = useSynthStore((s) => s.voices);
    const detune = useSynthStore((s) => s.detune);
    const vibratoRate = useSynthStore((s) => s.vibratoRate);
    const vibratoDepth = useSynthStore((s) => s.vibratoDepth);
    const attack = useSynthStore((s) => s.attack);
    const release = useSynthStore((s) => s.release);
    const filterType = useSynthStore((s) => s.filterType);
    const filterCutoff = useSynthStore((s) => s.filterCutoff);
    const filterQ = useSynthStore((s) => s.filterQ);
    const filterEnabled = useSynthStore((s) => s.filterEnabled);
    const masterVolume = useSynthStore((s) => s.masterVolume);
    const presetIndex = useSynthStore((s) => s.presetIndex);

    const setWaveform = useSynthStore((s) => s.setWaveform);
    const setVoices = useSynthStore((s) => s.setVoices);
    const setDetune = useSynthStore((s) => s.setDetune);
    const setVibratoRate = useSynthStore((s) => s.setVibratoRate);
    const setVibratoDepth = useSynthStore((s) => s.setVibratoDepth);
    const setAttack = useSynthStore((s) => s.setAttack);
    const setRelease = useSynthStore((s) => s.setRelease);
    const setFilterType = useSynthStore((s) => s.setFilterType);
    const setFilterCutoff = useSynthStore((s) => s.setFilterCutoff);
    const setFilterQ = useSynthStore((s) => s.setFilterQ);
    const setFilterEnabled = useSynthStore((s) => s.setFilterEnabled);
    const setMasterVolume = useSynthStore((s) => s.setMasterVolume);
    const cyclePreset = useSynthStore((s) => s.cyclePreset);

    return (
        /* Type scale comes from --base-font-size, which fontStore writes on
           <html>; an inline font-size here would be a second mechanism for the
           same decision. */
        <div className={styles.controlsContainer}>
            <section className={styles.column} aria-label="Oscillator">
                <h2 className={styles.columnHeading}>Oscillator</h2>

                <CycleControl
                    label="Wave"
                    value={capitalise(waveform)}
                    onClick={() => setWaveform(nextIn(WAVEFORMS, waveform))}
                />
                <Slider
                    label="Voices"
                    value={voices}
                    min={1}
                    max={8}
                    step={1}
                    format={String}
                    onChange={setVoices}
                />
                <Slider
                    label="Detune"
                    value={detune}
                    min={0}
                    max={100}
                    step={1}
                    format={(v) => `${v}¢`}
                    onChange={setDetune}
                />
                <Slider
                    label="Vib rate"
                    value={vibratoRate}
                    min={0}
                    max={20}
                    step={0.1}
                    format={(v) => `${v.toFixed(1)}Hz`}
                    onChange={setVibratoRate}
                />
                <Slider
                    label="Vib depth"
                    value={vibratoDepth}
                    min={0}
                    max={100}
                    step={1}
                    format={(v) => `${v}¢`}
                    onChange={setVibratoDepth}
                />
                <Slider
                    label="Attack"
                    value={attack}
                    min={0}
                    max={1}
                    step={0.01}
                    format={seconds}
                    onChange={setAttack}
                />
                <Slider
                    label="Release"
                    value={release}
                    min={0}
                    max={1}
                    step={0.01}
                    format={seconds}
                    onChange={setRelease}
                />
            </section>

            <section className={styles.column} aria-label="Filter and output">
                <h2 className={styles.columnHeading}>Filter</h2>

                <Slider
                    label="Volume"
                    value={masterVolume}
                    min={0}
                    max={1}
                    step={0.01}
                    format={(v) => `${Math.round(v * 100)}%`}
                    onChange={setMasterVolume}
                />
                <CycleControl
                    label="Preset"
                    value={PRESETS[presetIndex].name}
                    onClick={cyclePreset}
                />

                <div className={styles.control}>
                    <span className={styles.controlLabel} id="filter-toggle-label">
                        Filter
                    </span>
                    {/* A checkbox announces its own state; aria-pressed on a
                        button only imitates it. */}
                    <label className={styles.switch}>
                        <input
                            type="checkbox"
                            className={styles.switchInput}
                            checked={filterEnabled}
                            aria-labelledby="filter-toggle-label"
                            onChange={(e) => setFilterEnabled(e.target.checked)}
                        />
                        <span className={styles.switchTrack} aria-hidden="true">
                            <span className={styles.switchKnob} />
                        </span>
                        <span className={styles.switchText}>{filterEnabled ? 'On' : 'Off'}</span>
                    </label>
                </div>

                <CycleControl
                    label="Type"
                    value={capitalise(filterType)}
                    onClick={() => setFilterType(nextIn(FILTER_TYPES, filterType))}
                />
                <Slider
                    label="Cutoff"
                    value={filterCutoff}
                    min={100}
                    max={10000}
                    step={1}
                    format={(v) => `${hz(v)}Hz`}
                    onChange={setFilterCutoff}
                />
                <Slider
                    label="Res"
                    value={filterQ}
                    min={0.1}
                    max={20}
                    step={0.1}
                    format={(v) => v.toFixed(1)}
                    onChange={setFilterQ}
                />
            </section>
        </div>
    );
};

export default SynthControls;
