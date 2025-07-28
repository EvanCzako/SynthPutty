import { useEffect, useRef } from "react";
import { useSynthStore } from "../store/synthStore";
import styles from "../styles/EQVisualizer.module.css";

export function EQVisualizer() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const analyserNode = useSynthStore((s) => s.analyserNode);
	const { filterType, filterCutoff } = useSynthStore();

	useEffect(() => {
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

			const nyquist = analyserNode.context.sampleRate / 2;
			const logMin = Math.log10(20);
			const logMax = Math.log10(nyquist);

			// Draw frequency tick marks BELOW the graph
			const paddingBottom = 30; // reserve 30px for tick labels
			const usableHeight = height - paddingBottom;
			const tickY = usableHeight + 5; // position ticks below the graph
			const tickHeight = 6;

			ctx.strokeStyle = "#888";
			ctx.fillStyle = "#aaa";
			ctx.lineWidth = 1;
			ctx.font = "12px sans-serif";
			ctx.textAlign = "center";

			const freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

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

			// Draw horizontal center line
			ctx.strokeStyle = "#444";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(0, height / 2);
			ctx.lineTo(width, height / 2);
			ctx.stroke();

			// Draw frequency spectrum
			ctx.beginPath();
			ctx.strokeStyle = "#0af";
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

				if (x === 0) ctx.moveTo(x, y);
				else ctx.lineTo(x, y);
			}

			ctx.stroke();
		};

		draw();
	}, [analyserNode]);

	return (
		<canvas
			ref={canvasRef}
			className={styles.canvas}
			width={600}
			height={600}
		/>
	);
}
