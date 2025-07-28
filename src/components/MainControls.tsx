import { useSynthEngine } from "../hooks/useSynthEngine";

export function MainControls() {
    const { clearAllNotes } = useSynthEngine();

    return (
        <button onClick={clearAllNotes}>
            Clear All
        </button>
    );
}
