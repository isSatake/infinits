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
  RootObj,
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
import { buildConnectionStyle } from "@/style/staff";
import { useObjects } from "@/hooks/object";

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
  const rootObjs = useObjects();

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
    for (const [id, obj] of rootObjs.map) {
      if (obj.type === "staff") {
        const styles = determinePaintElementStyle({
          elements: elements.get(id) ?? [],
          gapWidth: UNIT,
          staffStyle: obj,
          pointing,
        });
        map.set(id, styles);
      } else {
        map.set(id, [
          {
            element: obj,
            width: 0,
            bbox: { left: 0, right: 1000, top: 0, bottom: 1000 },
          },
        ]);
      }
    }
    // connection
    for (const [id, _] of rootObjs.map) {
      let toPos;
      if (uncommitedConnection?.from === id) {
        toPos = uncommitedConnection.position;
      } else {
        const toId = staffConnection.get(id);
        if (toId === undefined) {
          continue;
        }
        toPos = rootObjs.get(toId)?.position;
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
  }, [rootObjs.map, staffConnection, uncommitedConnection, elements, pointing]);

  // caret style
  useEffect(() => {
    const id = focus.rootObjId;
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
    for (const [id, obj] of rootObjs.map) {
      ctx.save();
      ctx.translate(obj.position.x, obj.position.y);
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
    const currentStaff = rootObjs.get(focus.rootObjId);
    const caret = caretStyle.at(focus.idx);
    if (currentStaff && caret) {
      ctx.save();
      ctx.translate(currentStaff.position.x, currentStaff.position.y);
      paintCaret({ ctx, scale: 1, caret, highlighted: focusHighlighted });
      ctx.restore();
    }
    ctx.restore();
  }, [
    mtx,
    rootObjs,
    styleMap,
    caretStyle,
    focus,
    focusHighlighted,
    canvasSize,
  ]);

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
  const rootObjs = useObjects();
  const [connections, setConnections] = useAtom(staffConnectionAtom);
  const setUncommitedConnection = useSetAtom(uncommitedStaffConnectionAtom);
  const getRootObjIdOnPoint = usePointingRootObjId(styleMap);
  const desktopState = useRef(new DesktopStateMachine());
  const canvasHandler = useRef(
    new PointerEventStateMachine(desktopState.current.on)
  );

  useEffect(() => {
    desktopState.current.mtx = mtx;
  }, [mtx]);

  const dndStaff = (desktopPoint: Point) => {
    const id = getRootObjIdOnPoint(desktopPoint);
    const style = rootObjs.get(id);
    if (!style) {
      return;
    }
    const offset = {
      x: desktopPoint.x - style.position.x,
      y: desktopPoint.y - style.position.y,
    };
    return { objType: style.type, id, offset };
  };

  desktopState.current.getRootObjOnPoint = dndStaff;
  desktopState.current.isPointingStaffTail = (
    desktopPoint: Point,
    staffId: number
  ) => {
    const style = rootObjs.get(staffId);
    if (!style || style.type !== "staff") {
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
          bottom: style.lines.length * UNIT,
        },
        style.position
      )
    );
  };

  const onIdle = useCallback(() => {
    setUncommitedConnection(undefined);
  }, []);

  const onMoveRootObj = useCallback(
    (args: DesktopStateProps["moveRootObj"]) => {
      const { id, point, offset } = args;
      const position = { x: point.x - offset.x, y: point.y - offset.y };
      rootObjs.update(id, (style) => ({ ...style, position }));
    },
    [rootObjs]
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

  const onFocusRootObj = useCallback(
    ({ rootObjId }: DesktopStateProps["focusRootObj"]) => {
      if (rootObjId > -1) {
        setCarets({ rootObjId, idx: 0 });
      }
    },
    []
  );

  const onCtxMenu = (props: DesktopStateProps["ctxMenu"]) => {
    setPopover({
      type: "canvas",
      htmlPoint: props.htmlPoint,
      desktopPoint: props.desktopPoint,
    });
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
      rootObjs.add(
        genStaffStyle(
          { type: "staff", clef: { type: "clef", pitch: "g" }, lineCount: 5 },
          point
        )
      );
    },
    [rootObjs]
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
      case "focusRootObj":
        onFocusRootObj(state);
        break;
      case "moveRootObj":
        onMoveRootObj(state);
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

const usePointingRootObjId = (
  styleMap: Map<number, PaintElementStyle<PaintElement>[]>
): ((desktopPoint: Point) => number) => {
  return useCallback(
    (desktopPoint: Point): number => {
      return (
        Array.from(styleMap.entries()).find(
          (v): v is [number, PaintElementStyle<RootObj>[]] => {
            const [_, styles] = v;
            const style = styles.find(
              (style): style is PaintElementStyle<RootObj> =>
                style.element.type === "staff" ||
                style.element.type === "text" ||
                style.element.type === "file"
            );
            if (style) {
              const bb = offsetBBox(style.bbox, style.element.position);
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
