import { useEffect, useRef } from "react";
import { useSynthStore } from "../store/synthStore";
import { useFontStore } from "../store/fontStore";
import styles from "../styles/EQVisualizer.module.css";

export function EQVisualizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { filterType, filterCutoff, analyserNode } = useSynthStore();
    const { fontSize, layout } = useFontStore();

	useEffect(() => {
		const handleResize = () => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const cssWidth = canvas.clientWidth;
			const cssHeight = canvas.clientHeight;
			const dpr = window.devicePixelRatio || 1;

			canvas.width = cssWidth * dpr;
			canvas.height = cssHeight * dpr;
			ctx.scale(dpr, dpr);
		};

		window.addEventListener("resize", handleResize);
		window.addEventListener("orientationchange", handleResize); // Some devices need this

		handleResize(); // initial call

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("orientationchange", handleResize);
		};
	}, []);


    useEffect(() => {

        if (!analyserNode) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Get layout size in CSS pixels
        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;

        // Handle HiDPI displays
        const dpr = window.devicePixelRatio || 1;

        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        ctx.scale(dpr, dpr);

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

		let animationId: number;
        const draw = () => {

            animationId = requestAnimationFrame(draw);
            analyserNode.getByteFrequencyData(dataArray);

            const width = cssWidth;
            const height = cssHeight;

            ctx.clearRect(0, 0, width, height);

            const nyquist = analyserNode.context.sampleRate / 2;
            const logMin = Math.log10(20);
            const logMax = Math.log10(nyquist);

            // Draw frequency tick marks BELOW the graph
            const paddingBottom = 50; // reserve 30px for tick labels
            const usableHeight = height - paddingBottom;
            const tickY = usableHeight + 5; // position ticks below the graph
            const tickHeight = 6;

            ctx.strokeStyle = "#888";
            ctx.fillStyle = "#aaa";
            ctx.lineWidth = 1;
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = "center";

            const freqs = [
                20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000,
            ];

            for (const freq of freqs) {
                if (freq > nyquist) continue;

                const logFreq = Math.log10(freq);
                const x = ((logFreq - logMin) / (logMax - logMin)) * width;

                ctx.beginPath();
                ctx.moveTo(x, tickY);
                ctx.lineTo(x, tickY + tickHeight);
                ctx.stroke();

                const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
                ctx.fillText(label, x, tickY + tickHeight + 12);
            }

            // Axis label for frequency (centered below ticks)
            ctx.fillStyle = "#ccc";
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText("Freq (Hz)", width / 2, height - 5);

            // Draw horizontal center line
            ctx.strokeStyle = "#444";
            ctx.lineWidth = 1;
            // Draw frequency spectrum with shading under the curve
            ctx.beginPath();
            ctx.strokeStyle = "#0af";
            ctx.fillStyle = "rgba(0, 136, 255, 0.3)"; // semi-transparent blue
            ctx.lineWidth = 2;

            for (let x = 0; x < width; x++) {
                const logFreq = logMin + (x / width) * (logMax - logMin);
                const freq = Math.pow(10, logFreq);
                const bin = (freq / nyquist) * bufferLength;

                const indexLow = Math.floor(bin);
                const indexHigh = Math.min(indexLow + 1, bufferLength - 1);
                const magLow = dataArray[indexLow] ?? 0;
                const magHigh = dataArray[indexHigh] ?? 0;

                const frac = bin - indexLow;
                const magnitude = 0.9 * (magLow + frac * (magHigh - magLow));

                const v = magnitude / 255;
                const y = usableHeight - v * usableHeight;

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            // Close path down to baseline and back to start
            ctx.lineTo(width - 1, usableHeight);
            ctx.lineTo(0, usableHeight);
            ctx.closePath();

            // Fill the area under the curve
            // Create a horizontal gradient from left (low freq) to right (high freq)
            const fillGradient = ctx.createLinearGradient(0, 0, width, 0);
            fillGradient.addColorStop(0.0, "rgba(149, 0, 255, 0.8)"); // Low freq - Blue
            fillGradient.addColorStop(0.5, "rgba(255, 85, 0, 0.8)"); // Mid freq - Green
            fillGradient.addColorStop(1.0, "rgba(255, 155, 240, 0.8)"); // High freq - Red

            ctx.fillStyle = fillGradient;
            ctx.fill();

            // Then stroke the curve line on top
            ctx.stroke();
        };

        draw();
		return () => {
			cancelAnimationFrame(animationId);
		};
    }, [analyserNode, fontSize, layout]);

    return <canvas ref={canvasRef} className={styles.canvas} />;
}
