import { useEffect, useRef } from "react";
import { resizeCanvas } from "./util";

const cssWidth = 150;

export const PreviewCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    resizeCanvas(canvas, cssWidth, cssWidth * (3 / 4));
  }, []);
  return (
    <canvas
      id="previewCanvas"
      className={`absolute w-[${cssWidth}px] aspect-[3/4] rounded shadow-md`}
      ref={ref}
    ></canvas>
  );
};
