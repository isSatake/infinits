// import { UNIT } from "@/org/font/bravura";
import { MusicalElement } from "@/org/notation/types";
import { paintStaff, paintStyle, resetCanvas } from "@/org/paint";
import { StaffStyle } from "@/org/score-states";
import { determinePaintElementStyle } from "@/org/style/style";
import { PaintElement, PaintElementStyle, Pointing } from "@/org/style/types";
import { atom, useAtomValue } from "jotai";
import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { kSampleElements } from "./constants";
import { resizeCanvas } from "./util";
import { getInitScale } from "@/org/score-preferences";

// bravuraをimportするとサーバー上でPath2Dを使うことになりエラーになる
// とりあえずこちらに定義しておく
const UNIT = 250;

const staffMapAtom = atom<Map<number, StaffStyle>>(
  new Map([
    [0, { clef: { type: "g" as const }, position: { x: 0, y: 0 } }],
    // [0, { clef: { type: "g" as const }, position: { x: 50, y: 50 } }],
  ])
);
const elementsAtom = atom<Map<number, MusicalElement[]>>(
  new Map([
    [0, kSampleElements],
    [1, kSampleElements],
  ])
);
const pointingAtom = atom<Pointing | undefined>(undefined);
// const mtxAtom = atom<DOMMatrix>(new DOMMatrix());
export const MainCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useResizeHandler(ref);
  const staffMap = useAtomValue(staffMapAtom);
  const elements = useAtomValue(elementsAtom);
  const pointing = useAtomValue(pointingAtom);
  const mtx = useMemo(
    () => new DOMMatrix([getInitScale(), 0, 0, getInitScale(), 0, 0]),
    []
  );
  useEffect(() => {
    const map = new Map<number, PaintElementStyle<PaintElement>[]>();
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
  }, [staffMap, elements, pointing, mtx]);

  return <canvas id="mainCanvas" className="absolute" ref={ref}></canvas>;
};

const useResizeHandler = (ref: RefObject<HTMLCanvasElement>) => {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const resize = () =>
      resizeCanvas(canvas, window.innerWidth, window.innerHeight);
    window.addEventListener("resize", resize);
    resize();
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);
};
