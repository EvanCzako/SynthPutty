import { create } from 'zustand';

/*
 * Viewport-derived metrics: the type scale and how much of the keyboard fits.
 *
 * Orientation deliberately does NOT live here. `@media (orientation: ...)` in
 * App.module.css already decides the layout, and two mechanisms for one
 * decision drift apart.
 */

/* A fractional octave means "the upper half of that octave", i.e. F..B --
 * 3.5 renders F3 G3 A3 B3. See whiteKeysHalf in Keyboard.tsx. */
type Octave = number;

/*
 * Widest-first ladder of how many octaves to show. Must stay monotonic:
 * widening the window may never remove keys. The thresholds work out to
 * roughly 340px of width per octave, which is about the narrowest a white key
 * can get and still be hittable with a thumb.
 */
const OCTAVE_LADDER: readonly { minWidth: number; octaves: readonly Octave[] }[] = [
    { minWidth: 2400, octaves: [1, 2, 3, 4, 5, 6] },
    { minWidth: 2100, octaves: [1.5, 2, 3, 4, 5, 6] },
    { minWidth: 1800, octaves: [2, 3, 4, 5, 6] },
    { minWidth: 1550, octaves: [2.5, 3, 4, 5, 6] },
    { minWidth: 1300, octaves: [3, 4, 5, 6] },
    { minWidth: 1100, octaves: [3.5, 4, 5, 6] },
    { minWidth: 900, octaves: [3, 4, 5] },
    { minWidth: 720, octaves: [3.5, 4, 5] },
    { minWidth: 550, octaves: [4, 5] },
    { minWidth: 400, octaves: [4.5, 5] },
    { minWidth: 0, octaves: [4] },
];

interface FontState {
    fontSize: number;
    octaves: readonly Octave[];
    updateMetrics: () => void;
}

function octavesFor(width: number): readonly Octave[] {
    return (OCTAVE_LADDER.find((step) => width > step.minWidth) ?? OCTAVE_LADDER[0]).octaves;
}

export const useFontStore = create<FontState>((set, get) => ({
    fontSize: 25,
    octaves: [3, 4, 5],

    updateMetrics: () => {
        /* visualViewport reflects the area actually visible on mobile once the
         * URL bar and any on-screen keyboard are accounted for. */
        const width = window.visualViewport?.width ?? window.innerWidth;
        const height = window.visualViewport?.height ?? window.innerHeight;

        /* Geometric-ish mean of the two axes: scales type with the smaller
         * dimension without collapsing on very wide, short windows. */
        const fontSize = Math.sqrt(0.5 * (height / 100) + 0.5 * (width / 100)) * 6.8;
        const octaves = octavesFor(width);

        /* CSS reads this for controls that must track the type scale but are
         * not inside a component that sets font-size inline. */
        document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);

        /* Reuse the previous array when the ladder step has not changed, so a
         * resize that only nudges the font size does not re-render the 60-odd
         * keys of the piano. One set() call, so one render. */
        const previous = get().octaves;
        set({ fontSize, octaves: octaves === previous ? previous : octaves });
    },
}));
