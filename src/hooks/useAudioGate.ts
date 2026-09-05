import { useEffect } from 'react';
import { ensureAudio } from '../audio/engine';
import { useSynthStore } from '../store/synthStore';

/*
 * Creates the AudioContext on the first user gesture.
 *
 * The listeners are capture-phase and on `document`, so they run before any
 * component's own handler -- by the time a key's pointerdown fires, the graph
 * exists and the note can start immediately. This is the only place the
 * context is constructed, which is what keeps "resume inside the gesture" a
 * property of the app rather than a rule each call site has to remember.
 */
export function useAudioGate() {
    const setAudioReady = useSynthStore((s) => s.setAudioReady);

    useEffect(() => {
        const start = () => {
            ensureAudio();
            setAudioReady(true);
        };

        /* Kept subscribed rather than once-only: a context can be suspended
         * again when a mobile tab is backgrounded, and ensureAudio() resumes
         * it. The work after the first call is a state check. */
        const options = { capture: true, passive: true } as const;
        document.addEventListener('pointerdown', start, options);
        document.addEventListener('keydown', start, options);
        return () => {
            document.removeEventListener('pointerdown', start, options);
            document.removeEventListener('keydown', start, options);
        };
    }, [setAudioReady]);
}
