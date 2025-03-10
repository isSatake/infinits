import { UNIT } from "@/font/bravura";
import {
  BBox,
  Point,
  Size,
  isPointInBBox,
  offsetBBox,
  scaleSize,
} from "@/lib/geometry";
import { paintBBox, paintCaret, paintStyle, resetCanvas2 } from "@/paint/paint";
import { getInitScale } from "@/style/score-preferences";
import {
  determineCaretStyle,
  determinePaintElementStyle,
  genStaffStyle,
} from "@/style/style";
import {
  CaretStyle,
  PaintElement,
  PaintElementStyle,
  Pointing,
} from "@/style/types";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  caretStyleAtom,
  contextMenuAtom,
  elementsAtom,
  focusAtom,
  staffConnectionAtom,
  uncommitedStaffConnectionAtom,
  useFocusHighlighted,
} from "@/state/atom";
import { DesktopStateMachine, DesktopStateProps } from "@/state/desktop-state";
import { useResizeHandler } from "@/hooks/hooks";
import { PointerEventStateMachine } from "@/state/pointer-state";
import { StaffStyle } from "@/style/types";
import { determineCanvasScale, resizeCanvas } from "@/lib/canvas";
import { useStaffs } from "@/hooks/staff";
import { buildConnectionStyle } from "@/style/staff";

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
  const staffConnection = useAtomValue(staffConnectionAtom);
  const uncommitedConnection = useAtomValue(uncommitedStaffConnectionAtom);
  const [caretStyle, setCaretStyle] = useAtom(caretStyleAtom);
  const [bboxMap, setBBoxMap] = useAtom(bboxAtom);
  const pointing = useAtomValue(pointingAtom);
  const focus = useAtomValue(focusAtom);
  const focusHighlighted = useFocusHighlighted(focus);
  const mtx = useAtomValue(mtxAtom);
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
    // connection
    for (const [id, _] of staffs.map) {
      let toPos;
      if (uncommitedConnection?.from === id) {
        toPos = uncommitedConnection.position;
      } else {
        const toId = staffConnection.get(id);
        if (toId === undefined) {
          continue;
        }
        toPos = staffs.get(toId)?.position;
      }
      if (!toPos) {
        continue;
      }
      const fromStyle = map
        .get(id)
        ?.find(
          (style): style is PaintElementStyle<StaffStyle> =>
            style.element.type === "staff"
        );
      if (!fromStyle) {
        continue;
      }
      map.get(id)?.push(buildConnectionStyle(fromStyle, toPos));
    }
    console.log("new style map", map);
    setStyleMap(map);
  }, [staffs.map, staffConnection, uncommitedConnection, elements, pointing]);

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
      for (const style of styleMap.get(id) ?? []) {
        const { type } = style.element;
        paintStyle(ctx, style);
        paintBBox(ctx, style.bbox);
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
      paintCaret({ ctx, scale: 1, caret, highlighted: focusHighlighted });
      ctx.restore();
    }
    ctx.restore();
  }, [mtx, staffs, styleMap, caretStyle, focus, focusHighlighted, canvasSize]);

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
  const setCarets = useSetAtom(focusAtom);
  const staffs = useStaffs();
  const [connections, setConnections] = useAtom(staffConnectionAtom);
  const setUncommitedConnection = useSetAtom(uncommitedStaffConnectionAtom);
  const getStaffIdOnPoint = usePointingStaffId(styleMap);
  const desktopState = useRef(new DesktopStateMachine());
  const canvasHandler = useRef(
    new PointerEventStateMachine(desktopState.current.on)
  );

  useEffect(() => {
    desktopState.current.mtx = mtx;
  }, [mtx]);

  const dndStaff = (desktopPoint: Point) => {
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
  };

  desktopState.current.getStaffOnPoint = dndStaff;
  desktopState.current.isPointingStaffTail = (
    desktopPoint: Point,
    staffId: number
  ) => {
    const staffStyle = staffs.get(staffId);
    if (!staffStyle) {
      return false;
    }
    const staffWidth =
      styleMap.get(staffId)?.reduce((acc, style) => {
        return style.element.type !== "staff" &&
          style.element.type !== "beam" &&
          style.element.type !== "tie"
          ? (acc += style.width)
          : 0;
      }, 0) ?? 0;
    return isPointInBBox(
      desktopPoint,
      offsetBBox(
        {
          left: staffWidth * 0.7,
          right: staffWidth,
          top: 0,
          bottom: staffStyle.lines.length * UNIT,
        },
        staffStyle.position
      )
    );
  };

  const onIdle = useCallback(() => {
    setUncommitedConnection(undefined);
  }, []);

  const onMoveStaff = useCallback(
    (args: DesktopStateProps["moveStaff"]) => {
      const { staffId, point, offset } = args;
      const position = { x: point.x - offset.x, y: point.y - offset.y };
      staffs.update(staffId, (style) => ({ ...style, position }));
    },
    [staffs]
  );

  const onMoveConnection = (args: DesktopStateProps["moveConnection"]) => {
    const { staffId, point: position } = args;
    connections.delete(staffId);
    setConnections(connections);
    setUncommitedConnection({ from: staffId, position });
  };

  const onConnectStaff = (args: DesktopStateProps["connectStaff"]) => {
    const { from, to } = args;
    connections.set(from, to);
    setConnections(connections);
    setUncommitedConnection(undefined);
  };

  const onCtxMenuStaff = useCallback(
    ({ staffId, htmlPoint }: DesktopStateProps["ctxMenuStaff"]) => {
      setPopover({ type: "staff", htmlPoint, staffId });
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

  const onCtxMenu = ({ htmlPoint }: DesktopStateProps["ctxMenu"]) => {
    setPopover({ type: "canvas", htmlPoint });
  };

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
      case "moveConnection":
        onMoveConnection(state);
        break;
      case "connectStaff":
        onConnectStaff(state);
        break;
      case "ctxMenu":
        onCtxMenu(state);
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

const getStaffElementAtPoint = (
  staffId: number,
  styles: PaintElementStyle<PaintElement>[],
  desktopPoint: Point
): number => {
  const staff = styles.find(
    (style): style is PaintElementStyle<StaffStyle> =>
      style.element.type === "staff"
  );
  if (!staff) {
    return -1;
  }
  const bb = offsetBBox(staff.bbox, staff.element.position);
  if (!isPointInBBox(desktopPoint, bb)) {
    return -1;
  }
  let cursor = 0;
  for (let i in styles) {
    const style = styles[i];
    const { width, element } = style;
    if (
      element.type !== "staff" &&
      element.type !== "beam" &&
      element.type !== "tie"
    ) {
      cursor += width;
    }
    if (isPointInBBox(desktopPoint, offsetBBox(style.bbox, { x: cursor }))) {
      return Number(i);
    }
  }
  return -1;
};
