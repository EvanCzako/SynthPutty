import { useSynthStore } from "../store/synthStore";
import { useFontStore } from "../store/fontStore";
import styles from "../styles/MainControls.module.css";
import logoImg from "../styles/SynthPuttyLogo.png";

export function MainControls() {
    const { midiEnabled, setMidiEnabled } = useSynthStore();
    const { fontSize } = useFontStore();

    const isMobile =
        typeof navigator !== "undefined" &&
        /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(
            navigator.userAgent,
        );

    return (
        <div className={styles.mainControls} style={{ fontSize }}>
            <a
                href="https://evanczako.github.io/DoughLab2/"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img src={logoImg} className={styles.logo} alt="SynthPutty" />
            </a>

            <div className={styles.buttonsContainer}>
                {!isMobile && (
                    <button
                        className={styles.controlsButton}
                        onClick={() => setMidiEnabled(!midiEnabled)}
                    >
                        {midiEnabled ? "Disable MIDI" : "Enable MIDI"}
                    </button>
                )}
            </div>
        </div>
    );
}
