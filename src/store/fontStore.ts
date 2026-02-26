import { create } from "zustand";

interface FontState {
    fontSize: number;
    vw: number;
	octaves: number[];
	layout: "portrait" | "landscape";
    setVw: (vw: number) => void;
    setFontSize: (size: number) => void;
    updateFontSize: () => void;
}

export const useFontStore = create<FontState>((set) => ({
    fontSize: 25,
    vw: 0,
	octaves: [3,4,5],
	layout: "landscape",
    setVw: (vw: number) => set({ vw }),
    setFontSize: (size: number) => set({ fontSize: size }),
	setLayout: (layout: "portrait" | "landscape") => set( {layout}),
    updateFontSize: () => {

        const vw = (window.visualViewport?.width ?? window.innerWidth) / 100;
        const vh = (window.visualViewport?.height ?? window.innerHeight) / 100;

        document.documentElement.style.setProperty("--vh", `${vh}px`);
        document.documentElement.style.setProperty("--vw", `${vw}px`);

		const orientationType = screen.orientation.type;
		if (vh/vw > 1) {
			set({ layout: "portrait"});
		} else {
			set({ layout: "landscape"});
		}


		const product = Math.sqrt(0.5 * vh + 0.5 * vw) * 6.8;
		set({ fontSize: product });
        set({ vw });
		
		let numOctaves = Math.max(1, Math.floor(vw/2.5));
		// Ensure at least 2 octaves in portrait mode
		if (vh/vw > 1) {
			numOctaves = Math.max(2, numOctaves);
		}

		let octs = [];

		// Pattern: even scales (1,2,3) = full octaves only
		//          odd scales (1.5,2.5,3.5) = one half-octave + full octaves
		const isOddScale = numOctaves % 2 === 1;

		if (isOddScale) {
			// Odd scale: start with half-octave, then full octaves
			const numFullOctaves = Math.floor(numOctaves / 2);
			const centerOctave = 4;
			const halfOctaveIdx = centerOctave - numFullOctaves - 0.5;

			octs.push(halfOctaveIdx);
			for (let i = 0; i <= numFullOctaves; i++) {
				octs.push(centerOctave - numFullOctaves + i);
			}
		} else {
			// Even scale: only full octaves
			const numFullOctaves = numOctaves;
			if (numFullOctaves % 2 === 0) {
				// Even number of full octaves
				for (let i = 4.5 - Math.floor(numFullOctaves / 2); i <= 4 + Math.floor(numFullOctaves / 2); i++) {
					octs.push(Math.floor(i + 1));
				}
			} else {
				// Odd number of full octaves
				for (let i = 4 - Math.floor(numFullOctaves / 2); i <= 4 + Math.floor(numFullOctaves / 2); i++) {
					octs.push(i);
				}
			}
		}

		set({ octaves: octs })
    },
}));
