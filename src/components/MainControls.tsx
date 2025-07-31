// components/MainControls.tsx
import { useSynthStore } from "../store/synthStore";
import { useSynthEngine } from "../hooks/useSynthEngine";
import styles from "../styles/MainControls.module.css";

export function MainControls() {
    const { masterVolume, setMasterVolume } = useSynthStore();
    const { clearAllNotes } = useSynthEngine();

    return (
        <div className={styles.mainControls}>
            <label>
                Master Volume
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={masterVolume}
                    onChange={(e) =>
                        setMasterVolume(parseFloat(e.target.value))
                    }
                />
            </label>
            <button onClick={clearAllNotes}>Clear All Notes</button>
        </div>
    );
}
