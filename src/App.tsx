import React, { useEffect } from 'react';
import { SynthControls } from './components/SynthControls';
import { Keyboard } from './components/Keyboard';
import { MainControls } from './components/MainControls';
import { EQVisualizer } from './components/EQVisualizer';
import { useSynthEngine } from './hooks/useSynthEngine';
import { useMIDI } from './hooks/useMidi';
import { useAudioGate } from './hooks/useAudioGate';
import useDisableZoom from './hooks/useDisableZoom';
import { useFontStore } from './store/fontStore';
import styles from './App.module.css';

/*
 * The four panels are rendered once, in one order, and CSS decides where they
 * land. There used to be a `layout` field in the store driving two full JSX
 * trees while the stylesheet ALSO branched on `@media (orientation: ...)`; two
 * mechanisms for one decision drift, and the store copy was a frame behind on
 * rotation.
 */
export const App: React.FC = () => {
    useAudioGate();
    useSynthEngine();
    useMIDI();
    useDisableZoom();

    const updateMetrics = useFontStore((s) => s.updateMetrics);

    useEffect(() => {
        updateMetrics();

        /* Coalesced to one measurement per frame: a drag-resize fires resize
         * far faster than React can render the sixty keys it affects. */
        let frame = 0;
        const onResize = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(updateMetrics);
        };

        window.addEventListener('resize', onResize);
        /* On mobile the visual viewport changes without a window resize when
         * the URL bar collapses. */
        window.visualViewport?.addEventListener('resize', onResize);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', onResize);
            window.visualViewport?.removeEventListener('resize', onResize);
        };
    }, [updateMetrics]);

    return (
        <div className={styles.app}>
            <div className={styles.headerPanel}>
                <MainControls />
            </div>
            <div className={styles.eqPanel}>
                <EQVisualizer />
            </div>
            <div className={styles.controlsPanel}>
                <SynthControls />
            </div>
            <div className={styles.pianoPanel}>
                <Keyboard />
            </div>
        </div>
    );
};

export default App;
