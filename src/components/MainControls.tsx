// components/MainControls.tsx
import { useSynthStore } from "../store/synthStore";
import { useFontStore } from "../store/fontStore";
import { useSynthEngine } from "../hooks/useSynthEngine";
import styles from "../styles/MainControls.module.css";
import appStyles from "../App.module.css";

export function MainControls() {
    const { 
		masterVolume, 
		setMasterVolume, 
		midiEnabled, 
		setMidiEnabled, 
		setFilterEnabled,
		setVoices,
		setDetune,
		setVibratoDepth,
		setVibratoRate,
		setAttack,
		setRelease,
		setFilterCutoff,
		setWaveform
	 } =
        useSynthStore();
	const { fontSize } = useFontStore();
    const { clearAllNotes } = useSynthEngine();

	const handleSetPreset = (preset: string) => {
		switch (preset) {
			case "preset1":
				setWaveform("sawtooth");
				setFilterEnabled(true);
				setVoices(3);
				setDetune(20);
				setVibratoDepth(15);
				setVibratoRate(5);
				setFilterCutoff(1200);
				break;
			case "preset2":
				setWaveform("square");
				setFilterEnabled(true);
				setVoices(3);
				setDetune(20);
				setVibratoDepth(15);
				setVibratoRate(5);
				setFilterCutoff(1200);
				break;
			case "preset3":
				setWaveform("sine");
				setFilterEnabled(false);
				setVoices(1);
				setDetune(0);
				setVibratoDepth(34);
				setVibratoRate(5);
				break;
			default:
				setWaveform("sawtooth");
				setFilterEnabled(false);
				setVoices(1);
				setDetune(0);
				setVibratoDepth(0);
				setVibratoRate(0);
				setFilterCutoff(1200);
				break;
		}
	}

    return (
        <div className={styles.mainControls}>

            <label className={styles.mainVolumeContainer} style={{ fontSize: fontSize*1.3 }}>
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

            <label className={appStyles.controlsSliderContainer} style={{ fontSize: fontSize*1.3 }}>
                Preset:
                <select
					className={styles.comboBox}
					onChange={(e) => {
						handleSetPreset(e.target.value);
					}}
                >
                    <option value="none">None</option>
                    <option value="preset1">Preset 1</option>
                    <option value="preset2">Preset 2</option>
                    <option value="preset3">Preset 3</option>
                </select>
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
