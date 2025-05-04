export const resetCanvas2 = ({
  ctx,
  fillStyle,
}: {
  ctx: CanvasRenderingContext2D;
  fillStyle: string;
}) => {
  ctx.save();
  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
};

export const initCanvas = ({
  leftPx,
  topPx,
  width,
  height,
  _canvas,
}: {
  leftPx: number;
  topPx: number;
  width: number;
  height: number;
  _canvas?: HTMLCanvasElement;
}) => {
  const canvas = _canvas ?? document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.top = `${topPx}px`;
  canvas.style.left = `${leftPx}px`;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays
  // iOS PWAで描画されなくなるので一時的にやめる
  canvas.width = width; //* devicePixelRatio;
  canvas.height = height; //* devicePixelRatio;
  canvas.getContext("2d"); //?.scale(devicePixelRatio, devicePixelRatio);
};
