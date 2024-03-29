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
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  caretAtom,
  caretStyleAtom,
  elementsAtom,
  contextMenuAtom,
  useStaffs,
} from "./atom";
import {
  kDoubleClickThresholdMs,
  usePointerHandler,
  useResizeHandler,
} from "./hooks";
import { determineCanvasScale, resizeCanvas } from "./util";
import { ContextMenu } from "./ContextMenu";
import { Dialog } from "./Dialog";
import { setCarets } from "./org/score-states";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elements = useAtomValue(elementsAtom);
  const [styleMap, setStyleMap] = useAtom(elementMapAtom);
  const [caretStyle, setCaretStyle] = useAtom(caretStyleAtom);
  const [bboxMap, setBBoxMap] = useAtom(bboxAtom);
  const pointing = useAtomValue(pointingAtom);
  const focus = useAtomValue(caretAtom);
  const [mtx, setMtx] = useAtom(mtxAtom);
  const [canvasScale, setCanvasScale] = useState<number>(devicePixelRatio);
  const [canvasSize, setCanvasSize] = useState<Size>(canvasRef.current!);
  const [windowSize, setWindowSize] = useState<Size>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const staffs = useStaffs();

  const resizeHandler = useCallback((size: Size) => setWindowSize(size), []);
  useResizeHandler(resizeHandler);

  useEffect(() => {
    resizeCanvas(canvasRef.current!, canvasScale, windowSize);
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
    const map = new Map<number, PaintElementStyle<PaintElement>[]>();
    for (const [id, staff] of staffs.map) {
      const styles = determinePaintElementStyle(
        elements.get(id) ?? [],
        UNIT,
        staff,
        pointing
      );
      map.set(id, styles);
    }
    console.log("new style map", map);
    setStyleMap(map);
  }, [staffs.map, elements, pointing]);

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
    const ctx = canvasRef.current?.getContext("2d")!;
    ctx.save();
    resetCanvas2({ ctx, fillStyle: "white" });
    // pointer handlerでdpr考慮しなくて済むように
    ctx.scale(canvasScale, canvasScale);
    const { a, b, c, d, e, f } = mtx;
    ctx.transform(a, b, c, d, e, f);
    for (const [id, staff] of staffs.map) {
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
    const currentStaff = staffs.get(focus.staffId);
    const caret = caretStyle.at(focus.idx);
    if (currentStaff && caret) {
      ctx.save();
      ctx.translate(currentStaff.position.x, currentStaff.position.y);
      paintCaret({ ctx, scale: 1, caret });
      ctx.restore();
    }
    ctx.restore();
  }, [mtx, staffs, styleMap, caretStyle, focus, canvasSize]);

  return (
    <canvas
      id="mainCanvas"
      className="absolute"
      ref={canvasRef}
      {...useMainPointerHandler()}
    ></canvas>
  );
};

