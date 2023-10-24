import { useEffect, useRef } from "react";
import { resizeCanvas } from "./util";
import { paintStaff, paintStyle, resetCanvas2 } from "@/org/paint";
import { PreviewState } from "./atom";
import { atom, useAtom } from "jotai";
import { getPreviewScale } from "@/org/score-preferences";
import { UNIT, bStaffHeight } from "@/org/font/bravura";
import { determinePaintElementStyle } from "@/org/style/style";

const cssWidth = 150;
const cssHeight = cssWidth * (4 / 3);

// B4がcanvasのvertical centerにくるように
const topOfStaff = cssHeight / 2 - (bStaffHeight * getPreviewScale()) / 2;

const mtxAtom = atom<DOMMatrix | undefined>(undefined);

export const PreviewCanvas = ({ preview }: { preview: PreviewState }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mtx, setMtx] = useAtom(mtxAtom);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    resizeCanvas(canvas, cssWidth, cssHeight);
    canvas.style.left = `${preview.canvasCenter.x - cssWidth / 2}px`;
    canvas.style.top = `${preview.canvasCenter.y - cssHeight / 2}px`;
    resetCanvas2({ ctx: canvas.getContext("2d")!, fillStyle: "white" });
  }, []);
  useEffect(() => {
    // x: 左端 y: 中心
    setMtx(new DOMMatrix([1, 0, 0, 1, 0, topOfStaff]).scale(getPreviewScale()));
  }, []);
  useEffect(() => {
    console.log("preview", "start")
    if (!preview.staff || !preview.elements || !mtx) return;
    const styles = determinePaintElementStyle(
      preview.elements,
      UNIT,
      preview.staff
    );
    const ctx = ref.current?.getContext("2d")!;
    ctx.save();
    resetCanvas2({ ctx, fillStyle: "white" });
    // pointer handlerでdpr考慮しなくて済むように
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const { a, b, c, d, e, f } = mtx;
    ctx.transform(a, b, c, d, e, f);
    paintStaff(ctx, 0, 0, UNIT * 100, 1);
    for (const style of styles) {
      paintStyle(ctx, style);
      // paintBBox(ctx, style.bbox); // debug
      if (style.element.type !== "beam" && style.element.type !== "tie") {
        ctx.translate(style.width, 0);
      }
    }
    ctx.restore();
    console.log("preview", "end")
  }, [preview.staff, preview.elements, mtx]);
  return (
    <canvas
      id="previewCanvas"
      className={`absolute w-[${cssWidth}px] aspect-[4/3] rounded shadow-md`}
      ref={ref}
    ></canvas>
  );
};
