import React from "react";
import { UNIT } from "@/org/font/bravura";
import {
  BBox,
  Point,
  Size,
  addPoint,
  isPointInBBox,
  offsetBBox,
  scalePoint,
  scaleSize,
} from "@/org/geometry";
import { paintBBox, paintCaret, paintStyle, resetCanvas2 } from "@/org/paint";
import { getInitScale } from "@/org/score-preferences";
import { StaffStyle } from "./org/style/types";
import {
  determineCaretStyle,
  determinePaintElementStyle,
  genStaffStyle,
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
import { determineCanvasScale, resizeCanvas } from "./util";

// staff id -> staff style
// atom.tsに移動
let staffId = 0;
export const staffMapAtom = atom<Map<number, StaffStyle>>(
  new Map([
    [
      staffId++,
      genStaffStyle(
        { type: "staff", clef: { type: "clef", pitch: "g" }, lineCount: 5 },
        { x: 0, y: 0 }
      ),
    ],
  ])
);

// staff id -> element style
const elementMapAtom = atom<Map<number, PaintElementStyle<PaintElement>[]>>(
  new Map()
);

// staff id -> element bboxes
const bboxAtom = atom<Map<number, { bbox: BBox; elIdx?: number }[]>>(new Map());

const pointingAtom = atom<Pointing | undefined>(undefined);

const mtxAtom = atom<DOMMatrix>(
  new DOMMatrix([getInitScale(), 0, 0, getInitScale(), 0, 0])
);

export const MainCanvas = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const staffMap = useAtomValue(staffMapAtom);
  const elements = useAtomValue(elementsAtom);
  const [styleMap, setStyleMap] = useAtom(elementMapAtom);
  const [caretStyle, setCaretStyle] = useAtom(caretStyleAtom);
  const [bboxMap, setBBoxMap] = useAtom(bboxAtom);
  const pointing = useAtomValue(pointingAtom);
  const focus = useAtomValue(caretAtom);
  const [mtx, setMtx] = useAtom(mtxAtom);
  const [canvasScale, setCanvasScale] = useState<number>(devicePixelRatio);
  const [canvasSize, setCanvasSize] = useState<Size>(ref.current!);
  const [windowSize, setWindowSize] = useState<Size>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const resizeHandler = useCallback((size: Size) => setWindowSize(size), []);
  useResizeHandler(resizeHandler);

  useEffect(() => {
    resizeCanvas(ref.current!, canvasScale, windowSize);
    setCanvasSize(scaleSize(windowSize, canvasScale));
  }, [canvasScale, windowSize]);

  useEffect(() => {
    // TODO 他のcanvasでも使いたいので上の階層でやる
    determineCanvasScale(devicePixelRatio, windowSize).then((scale) => {
      console.log("dpr", devicePixelRatio, "canvas scale", scale);
      setCanvasScale(scale);
    });
  }, [windowSize]);

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
      const {
        width,
        element: { type },
        caretOption,
        bbox: _bbox,
        index: elIdx,
      } = style;
      const b = { bbox: offsetBBox(_bbox, { x: cursor }), elIdx };
      bboxMap.get(id)?.push(b) ?? bboxMap.set(id, [b]);
      setBBoxMap(new Map(bboxMap));
      if (caretOption) {
        const caret = determineCaretStyle(caretOption, width, cursor);
        caretStyles.push(caret);
      }
      if (type !== "staff" && type !== "beam" && type !== "tie") {
        cursor += width;
      }
    }
    setCaretStyle(caretStyles);
  }, [styleMap, focus]);

  // paint
  useEffect(() => {
    const styles = styleMap.get(focus.staffId);
    if (!styles) {
      return;
    }
    const ctx = ref.current?.getContext("2d")!;
    ctx.save();
    resetCanvas2({ ctx, fillStyle: "white" });
    // pointer handlerでdpr考慮しなくて済むように
    ctx.scale(canvasScale, canvasScale);
    const { a, b, c, d, e, f } = mtx;
    ctx.transform(a, b, c, d, e, f);
    for (const [id, staff] of staffMap.entries()) {
      ctx.save();
      ctx.translate(staff.position.x, staff.position.y);
      // paintStaff(ctx, staff);
      for (const style of styleMap.get(id) ?? []) {
        const { type } = style.element;
        paintStyle(ctx, style);
        paintBBox(ctx, style.bbox, type === "staff" ? "blue" : undefined); // debug
        if (type !== "staff" && type !== "beam" && type !== "tie") {
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
  }, [mtx, staffMap, styleMap, caretStyle, focus, canvasSize]);

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
  const styleMap = useAtomValue(elementMapAtom);
  const [tmpMtx, setTmpMtx] = useState<DOMMatrix>();
  const [doubleZoomTimer, setDoubleZoomTimer] = useState<number>(-1);
  const [doubleZoomPoint, setDoubleZoomPoint] = useState<Point>();
  const [dragStaff, setDragStaff] = useState<{ id: number; offset: Point }>();

  useEffect(() => {
    console.log("2024/01/28", "hoge", dragStaff);
  }, [dragStaff]);

  const onDown = useCallback(
    (ev: React.PointerEvent) => {
      setTmpMtx(mtx);
      const point = mtx
        .inverse()
        .transformPoint({ x: ev.clientX, y: ev.clientY });
      if (doubleZoomTimer > -1) {
        window.clearTimeout(doubleZoomTimer);
        setDoubleZoomTimer(-1);
        setDoubleZoomPoint(point);
      } else {
        const dndStaff = () => {
          setDoubleZoomTimer(-1);
          // TODO styleMapをなめてbboxを取得するのは効率が悪い
          // staffごとのpaint style objを定義して、ルートにstaffstyleを置いて
          // bboxをすぐ引けるようにする
          const style = Array.from(styleMap.entries()).find(
            (v): v is [number, PaintElementStyle<StaffStyle>[]] => {
              const [_, styles] = v;
              const staff = styles.find(
                (style): style is PaintElementStyle<StaffStyle> =>
                  style.element.type === "staff"
              );
              if (staff) {
                const bb = offsetBBox(staff.bbox, staff.element.position);
                return isPointInBBox(point, bb);
              }
              return false;
            }
          );
          if (style) {
            const id = style[0];
            const staffStyle = style[1][0].element;
            const offset = {
              x: point.x - staffStyle.position.x,
              y: point.y - staffStyle.position.y,
            };
            // const offset = addPoint(point, scalePoint(staffStyle.position, -1));
            setDragStaff({ id, offset });
          }
        };
        setDoubleZoomTimer(
          window.setTimeout(dndStaff, kDoubleClickThresholdMs)
        );
      }
    },
    [mtx, doubleZoomTimer, styleMap]
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
      if (dragStaff !== undefined) {
        const staff = staffMap.get(dragStaff.id)!;
        const point = mtx.inverse().transformPoint({
          x: ev.clientX,
          y: ev.clientY,
        });
        staff.position = addPoint(point, scalePoint(dragStaff.offset, -1));
        setStaffMap(new Map(staffMap));
        return;
      }
      const dx = (ev.clientX - down.clientX) / tmpMtx.a;
      const dy = (ev.clientY - down.clientY) / tmpMtx.a;
      setMtx(tmpMtx.translate(dx, dy));
    },
    [mtx, tmpMtx, doubleZoomPoint, dragStaff, staffMap]
  );

  const onUp = useCallback(() => {
    setTmpMtx(undefined);
    setDoubleZoomPoint(undefined);
    setDragStaff(undefined);
  }, []);

  const onDoubleClick = useCallback(
    (ev: React.PointerEvent) => {
      staffMap.set(
        staffId++,
        genStaffStyle(
          { type: "staff", clef: { type: "clef", pitch: "g" }, lineCount: 5 },
          mtx.inverse().transformPoint({ x: ev.clientX, y: ev.clientY })
        )
      );
      setStaffMap(new Map(staffMap));
    },
    [staffMap, mtx]
  );

  return {
    onTouchEnd: (ev: React.TouchEvent<HTMLCanvasElement>) => {
      // iOS Safariでダブルタップ長押し時に拡大鏡が出るのを防ぐ
      ev.preventDefault();
    },
    ...usePointerHandler({
      onDown,
      onDrag,
      onUp,
      onDoubleClick,
    }),
  };
};
