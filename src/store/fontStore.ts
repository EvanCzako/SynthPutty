import { create } from 'zustand';

interface FontState {
    fontSize: number;
	vw: number;
	setVw: (vw: number) => void;
    setFontSize: (size: number) => void;
	updateFontSize: () => void;
}

export const useFontStore = create<FontState>(set => ({
    fontSize: 25,
	vw: 0,
	setVw: (vw: number) => set({ vw }),
    setFontSize: (size: number) => set({ fontSize: size }),
	updateFontSize: () => {
		const vw = (window.visualViewport?.width ?? window.innerWidth) / 100;
        const vh = (window.visualViewport?.height ?? window.innerHeight) / 100;

        document.documentElement.style.setProperty('--vh', `${vh}px`);
        document.documentElement.style.setProperty('--vw', `${vw}px`);

		const product = Math.sqrt((0.5*vh + 0.5*vw))*7;
		set({fontSize: product});
		set({ vw });
	}
}));