import React from "react";
import { useSynthStore } from "../store/synthStore";
import { useFontStore } from "../store/fontStore";
import styles from "../styles/FilterControls.module.css";

export const FilterControls: React.FC = () => {
    const {
        filterType,
        filterCutoff,
        setFilterType,
        setFilterCutoff,
        filterEnabled,
        setFilterEnabled,
		filterQ,
		setFilterQ
    } = useSynthStore();

	const {
		fontSize
	} = useFontStore();

    return (
        <div className={styles.controls} style={{fontSize: fontSize}}>
            <h2>Filter</h2>

            <label>
                Type:
                <select
                    value={filterType}
                    onChange={(e) =>
                        setFilterType(e.target.value as "lowpass" | "bandpass" | "highpass")
                    }
                >
                    <option value="lowpass">Lowpass</option>
					<option value="bandpass">Bandpass</option>
                    <option value="highpass">Highpass</option>
                </select>
            </label>

            <label>
                Cutoff (Hz):
                <input
                    type="range"
                    min={100}
                    max={10000}
                    step={1}
                    value={filterCutoff}
                    onChange={(e) => setFilterCutoff(Number(e.target.value))}
                />
                <span>{filterCutoff} Hz</span>
            </label>

            <label>
                Resonance (Q):
                <input
                    type="range"
                    min={0.1}
                    max={20}
                    step={0.1}
                    value={filterQ}
                    onChange={(e) => setFilterQ(Number(e.target.value))}
                />
                <span>{filterQ.toFixed(1)}</span>
            </label>

            <label>
                <input
                    type="checkbox"
                    checked={filterEnabled}
                    onChange={(e) => setFilterEnabled(e.target.checked)}
                />
                Enable Filter
            </label>
        </div>
    );
};
