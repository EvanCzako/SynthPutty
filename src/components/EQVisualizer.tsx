import React, { useEffect, useRef, useCallback } from "react";
import styles from "../styles/EQVisualizer.module.css";
import { useSynthStore } from "../store/synthStore";

export function EQVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserNode = useSynthStore((s) => s.analyserNode);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const axisY = canvas.height - 24;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(32, axisY);
    ctx.lineTo(canvas.width - 32, axisY);
    ctx.stroke();

    const minFreq = 20;
    const maxFreq = 20000;
    const numTicks = 10;
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    for (let i = 0; i <= numTicks; i++) {
      const logFreq = minFreq * Math.pow(maxFreq / minFreq, i / numTicks);
      const x =
        32 +
        ((Math.log10(logFreq) - Math.log10(minFreq)) /
          (Math.log10(maxFreq) - Math.log10(minFreq))) *
          (canvas.width - 64);
      ctx.beginPath();
      ctx.moveTo(x, axisY);
      ctx.lineTo(x, axisY + 8);
      ctx.stroke();
      let label: string;
      if (logFreq < 1000) {
        label = Math.round(logFreq / 10) * 10 + "";
      } else {
        label = (Math.round(logFreq / 100) / 10).toFixed(1) + "k";
      }
      ctx.fillText(label, x, axisY + 22);
    }

    if (analyserNode) {
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const freq = (analyserNode.context.sampleRate * i) / (2 * bufferLength);
        const x =
          32 +
          ((Math.log10(freq) - Math.log10(minFreq)) /
            (Math.log10(maxFreq) - Math.log10(minFreq))) *
            (canvas.width - 64);
        const y = axisY - (dataArray[i] / 255) * (axisY - 16);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
  }, [analyserNode]);

  useEffect(() => {
    let animationId: number;
    let running = true;

    function animate() {
      if (!running) return;
      draw();
      animationId = requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      draw();
    }
    window.addEventListener("resize", handleResize);
    return () => {
      running = false;
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [draw]);

  return (
    <div className={styles.eqvisualizer_wrapper}>
      <canvas ref={canvasRef} className={styles.eqvisualizer_canvas} />
    </div>
  );
}

export default EQVisualizer;
