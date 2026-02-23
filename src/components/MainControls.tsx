// components/MainControls.tsx
import { useSynthStore } from "../store/synthStore";
import { useFontStore } from "../store/fontStore";
import styles from "../styles/MainControls.module.css";
import logoImg from "../styles/SynthPuttyLogo.png";

export function MainControls() {
    const { 
		midiEnabled, 
		setMidiEnabled, 
	 } =
        useSynthStore();
	const { fontSize } = useFontStore();

    return (
        <div className={styles.mainControls}>
            <a href="https://evanczako.github.io/DoughLab2/" target="_blank" rel="noopener noreferrer">
                <img src={logoImg} className={styles.logo} alt="SynthPutty" />
            </a>

            <div className={styles.buttonsContainer}>
                <button className={styles.controlsButton} onClick={() => setMidiEnabled(!midiEnabled)}>
                    {midiEnabled ? "Disable MIDI" : "Enable MIDI"}
                </button>
            </div>

        </div>
    );
}
