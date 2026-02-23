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
				<div className={styles.allControlPanels}>
					<EQVisualizer />

					<div className={styles.topPanelsContainer}>
						<MainControls />
					</div>
				</div>

				<div className={styles.controlsAndKeyboardWrapper}>
                    <SynthControls />
                    <Keyboard />
                </div>
            </div>
        </div>
    );
};
