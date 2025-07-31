// components/MainControls.tsx
import { useSynthStore } from "../store/synthStore";
import { useSynthEngine } from "../hooks/useSynthEngine";
import styles from "../styles/MainControls.module.css";

export function MainControls() {
    const { masterVolume, setMasterVolume, midiEnabled, setMidiEnabled } =
        useSynthStore();
    const { clearAllNotes } = useSynthEngine();

    return (
        <div className={styles.mainControls}>

			<h2 className={styles.controlsHeader}>Main</h2>

            <label className={styles.mainVolumeContainer}>
                Main Volume
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={masterVolume}
					className={styles.slider}
                    onChange={(e) =>
                        setMasterVolume(parseFloat(e.target.value))
                    }
                />
            </label>

			<div className={styles.buttonsContainer}>
				<button className={styles.controlsButton} onClick={clearAllNotes}>Clear Notes</button>

				<button className={styles.controlsButton} onClick={() => setMidiEnabled(!midiEnabled)}>
					{midiEnabled ? "Disable MIDI" : "Enable MIDI"}
				</button>
			</div>

        </div>
    );
}
