import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { resizeCanvas } from "./util";
import { atom, useAtom, useAtomValue } from "jotai";
import { elementsAtom, staffMapAtom } from "./page";
import { PaintElementStyle, PaintElement, Pointing } from "@/org/style/types";
import { determinePaintElementStyle } from "@/org/style/style";
import { UNIT } from "@/org/font/bravura";
import { renderStaff } from "@/org/score-renderer";
import { paintStaff, paintStyle, resetCanvas } from "@/org/paint";

const pointingAtom = atom<Pointing | undefined>(undefined);
const mtxAtom = atom<DOMMatrix>(new DOMMatrix());
export const MainCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useResizeHandler(ref);
  const staffMap = useAtomValue(staffMapAtom);
  const elements = useAtomValue(elementsAtom);
  const pointing = useAtomValue(pointingAtom);
  const mtx = useAtomValue(mtxAtom);
  useCallback(() => {
    const map = new Map();
    for (const [id, staff] of staffMap.entries()) {
      const style = determinePaintElementStyle(
        elements.get(id) ?? [],
        UNIT,
        staff,
        pointing
      );
      map.set(id, style);
    }
    // renderStaff
    const ctx = ref.current?.getContext("2d")!;
    resetCanvas({
      ctx,
      width: window.innerWidth,
      height: window.innerHeight,
      fillStyle: "white",
    });
    ctx.save();
    const { a, b, c, d, e, f } = mtx;
    ctx.transform(a, b, c, d, e, f);
    for (const [id, staff] of staffMap.entries()) {
      ctx.save();
      ctx.translate(staff.position.x, staff.position.y);
      paintStaff(ctx, 0, 0, UNIT * 100, 1);
      // paintStyle
      for (const style of map.get(id) ?? []) {
        paintStyle(ctx, style);
        // paintBBox(ctx, style.bbox); // debug
        if (style.element.type !== "beam" && style.element.type !== "tie") {
          ctx.translate(style.width, 0);
        }
      }
      ctx.restore();
    }
    ctx.restore();
    // renderCaret
  }, [staffMap, elements, pointing]);

  return (
    <canvas
      id="mainCanvas"
      width=""
      className="absolute w-full h-full"
      ref={ref}
    ></canvas>
  );
};

const useResizeHandler = (ref: RefObject<HTMLCanvasElement>) => {
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
};
