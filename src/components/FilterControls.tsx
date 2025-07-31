import React from "react";
import { useSynthStore } from "../store/synthStore";
import { useFontStore } from "../store/fontStore";
import styles from "../styles/FilterControls.module.css";
import appStyles from "../App.module.css";


export const FilterControls: React.FC = () => {
    const {
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
        <div className={styles.controls} style={{ fontSize: fontSize }}>
            <h2 className={styles.controlsHeader}>Filter</h2>

            <label>
                <input
                    type="checkbox"
                    checked={filterEnabled}
                    onChange={(e) => setFilterEnabled(e.target.checked)}
                />
                Enable Filter
            </label>

            <label>
                Type:
                <select
                    value={filterType}
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
                    onChange={(e) => setFilterQ(Number(e.target.value))}
                />
            </label>
        </div>
    );
};
