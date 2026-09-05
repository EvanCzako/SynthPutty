import { useEffect, useRef, useState } from 'react';
import { getAudio, onAudioReady } from '../audio/engine';
import styles from '../styles/EQVisualizer.module.css';

/* The visible range of a log frequency axis. Below 20Hz there is nothing to
 * see and above 20kHz nothing to hear. */
const MIN_FREQ = 20;
const MAX_FREQ = 20000;

/* Room reserved inside the canvas for the axis and its labels. */
const PAD_X = 32;
const AXIS_BOTTOM = 24;
const TRACE_TOP = 16;

const TICK_COUNT = 10;

/* Anything below this byte value across the whole spectrum counts as silence,
 * and a silent frame is only drawn once. */
const SILENCE_LEVEL = 1;

function freqToX(freq: number, width: number): number {
    const t =
        (Math.log10(freq) - Math.log10(MIN_FREQ)) / (Math.log10(MAX_FREQ) - Math.log10(MIN_FREQ));
    return PAD_X + t * (width - PAD_X * 2);
}

function tickLabel(freq: number): string {
    return freq < 1000 ? `${Math.round(freq / 10) * 10}` : `${(freq / 1000).toFixed(1)}k`;
}

/*
 * Real-time spectrum.
 *
 * Canvas cannot reference a custom property, so the theme colours are read
 * from the wrapper's computed style and re-read whenever the theme attribute
 * on <html> changes.
 */
export function EQVisualizer() {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dataRef = useRef<Uint8Array | null>(null);
    const drewSilenceRef = useRef(false);

    /* Re-render once the first gesture builds the audio graph, so the draw
     * loop picks up an analyser that did not exist at mount. */
    const [, setAudioTick] = useState(0);
    useEffect(() => onAudioReady(() => setAudioTick((n) => n + 1)), []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        /* Cached because getComputedStyle forces style resolution and this
         * runs sixty times a second. Invalidated by the observers below. */
        let colors = readColors(wrapper);
        let size = { width: 0, height: 0, dpr: 1 };
        /* getBoundingClientRect + getComputedStyle force style resolution, so
         * they run when the box actually changed -- not on all sixty frames. */
        let needsResize = true;

        const resize = () => {
            if (!needsResize) return;
            needsResize = false;
            /* contentRect, not getBoundingClientRect: the latter counts the
             * wrapper's padding and border as drawable space. */
            const rect = wrapper.getBoundingClientRect();
            const style = getComputedStyle(wrapper);
            const width =
                rect.width -
                parseFloat(style.paddingLeft) -
                parseFloat(style.paddingRight) -
                parseFloat(style.borderLeftWidth) -
                parseFloat(style.borderRightWidth);
            const height =
                rect.height -
                parseFloat(style.paddingTop) -
                parseFloat(style.paddingBottom) -
                parseFloat(style.borderTopWidth) -
                parseFloat(style.borderBottomWidth);
            const dpr = window.devicePixelRatio || 1;

            if (width === size.width && height === size.height && dpr === size.dpr) return;
            size = { width, height, dpr };

            /* Backing store in device pixels, CSS box in CSS pixels: setting
             * width alone drew a blurry canvas on every retina display. */
            canvas.width = Math.max(1, Math.floor(width * dpr));
            canvas.height = Math.max(1, Math.floor(height * dpr));
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            drewSilenceRef.current = false;
        };

        const draw = () => {
            const analyser = getAudio()?.analyser ?? null;
            const { width, height, dpr } = size;
            if (width <= 0 || height <= 0) return;

            if (analyser) {
                const bins = analyser.frequencyBinCount;
                if (!dataRef.current || dataRef.current.length !== bins) {
                    dataRef.current = new Uint8Array(bins);
                }
                analyser.getByteFrequencyData(dataRef.current);
                const silent = !dataRef.current.some((v) => v > SILENCE_LEVEL);
                if (silent && drewSilenceRef.current) return;
                drewSilenceRef.current = silent;
            } else if (drewSilenceRef.current) {
                return;
            } else {
                drewSilenceRef.current = true;
            }

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = colors.bg;
            ctx.fillRect(0, 0, width, height);

            const axisY = height - AXIS_BOTTOM;

            ctx.strokeStyle = colors.axis;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(PAD_X, axisY);
            ctx.lineTo(width - PAD_X, axisY);
            ctx.stroke();

            ctx.font = '11px "Space Grotesk", system-ui, sans-serif';
            ctx.textAlign = 'center';
            for (let i = 0; i <= TICK_COUNT; i++) {
                const freq = MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, i / TICK_COUNT);
                const x = freqToX(freq, width);
                ctx.strokeStyle = colors.axis;
                ctx.beginPath();
                ctx.moveTo(x, axisY);
                ctx.lineTo(x, axisY + 6);
                ctx.stroke();
                ctx.fillStyle = colors.label;
                ctx.fillText(tickLabel(freq), x, axisY + 19);
            }

            const data = dataRef.current;
            if (!analyser || !data) return;

            const nyquist = analyser.context.sampleRate / 2;
            const span = axisY - TRACE_TOP;

            ctx.beginPath();
            let started = false;
            for (let i = 0; i < data.length; i++) {
                /* Bin 0 is DC: its centre frequency is 0Hz, and log10(0) is
                 * -Infinity, which poisoned the first segment of the path. */
                const freq = (nyquist * i) / data.length;
                if (freq < MIN_FREQ) continue;
                const x = freqToX(freq, width);
                const y = axisY - (data[i] / 255) * span;
                if (started) ctx.lineTo(x, y);
                else {
                    ctx.moveTo(x, y);
                    started = true;
                }
            }
            if (!started) return;

            /* Fill under the curve first so the stroke stays crisp on top. */
            ctx.lineTo(freqToX(nyquist, width), axisY);
            ctx.lineTo(PAD_X, axisY);
            ctx.closePath();
            ctx.fillStyle = colors.fill;
            ctx.fill();

            ctx.strokeStyle = colors.trace;
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        const onDprChange = () => {
            needsResize = true;
        };
        /* Moving the window to a display with a different pixel ratio changes
         * nothing about the element's box, so ResizeObserver stays quiet. */
        const dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        dprQuery.addEventListener('change', onDprChange);

        let frame = 0;
        const loop = () => {
            resize();
            draw();
            frame = requestAnimationFrame(loop);
        };
        loop();

        const resizeObserver = new ResizeObserver(() => {
            needsResize = true;
            drewSilenceRef.current = false;
        });
        resizeObserver.observe(wrapper);

        /* The theme is an attribute on <html>; nothing else tells the canvas
         * its palette changed. */
        const themeObserver = new MutationObserver(() => {
            colors = readColors(wrapper);
            needsResize = true;
            drewSilenceRef.current = false;
        });
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        return () => {
            cancelAnimationFrame(frame);
            dprQuery.removeEventListener('change', onDprChange);
            resizeObserver.disconnect();
            themeObserver.disconnect();
        };
    }, []);

    return (
        <div ref={wrapperRef} className={styles.wrapper} aria-hidden="true">
            <canvas ref={canvasRef} className={styles.canvas} />
        </div>
    );
}

function readColors(element: HTMLElement) {
    const style = getComputedStyle(element);
    const token = (name: string) => style.getPropertyValue(name).trim();
    return {
        bg: token('--eq-bg'),
        axis: token('--eq-axis'),
        label: token('--eq-label'),
        trace: token('--eq-trace'),
        fill: token('--eq-fill'),
    };
}

export default EQVisualizer;
