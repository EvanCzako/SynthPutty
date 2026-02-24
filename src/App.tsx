import React, { useEffect, useState } from "react";
import { SynthControls } from "./components/SynthControls";
import { useSynthEngine } from "./hooks/useSynthEngine";
import { Keyboard } from "./components/Keyboard";
import { MainControls } from "./components/MainControls";
import { EQVisualizer } from "./components/EQVisualizer";
import { useFontStore } from "./store/fontStore";
import { useMIDI } from './hooks/useMidi';

import useDisableZoom from './hooks/useDisableZoom';
import styles from "./App.module.css";

export const App: React.FC = () => {
    useSynthEngine(); // audio engine responds to state
    useMIDI();         // optional for now — no-op if not implemented yet
    useDisableZoom();
    const {
        updateFontSize,
        vw,
        layout
    } = useFontStore();

    useEffect(() => {
        updateFontSize();
        window.addEventListener("resize", updateFontSize);
        return () => window.removeEventListener("resize", updateFontSize);
    }, [updateFontSize, layout, vw]);

    return (
        <div className={styles.app}>
            <div className={styles.panel}>
                {/* Portrait: original layout. Landscape: custom split. */}
                {layout === "landscape" ? (
                    <>
                        <div className={styles.middleRowPanels}>
                            {/* Left column: logo + EQ */}
                            <div className={styles.leftColumn}>
                                <div className={styles.logoMidiPanel}>
                                    <MainControls />
                                </div>
                                <EQVisualizer />
                            </div>
                            {/* Right column: controls */}
                            <div className={styles.rightColumn}>
                                <SynthControls />
                            </div>
                        </div>
                        <div className={styles.pianoPanel}>
                            <Keyboard />
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.logoMidiPanel}>
                            <MainControls />
                        </div>
                        <div className={styles.middleRowPanels}>
                            <EQVisualizer />
                            <SynthControls />
                        </div>
                        <div className={styles.pianoPanel}>
                            <Keyboard />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
