import { useSynthStore } from '../store/synthStore';
import { isMidiSupported } from '../hooks/useMidi';
import ThemeSwitcher from './ThemeSwitcher';
import styles from '../styles/MainControls.module.css';
import logoImg from '../styles/SynthPuttyLogo-downSaturated.png';

export function MainControls() {
    const midiEnabled = useSynthStore((s) => s.midiEnabled);
    const setMidiEnabled = useSynthStore((s) => s.setMidiEnabled);
    const midiError = useSynthStore((s) => s.midiError);
    const audioReady = useSynthStore((s) => s.audioReady);
    const heldNotes = useSynthStore((s) => Object.keys(s.activeNotes).length);
    const panic = useSynthStore((s) => s.panic);

    /* Feature-detected rather than sniffed from the user agent: the old check
     * hid the button on every iPad, including ones with a USB controller
     * attached, and showed it in desktop browsers with no Web MIDI at all. */
    const midiAvailable = isMidiSupported();

    return (
        <header className={styles.mainControls}>
            <img src={logoImg} className={styles.logo} alt="" />

            <a href="https://evanczako.com" rel="noopener noreferrer" className={styles.backLink}>
                Back to Bakery
            </a>

            {/* Only the error is a live region. Announcing the note counter
                would make a screen reader read out every key press. */}
            {midiError ? (
                <p className={`${styles.status} ${styles.statusError}`} role="alert">
                    {midiError}
                </p>
            ) : (
                <p className={styles.status}>
                    {audioReady
                        ? `${heldNotes} note${heldNotes === 1 ? '' : 's'} held`
                        : 'Press a key to start audio'}
                </p>
            )}

            <div className={styles.buttons}>
                <button
                    type="button"
                    className={styles.button}
                    onClick={panic}
                    disabled={heldNotes === 0}
                    title="Release every sounding note"
                >
                    All notes off
                </button>

                {midiAvailable && (
                    <button
                        type="button"
                        className={styles.button}
                        aria-pressed={midiEnabled}
                        onClick={() => setMidiEnabled(!midiEnabled)}
                    >
                        {midiEnabled ? 'Disable MIDI' : 'Enable MIDI'}
                    </button>
                )}

                <ThemeSwitcher />
            </div>
        </header>
    );
}

export default MainControls;
