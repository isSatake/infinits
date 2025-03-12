import { Point, Size } from "./geometry";

export const measureText = ({
  text,
  fontSize,
  fontFamily,
  baseline,
}: {
  text: string;
  fontSize: number;
  fontFamily: string;
  baseline: "middle" | "top";
}): Size & { offset: Point } => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = baseline;
  const metrics = ctx.measureText(text);
  canvas.remove();
  return {
    width: metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft,
    height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    offset: {
      x: metrics.actualBoundingBoxLeft,
      y: metrics.actualBoundingBoxAscent,
    },
  };
};
