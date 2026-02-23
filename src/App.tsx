import React, { useEffect, useState } from "react";
import { SynthControls } from "./components/SynthControls";
import { useSynthEngine } from "./hooks/useSynthEngine";
import { Keyboard } from "./components/Keyboard";
import { MainControls } from "./components/MainControls";
import { EQVisualizer } from "./components/EQVisualizer";
import { useFontStore } from "./store/fontStore";
import { useMIDI } from './hooks/useMidi';
import styles from "./App.module.css";

export const App: React.FC = () => {
    useSynthEngine(); // audio engine responds to state
    useMIDI();         // optional for now — no-op if not implemented yet

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
                {/* Top: Logo/MIDI panel */}
                <div className={styles.logoMidiPanel}>
                    <MainControls />
                </div>
                {/* Middle: 3 panels in a row (landscape only) */}
                <div className={styles.middleRowPanels}>
                    <EQVisualizer />
                    <SynthControls />
                    {/* MainControls is also at top, so skip here */}
                </div>
                {/* Bottom: Piano panel (Keyboard) */}
                <div className={styles.pianoPanel}>
                    <Keyboard />
                </div>
            </div>
        </div>
    );
};
