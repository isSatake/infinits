export const resizeCanvas = (
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) => {
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
  // iOS PWAで描画されなくなるかも
  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
};
