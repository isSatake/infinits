import { UNIT, bStaffHeight } from "@/org/font/bravura";
import { paintStyle, resetCanvas2 } from "@/org/paint";
import {
  getPreviewHeight,
  getPreviewScale,
  getPreviewWidth,
} from "@/org/score-preferences";
import { determinePaintElementStyle } from "@/org/style/style";
import React from "react";
import { useEffect, useMemo, useRef } from "react";
import { PreviewState } from "./atom";
import { resizeCanvas } from "./util";

const htmlWidth = getPreviewWidth();
const htmlHeight = getPreviewHeight();

// B4がcanvasのvertical centerにくるように
const topOfStaff = htmlHeight / 2 - (bStaffHeight * getPreviewScale()) / 2;

// x: 左端 y: 中心
const mtx = new DOMMatrix([1, 0, 0, 1, 0, topOfStaff]).scale(getPreviewScale());

export const PreviewCanvas = ({ preview }: { preview: PreviewState }) => {
  const ref = useRef<HTMLCanvasElement>(null);
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

  const init = useMemo(() => {
    const styles = determinePaintElementStyle({
      elements: preview.elements,
      gapWidth: UNIT,
      staffStyle: preview.staff,
    });
    const elIdxToX = new Map<number, number>();
    let offsetGap;
    let cursor = 0;
    for (const style of styles) {
      const { width, element, index } = style;
      if (index === preview.insertedIndex) {
        offsetGap = { idx: preview.insertedIndex, width };
      }
      if (index !== undefined) {
        elIdxToX.set(index, cursor + width / 2);
      }
      if (
        element.type !== "staff" &&
        element.type !== "beam" &&
        element.type !== "tie"
      ) {
        cursor += width;
      }
    }
    const centerX = elIdxToX.get(preview.insertedIndex)!;
    return { offsetGap, centerX };
  }, []);

  useEffect(() => {
    console.log("preview", "start");
    const styles = determinePaintElementStyle({
      elements: preview.elements,
      gapWidth: UNIT,
      staffStyle: preview.staff,
      gap: preview.offsetted ? init.offsetGap : undefined,
    });
    const ctx = ref.current?.getContext("2d")!;
    ctx.save();
    resetCanvas2({ ctx, fillStyle: "white" });
    // pointer handlerでdpr考慮しなくて済むように
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const { a, b, c, d, e, f } = mtx;
    ctx.transform(a, b, c, d, e, f);
    // 入力中Elementをセンタリング
    ctx.translate(htmlWidth / 2 / a - init.centerX, 0);
    for (const style of styles) {
      paintStyle(ctx, style);
      // paintBBox(ctx, style.bbox); // debug
      if (
        style.element.type !== "staff" &&
        style.element.type !== "beam" &&
        style.element.type !== "tie"
      ) {
        ctx.translate(style.width, 0);
      }
    }
    ctx.restore();
    console.log("preview", "end");
  }, [preview, mtx, init]);

  return <canvas id="previewCanvas" ref={ref}></canvas>;
};
