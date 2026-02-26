import { useEffect } from "react";

export default function useDisableZoom() {
    useEffect(() => {
        const prevent = (e: TouchEvent) => {
            if (e.touches.length > 1) e.preventDefault();
        };

        const preventGesture = (e: Event) => e.preventDefault();

        document.addEventListener("touchstart", prevent, { passive: false });
        document.addEventListener("gesturestart", preventGesture);

        return () => {
            document.removeEventListener("touchstart", prevent);
            document.removeEventListener("gesturestart", preventGesture);
        };
    }, []);
}
