import React from "react";
import { useEffect, useRef } from "react";
import { resizeCanvas } from "./util";
import { paintStyle, resetCanvas2 } from "@/org/paint";
import { PreviewState } from "./atom";
import { atom, useAtom } from "jotai";
import {
  getPreviewHeight,
  getPreviewScale,
  getPreviewWidth,
} from "@/org/score-preferences";
import { UNIT, bStaffHeight } from "@/org/font/bravura";
import { determinePaintElementStyle } from "@/org/style/style";

const htmlWidth = getPreviewWidth();
const htmlHeight = getPreviewHeight();

// B4がcanvasのvertical centerにくるように
const topOfStaff = htmlHeight / 2 - (bStaffHeight * getPreviewScale()) / 2;

const mtxAtom = atom<DOMMatrix | undefined>(undefined);

export const PreviewCanvas = ({ preview }: { preview: PreviewState }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mtx, setMtx] = useAtom(mtxAtom);
  useEffect(() => {
    const canvas = ref.current!;
    // TODO MainCanvasと同様に最大scaleを決める
    resizeCanvas(canvas, devicePixelRatio, {
      width: htmlWidth,
      height: htmlHeight,
    });
    canvas.style.left = `${preview.canvasCenter.x - htmlWidth / 2}px`;
    canvas.style.top = `${preview.canvasCenter.y - htmlHeight / 2}px`;
    resetCanvas2({ ctx: canvas.getContext("2d")!, fillStyle: "white" });
  }, []);
  useEffect(() => {
    // x: 左端 y: 中心
    setMtx(new DOMMatrix([1, 0, 0, 1, 0, topOfStaff]).scale(getPreviewScale()));
  }, []);
  useEffect(() => {
    console.log("preview", "start");
    if (!preview.staff || !preview.elements || !mtx) return;
    const styles = determinePaintElementStyle(
      preview.elements,
      UNIT,
      preview.staff
    );
    const elIdxToX = new Map<number, number>();
    let cursor = 0;
    for (const style of styles) {
      const { width, element, index } = style;
      console.log("style", style);
      if (index !== undefined) {
        elIdxToX.set(index, cursor + width / 2);
      }
      if (element.type !== "beam" && element.type !== "tie") {
        cursor += width;
      }
    }
    const ctx = ref.current?.getContext("2d")!;
    ctx.save();
    resetCanvas2({ ctx, fillStyle: "white" });
    // pointer handlerでdpr考慮しなくて済むように
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const { a, b, c, d, e, f } = mtx;
    ctx.transform(a, b, c, d, e, f);
    // 入力中Elementをセンタリング
    const centerX = elIdxToX.get(preview.insertedIndex)!;
    ctx.translate(htmlWidth / 2 / a - centerX, 0);
    for (const style of styles) {
      paintStyle(ctx, style);
      // paintBBox(ctx, style.bbox); // debug
      if (style.element.type !== "beam" && style.element.type !== "tie") {
        ctx.translate(style.width, 0);
      }
    }
    ctx.restore();
    console.log("preview", "end");
  }, [preview, mtx]);
  return <canvas id="previewCanvas" ref={ref}></canvas>;
};
