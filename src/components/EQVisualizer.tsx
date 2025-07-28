import { useEffect, useRef } from "react";
import { useSynthStore } from "../store/synthStore";
import styles from "../styles/EQVisualizer.module.css";

export function EQVisualizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserNode = useSynthStore((s) => s.analyserNode);
    const { filterType, filterCutoff } = useSynthStore();

    useEffect(() => {
		console.log(analyserNode);
        if (!analyserNode) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

		const draw = () => {
			requestAnimationFrame(draw);
			analyserNode.getByteFrequencyData(dataArray);

			const width = canvas.width;
			const height = canvas.height;

			ctx.clearRect(0, 0, width, height);

			// Draw horizontal center line
			ctx.strokeStyle = "#444";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(0, height / 2);
			ctx.lineTo(width, height / 2);
			ctx.stroke();

			ctx.beginPath();
			ctx.strokeStyle = "#0af";
			ctx.lineWidth = 2;

			const nyquist = analyserNode.context.sampleRate / 2;
			const logMin = Math.log10(20);
			const logMax = Math.log10(nyquist);

			for (let x = 0; x < width; x++) {
				const logFreq = logMin + (x / width) * (logMax - logMin);
				const freq = Math.pow(10, logFreq);

				// Compute floating-point FFT bin index
				const bin = (freq / nyquist) * bufferLength;
				
				// Get floor and ceil bin indexes
				const indexLow = Math.floor(bin);
				const indexHigh = Math.min(indexLow + 1, bufferLength - 1);

				// Get magnitudes at adjacent bins
				const magLow = dataArray[indexLow] ?? 0;
				const magHigh = dataArray[indexHigh] ?? 0;

				// Linear interpolate magnitude
				const frac = bin - indexLow;
				const magnitude = 0.9*(magLow + frac * (magHigh - magLow));

				const v = magnitude / 255;
				const y = height - v * height;

				if (x === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}

			ctx.stroke();
		};



        draw();
    }, [analyserNode]);

    return <canvas ref={canvasRef} className={styles.canvas} width={600} height={600} />;

}
