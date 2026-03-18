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
  octaves: [3, 4, 5],
  layout: "landscape",
  setVw: (vw: number) => set({ vw }),
  setFontSize: (size: number) => set({ fontSize: size }),
  setLayout: (layout: "portrait" | "landscape") => set({ layout }),
  updateFontSize: () => {
    const vw = (window.visualViewport?.width ?? window.innerWidth) / 100;
    const vh = (window.visualViewport?.height ?? window.innerHeight) / 100;

    document.documentElement.style.setProperty("--vh", `${vh}px`);
    document.documentElement.style.setProperty("--vw", `${vw}px`);

    if (vh / vw > 1) {
      set({ layout: "portrait" });
    } else {
      set({ layout: "landscape" });
    }

    const product = Math.sqrt(0.5 * vh + 0.5 * vw) * 6.8;
    set({ fontSize: product });
    set({ vw });

    const w = window.visualViewport?.width ?? window.innerWidth;
    let octs: number[];

    if (w > 2500) {
      octs = [1, 2, 3, 4, 5, 6];
    } else if (w > 2100) {
      octs = [1.5, 2, 3, 4, 5, 6];
    } else if (w > 1700) {
      octs = [2, 3, 4, 5, 6];
    } else if (w > 1500) {
      octs = [2.5, 3, 4, 5, 6];
    } else if (w > 1300) {
      octs = [3, 4, 5, 6];
    } else if (w > 1100) {
      octs = [2.5, 3, 4, 5];
    } else if (w > 900) {
      octs = [3, 4, 5];
    } else if (w > 700) {
      octs = [3.5, 4, 5];
    } else if (w > 550) {
      octs = [4, 5];
    } else if (w > 360) {
      octs = [3.5, 4];
    } else {
      octs = [4];
    }

    set({ octaves: octs });
  },
}));
