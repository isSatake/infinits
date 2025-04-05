import { bStaffHeight, UNIT } from "@/font/bravura";
import {
  BBox,
  Point,
  Size,
  addPoint,
  distanceToLineSegment,
  isPointInBBox,
  offsetBBox,
  scaleSize,
} from "@/lib/geometry";
import { paintBBox, paintCaret, paintStyle, resetCanvas2 } from "@/paint/paint";
import { getInitScale } from "@/layout/score-preferences";
import {
  determineCaretStyle,
  determineStaffPaintStyle,
} from "@/layout/staff-element";
import {
  CaretStyle,
  ConnectionStyle,
  PaintElement,
  PaintStyle,
  Pointing,
  RootObjStyle,
} from "@/layout/types";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  caretStyleAtom,
  contextMenuAtom,
  elementsAtom,
  focusAtom,
  connectionAtom,
  uncommitedStaffConnectionAtom,
  useFocusHighlighted,
  beamModeAtom,
} from "@/state/atom";
import { DesktopStateMachine, DesktopStateProps } from "@/state/desktop-state";
import { useResizeHandler } from "@/hooks/hooks";
import { PointerEventStateMachine } from "@/state/pointer-state";
import { determineCanvasScale, resizeCanvas } from "@/lib/canvas";
import { buildConnectionStyle } from "@/layout/staff";
import { useRootObjects } from "@/hooks/root-obj";
import { determineTextPaintStyle } from "@/layout/text";
import { determineFilePaintStyle } from "@/layout/file";
import { usePrevious } from "@/lib/hooks";
import { normalizeBeams } from "@/core/beam-2";
import { keySignatures } from "@/core/types";

