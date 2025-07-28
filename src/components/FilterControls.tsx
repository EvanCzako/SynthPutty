import React from "react";
import { useSynthStore } from "../store/synthStore";
import styles from "../styles/FilterControls.module.css";

export const FilterControls: React.FC = () => {
    const {
        filterType,
        filterCutoff,
        setFilterType,
        setFilterCutoff,
        filterEnabled,
        setFilterEnabled,
    } = useSynthStore();

    return (
        <div className={styles.controls}>
            <h2>Filter</h2>

            <label>
                Type:
                <select
                    value={filterType}
                    onChange={(e) =>
                        setFilterType(e.target.value as "lowpass" | "highpass")
                    }
                >
                    <option value="lowpass">Lowpass</option>
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