const useMainPointerHandler = () => {
  const [mtx, setMtx] = useAtom(mtxAtom);
  const styleMap = useAtomValue(elementMapAtom);
  const setPopover = useSetAtom(contextMenuAtom);
  const setCarets = useSetAtom(caretAtom);
  const [downMtx, setDownMtx] = useState<DOMMatrix>();
  const [doubleZoomTimer, setDoubleZoomTimer] = useState<number>(-1);
  const [doubleZoomPoint, setDoubleZoomPoint] = useState<Point>();
  const [dragStaff, setDragStaff] = useState<{ id: number; offset: Point }>();
  const staffs = useStaffs();
  const getStaffIdOnPoint = usePointingStaffId(styleMap);

  const dndStaff = useCallback(
    (desktopPoint: Point) => {
      const id = getStaffIdOnPoint(desktopPoint);
      const staffStyle = staffs.get(id);
      if (!staffStyle) {
        return;
      }
      const offset = {
        x: desktopPoint.x - staffStyle.position.x,
        y: desktopPoint.y - staffStyle.position.y,
      };
      setDragStaff({ id, offset });
    },
    [styleMap, getStaffIdOnPoint, staffs]
  );

  const onDown = useCallback(
    (ev: React.PointerEvent) => {
      setPopover(undefined);
      setDownMtx(mtx);
      const point = mtx
        .inverse()
        .transformPoint({ x: ev.clientX, y: ev.clientY });
      if (doubleZoomTimer > -1) {
        window.clearTimeout(doubleZoomTimer);
        setDoubleZoomTimer(-1);
        console.log("set doublezoompoint", point);
        setDoubleZoomPoint(point);
      } else {
        dndStaff(point);
        setDoubleZoomTimer(
          window.setTimeout(
            () => setDoubleZoomTimer(-1),
            kDoubleClickThresholdMs
          )
        );
      }
    },
    [mtx, doubleZoomTimer, styleMap, dndStaff]
  );

  const onLongDown = useCallback(
    (ev: React.PointerEvent) => {
      console.log("longdown", "doubleZoomPoint", doubleZoomPoint);
      if (doubleZoomPoint) {
        return;
      }
      const point = mtx
        .inverse()
        .transformPoint({ x: ev.clientX, y: ev.clientY });
      const id = getStaffIdOnPoint(point);
      if (id > -1) {
        // setDownMtx(undefined);
        dndStaff(point);
        setPopover({
          htmlPoint: { x: ev.clientX, y: ev.clientY },
          staffId: id,
        });
      }
    },
    [getStaffIdOnPoint, mtx, doubleZoomPoint]
  );

  const onDrag = useCallback(
    (ev: React.PointerEvent, down: React.PointerEvent) => {
      setPopover(undefined);
      if (!downMtx) {
        return;
      }
      if (doubleZoomPoint) {
        const scale = Math.exp((ev.clientY - down.clientY) / 100);
        setMtx(
          downMtx
            .translate(doubleZoomPoint.x, doubleZoomPoint.y)
            .scale(scale, scale)
            .translate(-doubleZoomPoint.x, -doubleZoomPoint.y)
        );
        return;
      }
      if (dragStaff !== undefined) {
        staffs.update(dragStaff.id, (staff) => {
          const point = mtx.inverse().transformPoint({
            x: ev.clientX,
            y: ev.clientY,
          });
          staff.position = addPoint(point, scalePoint(dragStaff.offset, -1));
          return staff;
        });
        return;
      }
      const dx = (ev.clientX - down.clientX) / downMtx.a;
      const dy = (ev.clientY - down.clientY) / downMtx.a;
      setMtx(downMtx.translate(dx, dy));
    },
    [mtx, downMtx, doubleZoomPoint, dragStaff, staffs]
  );

  const onUp = useCallback(() => {
    setDownMtx(undefined);
    setDoubleZoomPoint(undefined);
    setDragStaff(undefined);
  }, []);

  const onClick = useCallback(
    (ev: React.PointerEvent) => {
      const point = mtx
        .inverse()
        .transformPoint({ x: ev.clientX, y: ev.clientY });
      const id = getStaffIdOnPoint(point);
      if (id > -1) {
        setCarets({ staffId: id, idx: 0 });
      }
    },
    [mtx, getStaffIdOnPoint]
  );

  const onDoubleClick = useCallback(
    (ev: React.PointerEvent) => {
      staffs.add(
        genStaffStyle(
          { type: "staff", clef: { type: "clef", pitch: "g" }, lineCount: 5 },
          mtx.inverse().transformPoint({ x: ev.clientX, y: ev.clientY })
        )
      );
    },
    [staffs, mtx]
  );

  return {
    onTouchEnd: (ev: React.TouchEvent<HTMLCanvasElement>) => {
      // iOS Safariでダブルタップ長押し時に拡大鏡が出るのを防ぐ
      ev.preventDefault();
    },
    ...usePointerHandler({
      onDown,
      onLongDown,
      onDrag,
      onUp,
      onDoubleClick,
      onClick,
    }),
  };
};

const usePointingStaffId = (
  styleMap: Map<number, PaintElementStyle<PaintElement>[]>
): ((desktopPoint: Point) => number) => {
  return useCallback(
    (desktopPoint: Point): number => {
      return (
        Array.from(styleMap.entries()).find(
          (v): v is [number, PaintElementStyle<StaffStyle>[]] => {
            const [_, styles] = v;
            const staff = styles.find(
              (style): style is PaintElementStyle<StaffStyle> =>
                style.element.type === "staff"
            );
            if (staff) {
              const bb = offsetBBox(staff.bbox, staff.element.position);
              return isPointInBBox(desktopPoint, bb);
            }
            return false;
          }
        )?.[0] ?? -1
      );
    },
    [styleMap]
  );
};
