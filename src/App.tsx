import React, { useEffect, useState } from "react";
import { OscillatorControls } from "./components/OscillatorControls";
import { FilterControls } from "./components/FilterControls";
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

	const [titleStackReverse, setTitleStackReverse] = React.useState(false);

    useEffect(() => {
        updateFontSize();
		console.log(vw);
		console.log(layout);
		if (layout === "portrait" && vw <= 6){
			setTitleStackReverse(false);
		} else {
			setTitleStackReverse(true);
		}
		console.log(titleStackReverse);
        window.addEventListener("resize", updateFontSize);
        return () => window.removeEventListener("resize", updateFontSize);
    }, [updateFontSize, layout, vw]);

    return (
        <div className={styles.app}>


            <div className={styles.panel}>
				<div className={styles.allControlPanels}>

					{ titleStackReverse ? 
						<div className={styles.topPanelsContainer}>
							<MainControls />
							<div className={styles.titleContainer}>
								<h1 className={styles.header}>Dough Synths</h1>
								<a href="">More by Evan Czako HERE</a>
							</div>
						</div>
										:
						<div className={styles.topPanelsContainer}>
							<div className={styles.titleContainer}>
								<h1 className={styles.header}>Dough awefawea</h1>
								<a href="">More by Evan Czako HERE</a>
							</div>
							<MainControls />
						</div>
				}

					<div className={styles.pianoEQwrapper}>
						<EQVisualizer />
						<Keyboard />
					</div>

					<div className={styles.mainControlPanel}>
						<OscillatorControls />
						<FilterControls />
					</div>
				</div>



            </div>
        </div>
    );
};
