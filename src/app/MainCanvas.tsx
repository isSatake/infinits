import { UNIT } from "@/org/font/bravura";
import { Point } from "@/org/geometry";
import { MusicalElement } from "@/org/notation/types";
import { paintStaff, paintStyle, resetCanvas2 } from "@/org/paint";
import { getInitScale } from "@/org/score-preferences";
import { StaffStyle } from "@/org/score-states";
import { determinePaintElementStyle } from "@/org/style/style";
import { PaintElement, PaintElementStyle, Pointing } from "@/org/style/types";
import { atom, useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { kSampleElements } from "./constants";
import {
  kDoubleClickThresholdMs,
  usePointerHandler,
  useResizeHandler,
} from "./hooks";

let staffId = 0;

const staffMapAtom = atom<Map<number, StaffStyle>>(
  new Map([
    [staffId++, { clef: { type: "g" as const }, position: { x: 0, y: 0 } }],
  ])
);
const elementsAtom = atom<Map<number, MusicalElement[]>>(
  new Map([[0, kSampleElements]])
);
const pointingAtom = atom<Pointing | undefined>(undefined);
const mtxAtom = atom<DOMMatrix | undefined>(undefined);
export const MainCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useResizeHandler(ref);
  const [staffMap, setStaffMap] = useAtom(staffMapAtom);
  const elements = useAtomValue(elementsAtom);
  const pointing = useAtomValue(pointingAtom);
  const [mtx, setMtx] = useAtom(mtxAtom);
  useEffect(() => {
    setMtx(new DOMMatrix([getInitScale(), 0, 0, getInitScale(), 0, 0]));
  }, []);
  useEffect(() => {
    console.log("render", "start");
    if (!mtx) {
      return;
    }
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
    ctx.save();
    resetCanvas2({ ctx, fillStyle: "white" });
    // pointer handlerでdpr考慮しなくて済むように
    ctx.scale(devicePixelRatio, devicePixelRatio);
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
    console.log("render", "end");
    // renderCaret
  }, [staffMap, elements, pointing, mtx]);

  const [tmpMtx, setTmpMtx] = useState<DOMMatrix>();
  const [doubleZoomTimer, setDoubleZoomTimer] = useState<number>(-1);
  const [doubleZoomPoint, setDoubleZoomPoint] = useState<Point>();

  const onDown = useCallback(
    (ev: React.PointerEvent) => {
      if (!mtx) {
        return;
      }
      setTmpMtx(mtx);
      if (doubleZoomTimer === -1) {
        setDoubleZoomTimer(
          window.setTimeout(() => {
            setDoubleZoomTimer(-1);
          }, kDoubleClickThresholdMs)
        );
      } else {
        window.clearTimeout(doubleZoomTimer);
        setDoubleZoomTimer(-1);
        setDoubleZoomPoint(
          mtx.inverse().transformPoint({ x: ev.clientX, y: ev.clientY })
        );
      }
    },
    [mtx, doubleZoomTimer]
  );

  const onDrag = useCallback(
    (ev: React.PointerEvent, down: React.PointerEvent) => {
      if (!tmpMtx) {
        return;
      }
      if (doubleZoomPoint) {
        const scale = Math.exp((ev.clientY - down.clientY) / 100);
        setMtx(
          tmpMtx
            .translate(doubleZoomPoint.x, doubleZoomPoint.y)
            .scale(scale, scale)
            .translate(-doubleZoomPoint.x, -doubleZoomPoint.y)
        );
        return;
      }
      const dx = (ev.clientX - down.clientX) / tmpMtx.a;
      const dy = (ev.clientY - down.clientY) / tmpMtx.a;
      setMtx(tmpMtx.translate(dx, dy));
    },
    [tmpMtx, doubleZoomPoint]
  );

  const onUp = useCallback(() => {
    setTmpMtx(undefined);
    setDoubleZoomPoint(undefined);
  }, []);

  const onDoubleClick = useCallback(
    (ev: React.PointerEvent) => {
      if (!mtx) {
        return;
      }
      staffMap.set(staffId++, {
        clef: { type: "g" as const },
        position: mtx
          .inverse()
          .transformPoint({ x: ev.clientX, y: ev.clientY }),
      });
      setStaffMap(new Map(staffMap));
    },
    [staffMap, mtx]
  );

  return (
    <canvas
      id="mainCanvas"
      className="absolute"
      ref={ref}
      {...usePointerHandler({
        onDown,
        onDrag,
        onUp,
        onDoubleClick,
      })}
    ></canvas>
  );
};
