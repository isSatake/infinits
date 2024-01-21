import React from "react";
import { UNIT } from "@/org/font/bravura";
import { BBox, Point, offsetBBox } from "@/org/geometry";
import { paintCaret, paintStaff, paintStyle, resetCanvas2 } from "@/org/paint";
import { getInitScale } from "@/org/score-preferences";
import { StaffStyle } from "@/org/score-states";
import {
  determineCaretStyle,
  determinePaintElementStyle,
} from "@/org/style/style";
import {
  CaretStyle,
  PaintElement,
  PaintElementStyle,
  Pointing,
} from "@/org/style/types";
import { atom, useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { caretAtom, caretStyleAtom, elementsAtom } from "./atom";
import {
  kDoubleClickThresholdMs,
  usePointerHandler,
  useResizeHandler,
} from "./hooks";

// staff id -> staff style
let staffId = 0;
const staffMapAtom = atom<Map<number, StaffStyle>>(
  new Map([
    [staffId++, { clef: { type: "g" as const }, position: { x: 0, y: 0 } }],
  ])
);

// staff id -> element style
const elementMapAtom = atom<Map<number, PaintElementStyle<PaintElement>[]>>(
  new Map()
);

// staff id -> element bboxes
const bboxAtom = atom<Map<number, { bbox: BBox; elIdx?: number }[]>>(new Map());

const pointingAtom = atom<Pointing | undefined>(undefined);

const mtxAtom = atom<DOMMatrix | undefined>(undefined);

export const MainCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useResizeHandler(ref);
  const staffMap = useAtomValue(staffMapAtom);
  const elements = useAtomValue(elementsAtom);
  const [styleMap, setStyleMap] = useAtom(elementMapAtom);
  const [caretStyle, setCaretStyle] = useAtom(caretStyleAtom);
  const [bboxMap, setBBoxMap] = useAtom(bboxAtom);
  const pointing = useAtomValue(pointingAtom);
  const [mtx, setMtx] = useAtom(mtxAtom);
  const focus = useAtomValue(caretAtom);

  useEffect(() => {
    // useEffectの外でDOMMatrixを解決できない
    setMtx(new DOMMatrix([getInitScale(), 0, 0, getInitScale(), 0, 0]));
  }, []);

  // element style
  useEffect(() => {
    console.log("render", "start");
    const map = new Map<number, PaintElementStyle<PaintElement>[]>();
    for (const [id, staff] of staffMap.entries()) {
      const styles = determinePaintElementStyle(
        elements.get(id) ?? [],
        UNIT,
        staff,
        pointing
      );
      map.set(id, styles);
    }
    setStyleMap(map);
  }, [staffMap, elements, pointing]);

  // caret style
  useEffect(() => {
    const id = focus.staffId;
    const styles = styleMap.get(id);
    if (!styles) {
      return;
    }
    const caretStyles: CaretStyle[] = [];
    let cursor = 0;
    for (const style of styles) {
      const { width, element, caretOption, bbox: _bbox, index: elIdx } = style;
      const b = { bbox: offsetBBox(_bbox, { x: cursor }), elIdx };
      bboxMap.get(id)?.push(b) ?? bboxMap.set(id, [b]);
      setBBoxMap(new Map(bboxMap));
      if (caretOption) {
        const caret = determineCaretStyle(caretOption, width, cursor);
        caretStyles.push(caret);
      }
      if (element.type !== "beam" && element.type !== "tie") {
        cursor += width;
      }
    }
    setCaretStyle(caretStyles);
  }, [styleMap, focus]);

  // paint
  useEffect(() => {
    if (!mtx) {
      return;
    }
    const styles = styleMap.get(focus.staffId);
    if (!styles) {
      return;
    }
    const ctx = ref.current?.getContext("2d")!;
    ctx.save();
    resetCanvas2({ ctx, fillStyle: "white" });
    // pointer handlerでdpr考慮しなくて済むように
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const { a, b, c, d, e, f } = mtx;
    ctx.transform(a, b, c, d, e, f);
    for (const [_, staff] of staffMap.entries()) {
      ctx.save();
      ctx.translate(staff.position.x, staff.position.y);
      paintStaff(ctx, 0, 0, UNIT * 100, 1);
      for (const style of styles) {
        paintStyle(ctx, style);
        // paintBBox(ctx, style.bbox); // debug
        if (style.element.type !== "beam" && style.element.type !== "tie") {
          ctx.translate(style.width, 0);
        }
      }
      ctx.restore();
    }
    const currentStaff = staffMap.get(focus.staffId);
    const caret = caretStyle.at(focus.idx);
    if (currentStaff && caret) {
      ctx.save();
      ctx.translate(currentStaff.position.x, currentStaff.position.y);
      paintCaret({ ctx, scale: 1, caret });
      ctx.restore();
    }
    ctx.restore();
    console.log("render", "end");
  }, [mtx, staffMap, styleMap, caretStyle, focus]);

  return (
    <canvas
      id="mainCanvas"
      className="absolute"
      ref={ref}
      {...useMainPointerHandler()}
    ></canvas>
  );
};

const useMainPointerHandler = () => {
  const [mtx, setMtx] = useAtom(mtxAtom);
  const [staffMap, setStaffMap] = useAtom(staffMapAtom);
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

  return usePointerHandler({
    onDown,
    onDrag,
    onUp,
    onDoubleClick,
  });
};
