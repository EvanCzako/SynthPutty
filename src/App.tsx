import React, { useEffect } from "react";
import { OscillatorControls } from "./components/OscillatorControls";
import { FilterControls } from "./components/FilterControls";
import { useSynthEngine } from "./hooks/useSynthEngine";
import { Keyboard } from "./components/Keyboard";
import { MainControls } from "./components/MainControls";
import { EQVisualizer } from "./components/EQVisualizer";
import { useFontStore } from "./store/fontStore";
// import { useMIDI } from './hooks/useMIDI';
import styles from "./App.module.css";

export const App: React.FC = () => {
    useSynthEngine(); // audio engine responds to state
    //   useMIDI();         // optional for now — no-op if not implemented yet

    const updateFontSize = useFontStore((s) => s.updateFontSize);

    useEffect(() => {
        updateFontSize();
        window.addEventListener("resize", updateFontSize);
        return () => window.removeEventListener("resize", updateFontSize);
    }, [updateFontSize]);

    return (
        <div className={styles.app}>
            <h1 className={styles.header}>Dough Synths</h1>

            <div className={styles.panel}>
                <MainControls />
                <div className={styles.mainControlPanel}>
                    <OscillatorControls />
                    <FilterControls />
                </div>

                <EQVisualizer />
                <Keyboard />
            </div>
        </div>
    );
};
