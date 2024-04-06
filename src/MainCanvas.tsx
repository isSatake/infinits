import { UNIT } from "@/org/font/bravura";
import {
  BBox,
  Point,
  Size,
  isPointInBBox,
  offsetBBox,
  scaleSize,
} from "@/org/geometry";
import { paintBBox, paintCaret, paintStyle, resetCanvas2 } from "@/org/paint";
import { getInitScale } from "@/org/score-preferences";
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
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  caretAtom,
  caretStyleAtom,
  contextMenuAtom,
  elementsAtom,
  useStaffs,
} from "./atom";
import { useResizeHandler } from "./hooks";
import { StaffStyle } from "./org/style/types";
import { PointerEventStateMachine } from "./state-machine";
import { determineCanvasScale, resizeCanvas } from "./util";

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
  const [dragStaff, setDragStaff] = useState<{ id: number; offset: Point }>();
  const staffs = useStaffs();
  const getStaffIdOnPoint = usePointingStaffId(styleMap);
  const canvasHandler = useRef(new PointerEventStateMachine());
  const staffHandler = useRef(new PointerEventStateMachine());

  useEffect(() => {
    canvasHandler.current.onIdle = () => {
      console.log("CanvasState", "idle");
      setDownMtx(undefined);
    };
    staffHandler.current.onIdle = () => {
      console.log("StaffState", "idle");
      setDragStaff(undefined);
    };
  }, []);

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
      return { id, offset };
    },
    [styleMap, getStaffIdOnPoint, staffs]
  );

  useEffect(() => {
    // 気になる
    const onDown = (forStaff: boolean) => (point: Point) => {
      const ret = dndStaff(mtx.inverse().transformPoint(point));
      if (ret) {
        setDragStaff(ret);
        return forStaff;
      }
      setDownMtx(mtx);
      return !forStaff;
    };
    canvasHandler.current.onDown = (point: Point) => {
      console.log("CanvasState", "down");
      setPopover(undefined);
      return onDown(false)(point);
    };
    staffHandler.current.onDown = (point: Point) => {
      console.log("StaffState", "down");
      return onDown(true)(point);
    };
  }, [mtx, dndStaff]);

  useEffect(() => {
    staffHandler.current.onSingleMove = (
      dx: number,
      dy: number,
      _point: Point,
      down: Point
    ) => {
      console.log("StaffState", "move");
      if (!dragStaff) {
        return;
      }
      const { id, offset } = dragStaff;
      const point = mtx.inverse().transformPoint(_point);
      staffs.update(id, (style) => {
        return {
          ...style,
          position: { x: point.x - offset.x, y: point.y - offset.y },
        };
      });
    };
  }, [dragStaff]);

  useEffect(() => {
    staffHandler.current.onLongDown = (point: Point) => {
      console.log("StaffState", "long down");
      const id = getStaffIdOnPoint(mtx.inverse().transformPoint(point));
      if (id > -1) {
        setPopover({ htmlPoint: point, staffId: id });
      }
    };
  }, [getStaffIdOnPoint]);

  useEffect(() => {
    canvasHandler.current.onClick = (_point: Point) => {
      console.log("CanvasState", "click");
      const point = mtx.inverse().transformPoint(_point);
      const id = getStaffIdOnPoint(point);
      if (id > -1) {
        setCarets({ staffId: id, idx: 0 });
      }
    };
  }, [mtx, getStaffIdOnPoint]);

  useEffect(() => {
    canvasHandler.current.onSingleMove = (
      _dx: number,
      _dy: number,
      down: Point
    ) => {
      console.log("CanvasState", "pan");
      if (!downMtx) {
        return;
      }
      const dx = _dx / downMtx.a;
      const dy = _dy / downMtx.a;
      setMtx(downMtx.translate(dx, dy));
    };
  }, [mtx, downMtx]);

  useEffect(() => {
    canvasHandler.current.onDoubleZoom = (point: Point, dz: number) => {
      console.log("CanvasState", "zoom");
      if (!downMtx) {
        return;
      }
      const scale = Math.exp(dz / 100);
      const origin = downMtx.inverse().transformPoint(point);
      setMtx(
        downMtx
          .translate(origin.x, origin.y)
          .scale(scale, scale)
          .translate(-origin.x, -origin.y)
      );
    };
  }, [downMtx]);

  useEffect(() => {
    canvasHandler.current.onDoubleClick = (point: Point) => {
      console.log("CanvasState", "add staff");
      staffs.add(
        genStaffStyle(
          { type: "staff", clef: { type: "clef", pitch: "g" }, lineCount: 5 },
          mtx.inverse().transformPoint(point)
        )
      );
    };
  }, [mtx, staffs]);

  return {
    onTouchEnd: (ev: React.TouchEvent<HTMLCanvasElement>) => {
      // iOS Safariでダブルタップ長押し時に拡大鏡が出るのを防ぐ
      ev.preventDefault();
    },
    onPointerDown: (ev: React.PointerEvent) => {
      canvasHandler.current.on("down", ev);
      staffHandler.current.on("down", ev);
    },
    onPointerMove: (ev: React.PointerEvent) => {
      canvasHandler.current.on("move", ev);
      staffHandler.current.on("move", ev);
    },
    onPointerUp: (ev: React.PointerEvent) => {
      canvasHandler.current.on("up", ev);
      staffHandler.current.on("up", ev);
    },
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
