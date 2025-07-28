import { create } from "zustand";

interface FontState {
    fontSize: number;
    vw: number;
	octaves: number[];
    setVw: (vw: number) => void;
    setFontSize: (size: number) => void;
    updateFontSize: () => void;
}

export const useFontStore = create<FontState>((set) => ({
    fontSize: 25,
    vw: 0,
	octaves: [3,4,5],
    setVw: (vw: number) => set({ vw }),
    setFontSize: (size: number) => set({ fontSize: size }),
    updateFontSize: () => {
        const vw = (window.visualViewport?.width ?? window.innerWidth) / 100;
        const vh = (window.visualViewport?.height ?? window.innerHeight) / 100;

        document.documentElement.style.setProperty("--vh", `${vh}px`);
        document.documentElement.style.setProperty("--vw", `${vw}px`);

        const product = Math.sqrt(0.5 * vh + 0.5 * vw) * 7;
        set({ fontSize: product });
        set({ vw });
		
		const numOctaves = Math.max(1, Math.floor(vw/5));
		let octs = [];
		if (numOctaves%2 === 0){
			Math.floor(numOctaves/2);
			for(let i = 4.5 - Math.floor(numOctaves/2); i <= 4 + Math.floor(numOctaves/2); i++){
				octs.push(Math.floor(i + 1));
			}
		} else {
			Math.floor(numOctaves/2);
			for(let i = 4 - Math.floor(numOctaves/2); i <= 4 + Math.floor(numOctaves/2); i++){
				octs.push(i);
			}
		}

		set({ octaves: octs })
    },
}));