// obj id -> element style
const paintStyleMapAtom = atom<Map<number, PaintStyle<PaintElement>[]>>(
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
  const [elements, setElements] = useAtom(elementsAtom);
  const [styleMap, setStyleMap] = useAtom(paintStyleMapAtom);
  const connectionMap = useAtomValue(connectionAtom);
  const uncommitedConnection = useAtomValue(uncommitedStaffConnectionAtom);
  const [caretStyle, setCaretStyle] = useAtom(caretStyleAtom);
  const [bboxMap, setBBoxMap] = useAtom(bboxAtom);
  const pointing = useAtomValue(pointingAtom);
  const focus = useAtomValue(focusAtom);
  const focusHighlighted = useFocusHighlighted(focus);
  const mtx = useAtomValue(mtxAtom);
  const beamMode = useAtomValue(beamModeAtom);
  const [canvasScale, setCanvasScale] = useState<number>(devicePixelRatio);
  const [canvasSize, setCanvasSize] = useState<Size>(canvasRef.current!);
  const [windowSize, setWindowSize] = useState<Size>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const rootObjs = useRootObjects();

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
    const map = new Map<number, PaintStyle<PaintElement>[]>();
    for (const [id, obj] of rootObjs.map) {
      if (obj.type === "staff") {
        const styles = determineStaffPaintStyle({
          elements: elements.get(id) ?? [],
          gapWidth: UNIT,
          staffObj: obj,
          pointing,
        });
        map.set(id, styles);
      } else if (obj.type === "text") {
        map.set(id, [determineTextPaintStyle(obj)]);
      } else {
        map.set(id, [determineFilePaintStyle(obj)]);
      }
    }
    // connection
    for (const [id, { position }] of rootObjs.map) {
      let toPos;
      if (uncommitedConnection?.from === id) {
        toPos = uncommitedConnection.position;
        const fromStyle = map
          .get(id)
          ?.find(
            (style): style is PaintStyle<RootObjStyle> =>
              style.element.type === "staff" ||
              style.element.type === "text" ||
              style.element.type === "file"
          );
        if (!fromStyle) {
          continue;
        }
        map.get(id)?.push(
          buildConnectionStyle({
            from: { position, width: fromStyle.width },
            to: { position: toPos },
          })
        );
      }
      const connections = connectionMap.get(id);
      if (connections === undefined) {
        continue;
      }
      for (const toId of connections) {
        const toPos = rootObjs.get(toId)?.position;
        if (!toPos) {
          continue;
        }
        const fromStyle = map
          .get(id)
          ?.find(
            (style): style is PaintStyle<RootObjStyle> =>
              style.element.type === "staff" ||
              style.element.type === "text" ||
              style.element.type === "file"
          );
        if (!fromStyle) {
          continue;
        }
        map.get(id)?.push(
          buildConnectionStyle({
            from: { position, width: fromStyle.width },
            to: { position: toPos, id: toId },
          })
        );
      }
    }

    console.log("new style map", map);
    setStyleMap(map);
  }, [rootObjs.map, connectionMap, uncommitedConnection, elements, pointing]);

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
        const height = _bbox.bottom - _bbox.top;
        const caret = determineCaretStyle({
          option: caretOption,
          elWidth: width,
          height,
          leftOfCaret: cursor,
        });
        caretStyles.push(caret);
      }
      if (type !== "staff" && type !== "beam" && type !== "tie") {
        cursor += width;
      }
    }
    setCaretStyle(caretStyles);
  }, [styleMap, focus]);

  const prevBeamMode = usePrevious(beamMode);
  useEffect(() => {
    if (prevBeamMode !== beamMode) {
      console.log("beam mode", prevBeamMode, "->", beamMode);
      const newElements = elements.get(focus.rootObjId);
      if (newElements) {
        setElements(
          new Map(elements).set(focus.rootObjId, normalizeBeams(newElements))
        );
      }
    }
  }, [beamMode, focus, elements]);

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
        if (
          type !== "staff" &&
          type !== "beam" &&
          type !== "tie" &&
          type !== "connection"
        ) {
          ctx.translate(style.width, 0);
        }
      }
      ctx.restore();
    }
    const obj = rootObjs.get(focus.rootObjId);
    const caret = caretStyle.at(focus.idx);
    if (obj && caret) {
      ctx.save();
      ctx.translate(obj.position.x, obj.position.y);
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
  const styleMap = useAtomValue(paintStyleMapAtom);
  const setPopover = useSetAtom(contextMenuAtom);
  const setCarets = useSetAtom(focusAtom);
  const rootObjs = useRootObjects();
  const [connections, setConnections] = useAtom(connectionAtom);
  const setUncommitedConnection = useSetAtom(uncommitedStaffConnectionAtom);
  const getRootObjIdOnPoint = usePointingRootObjId();
  const desktopState = useRef(new DesktopStateMachine());
  const canvasHandler = useRef(
    new PointerEventStateMachine(desktopState.current.on)
  );

  useEffect(() => {
    desktopState.current.mtx = mtx;
  }, [mtx]);

  const dndStaff = (desktopPoint: Point) => {
    const ret = getRootObjIdOnPoint(desktopPoint);
    if (!ret) {
      return;
    }
    const { rootObjId: id, caretIdx } = ret;
    const style = rootObjs.get(id);
    if (!style) {
      return;
    }
    const offset = {
      x: desktopPoint.x - style.position.x,
      y: desktopPoint.y - style.position.y,
    };
    return { objType: style.type, id, offset, caretIdx };
  };

  desktopState.current.getRootObjOnPoint = dndStaff;
  desktopState.current.getConnectionOnPoint = (desktopPoint: Point) => {
    const connStyleMap = new Map<number, PaintStyle<ConnectionStyle>[]>();
    for (const [id, styles] of styleMap) {
      const connection = styles.filter(
        (v: PaintStyle<PaintElement>): v is PaintStyle<ConnectionStyle> =>
          v.element.type === "connection"
      );
      if (connection.length > 0) {
        connStyleMap.set(id, connection);
      }
    }
    for (const [id, v] of connStyleMap) {
      for (const _v of v) {
        if (_v.element.toId === undefined) {
          continue;
        }
        const d = distanceToLineSegment({
          point: desktopPoint,
          start: addPoint(_v.element.position, { x: 0, y: bStaffHeight / 2 }),
          end: addPoint(
            _v.element.position,
            addPoint(_v.element.to, { x: 0, y: bStaffHeight / 2 })
          ),
        });
        if (!!d && d < bStaffHeight / 2) {
          return { from: id, to: _v.element.toId };
        }
      }
    }
  };
  desktopState.current.isPointingRootObjTail = (
    desktopPoint: Point,
    rootObjId: number
  ) => {
    const obj = rootObjs.get(rootObjId);
    if (!obj) {
      return false;
    }
    const objWidth =
      styleMap
        .get(rootObjId)
        ?.find(
          (style) =>
            style.element.type === "staff" ||
            style.element.type === "text" ||
            style.element.type === "file"
        )?.width ?? 0;
    return desktopPoint.x > obj.position.x + objWidth - UNIT;
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
    const { isNew, rootObjId: from, point: position } = args;
    if (!isNew) {
      connections.delete(from);
      setConnections(connections);
    }
    setUncommitedConnection({ from, position });
  };

  const onConnectRootObj = (args: DesktopStateProps["connectRootObj"]) => {
    const { from, to } = args;
    const v: number[] = connections.get(from) ?? [];
    if (v.includes(to)) {
      return;
    }
    v.push(to);
    connections.set(from, v);
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
    ({ rootObjId, caretIdx }: DesktopStateProps["focusRootObj"]) => {
      if (rootObjId > -1) {
        setCarets({ rootObjId, idx: caretIdx ?? 0 });
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
    ({ point: position }: DesktopStateProps["addStaff"]) => {
      rootObjs.add({
        type: "staff",
        position,
        staff: {
          type: "staff",
          clef: { type: "clef", pitch: "g" },
          keySignature: keySignatures["G"],
        },
      });
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
      case "connectRootObj":
        onConnectRootObj(state);
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

const usePointingRootObjId = (): ((desktopPoint: Point) => {
  rootObjId: number;
  caretIdx?: number;
} | void) => {
  const styleMap = useAtomValue(paintStyleMapAtom);
  const objs = useRootObjects();
  return (
    desktopPoint: Point
  ): { rootObjId: number; caretIdx?: number } | void => {
    for (const [id, obj] of objs.map) {
      const styles = styleMap.get(id);
      if (!styles) {
        continue;
      }
      const style = styles.find(
        (style): style is PaintStyle<RootObjStyle> =>
          style.element.type === "staff" ||
          style.element.type === "text" ||
          style.element.type === "file"
      );
      if (style) {
        const bb = offsetBBox(style.bbox, obj.position);
        if (isPointInBBox(desktopPoint, bb)) {
          let left = 0;
          for (let i in styles) {
            const s = styles[i];
            if (
              s.element.type !== "staff" &&
              s.element.type !== "beam" &&
              s.element.type !== "connection"
            ) {
              if (
                s.caretOption &&
                isPointInBBox(
                  desktopPoint,
                  offsetBBox(s.bbox, {
                    x: obj.position.x + left,
                    y: obj.position.y,
                  })
                )
              ) {
                return { rootObjId: id, caretIdx: s.caretOption.idx };
              }
              left += s.width;
            }
          }
          return { rootObjId: id };
        }
      }
    }
  };
};
