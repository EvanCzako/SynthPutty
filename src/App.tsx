import React from "react";
import { OscillatorControls } from "./components/OscillatorControls";
import { FilterControls } from "./components/FilterControls";
import { useSynthEngine } from './hooks/useSynthEngine';
import { Keyboard } from './components/Keyboard';
// import { useMIDI } from './hooks/useMIDI';
import styles from "./App.module.css";

export const App: React.FC = () => {
      useSynthEngine();  // audio engine responds to state
    //   useMIDI();         // optional for now — no-op if not implemented yet

    return (
        <div className={styles.app}>
            <h1 className={styles.header}>Dough Synths</h1>

            <div className={styles.panel}>
                <OscillatorControls />
                <FilterControls />
				<Keyboard />
            </div>
        </div>
    );
};
