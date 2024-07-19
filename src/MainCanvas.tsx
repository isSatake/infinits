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
import { PointerEventStateMachine } from "./pointer-state";
import { determineCanvasScale, resizeCanvas } from "./util";
import { DesktopStateMachine, DesktopStateProps } from "./desktop-state";

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
      const styles = determinePaintElementStyle({
        elements: elements.get(id) ?? [],
        gapWidth: UNIT,
        staffStyle: staff,
        pointing,
      });
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
  const staffs = useStaffs();
  const getStaffIdOnPoint = usePointingStaffId(styleMap);
  const desktopState = useRef(new DesktopStateMachine());
  const canvasHandler = useRef(
    new PointerEventStateMachine(desktopState.current.on)
  );

  useEffect(() => {
    desktopState.current.mtx = mtx;
  }, [mtx]);

  const dndStaff = useCallback(
    (desktopPoint: Point) => {
      const staffId = getStaffIdOnPoint(desktopPoint);
      const staffStyle = staffs.get(staffId);
      if (!staffStyle) {
        return;
      }
      const offset = {
        x: desktopPoint.x - staffStyle.position.x,
        y: desktopPoint.y - staffStyle.position.y,
      };
      return { staffId, offset };
    },
    [getStaffIdOnPoint, staffs]
  );

  useEffect(() => {
    desktopState.current.getStaffOnPoint = dndStaff;
  }, [dndStaff]);

  const onIdle = useCallback(() => {
    console.log("CanvasState", "idle");
    setPopover(undefined);
  }, []);

  const onMoveStaff = useCallback(
    (args: DesktopStateProps["moveStaff"]) => {
      const { staffId, point, offset } = args;
      const position = { x: point.x - offset.x, y: point.y - offset.y };
      staffs.update(staffId, (style) => ({ ...style, position }));
    },
    [staffs]
  );

  const onCtxMenuStaff = useCallback(
    ({ staffId, htmlPoint }: DesktopStateProps["ctxMenuStaff"]) => {
      setPopover({ htmlPoint, staffId });
    },
    []
  );

  const onFocusStaff = useCallback(
    ({ staffId }: DesktopStateProps["focusStaff"]) => {
      if (staffId > -1) {
        setCarets({ staffId, idx: 0 });
      }
    },
    []
  );

  const onPan = useCallback(({ translated }: DesktopStateProps["pan"]) => {
    console.log("CanvasState", "pan");
    setMtx(translated);
  }, []);

  const onZoom = useCallback(({ translated }: DesktopStateProps["zoom"]) => {
    console.log("CanvasState", "zoom");
    setMtx(translated);
  }, []);

  const onAddStaff = useCallback(
    ({ point }: DesktopStateProps["addStaff"]) => {
      staffs.add(
        genStaffStyle(
          { type: "staff", clef: { type: "clef", pitch: "g" }, lineCount: 5 },
          point
        )
      );
    },
    [staffs]
  );

  useEffect(() => {
    desktopState.current.onState = (state) => {
      switch (state.type) {
        case "idle":
          onIdle();
          break;
        case "downCanvas":
          break;
        case "addStaff":
          onAddStaff(state);
          break;
        case "focusStaff":
          onFocusStaff(state);
          break;
        case "moveStaff":
          onMoveStaff(state);
          break;
        case "ctxMenuStaff":
          onCtxMenuStaff(state);
          break;
        case "pan":
          onPan(state);
          break;
        case "zoom":
          onZoom(state);
          break;
      }
    };
  }, [onAddStaff, onMoveStaff]);

  return {
    onTouchEnd: (ev: React.TouchEvent<HTMLCanvasElement>) => {
      // iOS Safariでダブルタップ長押し時に拡大鏡が出るのを防ぐ
      ev.preventDefault();
    },
    onPointerDown: (ev: React.PointerEvent) => {
      canvasHandler.current.on("down", ev);
    },
    onPointerMove: (ev: React.PointerEvent) => {
      canvasHandler.current.on("move", ev);
    },
    onPointerUp: (ev: React.PointerEvent) => {
      canvasHandler.current.on("up", ev);
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
