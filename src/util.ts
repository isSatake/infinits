import canvasSize from "canvas-size";
import { Size } from "./org/geometry";

export const resizeCanvas = (
  canvas: HTMLCanvasElement,
  scale: number,
  htmlSize: Size
) => {
  const { width, height } = htmlSize;
  console.log("resizeCanvas", scale, width, height);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
};

/**
 * dpr以下 &&
 * canvas最大面積になるべく近い最大の倍率を求める
 */
export const determineCanvasScale = async (
  dpr: number,
  htmlCanvasSize: Size
): Promise<number> => {
  const max = await canvasSize
    .maxArea({
      usePromise: true,
      useWorker: true,
    })
    .catch();
  const maxArea = max.width * max.height;
  const htmlArea = htmlCanvasSize.width * htmlCanvasSize.height;
  return Math.min(dpr, Math.sqrt(maxArea / htmlArea));
};
