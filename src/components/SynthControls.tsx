import React, { useState } from "react";
import { useSynthStore } from "../store/synthStore";
import { useFontStore } from "../store/fontStore";
import styles from "../styles/SynthControls.module.css";
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
        masterVolume,
        setMasterVolume,
    } = useSynthStore();

    const { fontSize } = useFontStore();
    const [currentPresetIndex, setCurrentPresetIndex] = useState(1);
    React.useEffect(() => {
        presets[1].set();
    }, []);

    const waveforms = ["sine", "square", "triangle", "sawtooth"];
    const filterTypes = ["lowpass", "bandpass", "highpass"];

    const presets = [
        {
            name: "Default",
            set: () => {
                setWaveform("sine");
                setFilterEnabled(false);
                setVoices(1);
                setDetune(0);
                setVibratoDepth(0);
                setVibratoRate(0);
                setFilterCutoff(1200);
            }
        },
        {
            name: "Preset 1",
            set: () => {
                setWaveform("sawtooth");
                setFilterEnabled(true);
                setVoices(3);
                setDetune(20);
                setVibratoDepth(15);
                setVibratoRate(5);
                setFilterCutoff(1200);
            }
        },
        {
            name: "Preset 2",
            set: () => {
                setWaveform("square");
                setFilterEnabled(true);
                setVoices(3);
                setDetune(20);
                setVibratoDepth(15);
                setVibratoRate(5);
                setFilterCutoff(5050); // Halfway up (range 100-10000)
            }
        },
        {
            name: "Preset 3",
            set: () => {
                setWaveform("sine");
                setFilterEnabled(false);
                setVoices(1);
                setDetune(0);
                setVibratoDepth(34);
                setVibratoRate(5);
            }
        }
    ];

    const cycleWaveform = () => {
        const currentIndex = waveforms.indexOf(waveform);
        const nextIndex = (currentIndex + 1) % waveforms.length;
        setWaveform(waveforms[nextIndex] as any);
    };

    const cycleFilterType = () => {
        const currentIndex = filterTypes.indexOf(filterType);
        const nextIndex = (currentIndex + 1) % filterTypes.length;
        setFilterType(
            filterTypes[nextIndex] as "lowpass" | "bandpass" | "highpass"
        );
    };

    const handleCyclePreset = () => {
        const nextIndex = (currentPresetIndex + 1) % presets.length;
        setCurrentPresetIndex(nextIndex);
        presets[nextIndex].set();
    }

    return (
        <div className={styles.controlsContainer} style={{ fontSize: fontSize }}>
            {/* Oscillator and Filter Controls Wrapper */}
            <div className={styles.oscFilterWrapper}>
                {/* Oscillator Controls - Left Column */}
                <div className={styles.oscColumn}>
                <div className={styles.controlLabel}>
                    <label>Wave</label>
                    <button
                        className={styles.cycleButton}
                        onClick={cycleWaveform}
                    >
                        {waveform.charAt(0).toUpperCase() + waveform.slice(1)}
                    </button>
                </div>

                <div className={styles.controlLabel}>
                    <label>Voices</label>
                    <input
                        type="range"
                        min={1}
                        max={8}
                        value={voices}
                        onChange={(e) => setVoices(Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>

                <div className={styles.controlLabel}>
                    <label>Detune</label>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={detune}
                        onChange={(e) => setDetune(Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>

                <div className={styles.controlLabel}>
                    <label>Vib Rate</label>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.1"
                        value={vibratoRate}
                        onChange={(e) => setVibratoRate(parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                </div>

                <div className={styles.controlLabel}>
                    <label>Vib Depth</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={vibratoDepth}
                        className={styles.slider}
                        onChange={(e) =>
                            setVibratoDepth(parseFloat(e.target.value))
                        }
                    />
                </div>

                <div className={styles.controlLabel}>
                    <label>Attack</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={attack}
                        className={styles.slider}
                        onChange={(e) => setAttack(parseFloat(e.target.value))}
                    />
                </div>

                <div className={styles.controlLabel}>
                    <label>Release</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={release}
                        className={styles.slider}
                        onChange={(e) => setRelease(parseFloat(e.target.value))}
                    />
                </div>
            </div>

            {/* Filter Controls - Right Column */}
            <div className={styles.filterColumn}>
                <div className={styles.controlLabel}>
                    <label>Volume</label>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={masterVolume}
                        className={styles.slider}
                        onChange={(e) => setMasterVolume(Number(e.target.value))}
                    />
                </div>

                <div className={styles.controlLabel}>
                    <label>Preset</label>
                    <button className={styles.presetButton} onClick={handleCyclePreset}>
                        {presets[currentPresetIndex].name}
                    </button>
                </div>

                <div className={styles.controlLabel}>
                    <label>Filter</label>
                    <button
                        className={styles.toggleButton}
                        onClick={() => setFilterEnabled(!filterEnabled)}
                    >
                        {filterEnabled ? "On" : "Off"}
                    </button>
                </div>

                <div className={styles.controlLabel}>
                    <label>Type</label>
                    <button
                        className={styles.cycleButton}
                        onClick={cycleFilterType}
                    >
                        {filterType.charAt(0).toUpperCase() +
                            filterType.slice(1)}
                    </button>
                </div>

                <div className={styles.controlLabel}>
                    <label>Cutoff</label>
                    <input
                        type="range"
                        min={100}
                        max={10000}
                        step={1}
                        value={filterCutoff}
                        className={styles.slider}
                        onChange={(e) => setFilterCutoff(Number(e.target.value))}
                    />
                </div>

                <div className={styles.controlLabel}>
                    <label>Res</label>
                    <input
                        type="range"
                        min={0.1}
                        max={20}
                        step={0.1}
                        value={filterQ}
                        className={styles.slider}
                        onChange={(e) => setFilterQ(Number(e.target.value))}
                    />
                </div>
            </div>
            </div>
        </div>
    );
};
