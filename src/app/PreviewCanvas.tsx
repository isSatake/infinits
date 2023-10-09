import { useEffect, useRef } from "react";
import { resizeCanvas } from "./util";
import { resetCanvas2 } from "@/org/paint";
import { PreviewState } from "./atom";

const cssWidth = 150;
const cssHeight = cssWidth * (4 / 3);

export const PreviewCanvas = ({ preview }: { preview: PreviewState }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    resizeCanvas(canvas, cssWidth, cssHeight);
    canvas.style.left = `${preview.center.x - cssWidth / 2}px`;
    canvas.style.top = `${preview.center.y - cssHeight / 2}px`;
    resetCanvas2({ ctx: canvas.getContext("2d")!, fillStyle: "white" });
  }, []);
  return (
    <canvas
      id="previewCanvas"
      className={`absolute w-[${cssWidth}px] aspect-[4/3] rounded shadow-md`}
      ref={ref}
    ></canvas>
  );
};
