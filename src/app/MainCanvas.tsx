import { RefObject, useEffect, useRef } from "react";
import { resizeCanvas } from "./util";

export const MainCanvas = () => {
  const ref = useResizeHandlerRef();
  return (
    <canvas
      id="mainCanvas"
      width=""
      className="absolute w-full h-full"
      ref={ref}
    ></canvas>
  );
};

const useResizeHandlerRef = (): RefObject<HTMLCanvasElement> => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const resize = () =>
      resizeCanvas(canvas, window.innerWidth, window.innerHeight);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);
  return ref;
};
