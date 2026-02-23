import { useEffect, useRef } from "react";
import styles from "../styles/EQVisualizer.module.css";

export function EQVisualizer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const fixedWidth = 200; // Fixed width of the rectangle
        const fixedHeight = 100; // Fixed height of the rectangle

        const drawRectangle = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            const parentWidth = parent.clientWidth;
            const parentHeight = parent.clientHeight;

            canvas.width = parentWidth;
            canvas.height = parentHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#3498db"; // Blue color

            const x = (canvas.width - fixedWidth) / 2;
            const y = (canvas.height - fixedHeight) / 2;

            ctx.fillRect(x, y, fixedWidth, fixedHeight);
        };

        drawRectangle();
        window.addEventListener("resize", drawRectangle);

        return () => {
            window.removeEventListener("resize", drawRectangle);
        };
    }, []);

    return (
        <div className={styles.wrapper}>
            <canvas ref={canvasRef} className={styles.canvas} />
        </div>
    );
}
