import { normalizeBeams } from "@/core/beam-2";
import { clefs, keySignatures } from "@/core/types";
import { bStaffHeight, UNIT } from "@/font/bravura";
import { useResizeHandler } from "@/hooks/hooks";
import { useObjIdMapAtom } from "@/hooks/map-atom";
import { determineFilePaintStyle } from "@/layout/file";
import { layoutCaret } from "@/layout/new/caret";
import { layoutStaff } from "@/layout/new/staff";
import { CaretLayout, Layout, LayoutType } from "@/layout/new/types";
import { getInitScale } from "@/layout/score-preferences";
import { buildConnectionStyle } from "@/layout/staff";
import {
  determineCaretStyle,
  determineStaffPaintStyle,
} from "@/layout/staff-element";
import { determineTextPaintStyle } from "@/layout/text";
import {
  CaretStyle,
  ConnectionStyle,
  PaintElement,
  PaintStyle,
  Pointing,
  RootObjStyle,
} from "@/layout/types";
import { determineCanvasScale, resizeCanvas } from "@/lib/canvas";
import {
  addPoint,
  BBox,
  distanceToLineSegment,
  isPointInBBox,
  offsetBBox,
  Point,
  scaleSize,
  Size,
  transformBBox,
} from "@/lib/geometry";
import { usePrevious } from "@/lib/hooks";
import { paint, paintBBox, paintCaret } from "@/paint/new/paint";
import { resetCanvas2 } from "@/paint/paint";
import { objectAtom, uiAtom, useFocusHighlighted } from "@/state/atom";
import { DesktopStateMachine, DesktopStateProps } from "@/state/desktop-state";
import { PointerEventStateMachine } from "@/state/pointer-state";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";

// obj id -> element style
const paintStyleMapAtom = atom<Map<number, PaintStyle<PaintElement>[]>>(
  new Map()
);

// obj id -> layout
const objLayoutMapAtom = atom<Map<number, Layout<"staff">>>(new Map());

// staff id -> element bboxes
const bboxAtom = atom<Map<number, { bbox: BBox; elIdx?: number }[]>>(new Map());

const pointingAtom = atom<Pointing | undefined>(undefined);

const mtxAtom = atom<DOMMatrix>(
  new DOMMatrix([getInitScale(), 0, 0, getInitScale(), 0, 0])
);

export const MainCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useAtom(objectAtom.elements);
  const [styleMap, setStyleMap] = useAtom(paintStyleMapAtom);
  const [objLayoutMap, setObjLayoutMap] = useAtom(objLayoutMapAtom);
  const connections = useObjIdMapAtom(objectAtom.connections);
  const rootObjIdConnections = useObjIdMapAtom(objectAtom.rootObjIdConnections);
  const uncommitedConnection = useAtomValue(
    objectAtom.uncommitedStaffConnection
  );
  const [caretStyle, setCaretStyle] = useAtom(uiAtom.caretStyle);
  const [caretLayout, setCaretLayout] = useAtom(uiAtom.caretLayout);
  const [bboxMap, setBBoxMap] = useAtom(bboxAtom);
  const pointing = useAtomValue(pointingAtom);
  const focus = useAtomValue(uiAtom.focus);
  const focusHighlighted = useFocusHighlighted(focus);
  const mtx = useAtomValue(mtxAtom);
  const beamMode = useAtomValue(uiAtom.beamMode);
  const [canvasScale, setCanvasScale] = useState<number>(devicePixelRatio);
  const [canvasSize, setCanvasSize] = useState<Size>(canvasRef.current!);
  const [windowSize, setWindowSize] = useState<Size>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const rootObjs = useObjIdMapAtom(objectAtom.rootObjMap);

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

  // compute layout
  useEffect(() => {
    const map = new Map<number, Layout<"staff">>();
    for (const [id, obj] of rootObjs.map) {
      if (obj.type === "staff") {
        map.set(
          id,
          layoutStaff({
            elements: elements.get(id) ?? [],
            gapWidth: UNIT,
            staffObj: obj,
            pointing,
          })
        );
      }
    }
    console.log("layout", map);
    setObjLayoutMap(map);
  }, [rootObjs.map, elements]);

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
        toPos = uncommitedConnection.toPosition;
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
            isUncommited: true,
            from: { position, width: fromStyle.width },
            to: { position: toPos },
          })
        );
      }
      const connectionIds = rootObjIdConnections.get(id);
      if (connectionIds === undefined) {
        continue;
      }
      for (const connectionId of connectionIds) {
        const connection = connections.get(connectionId);
        if (!connection) {
          continue;
        }
        const toPos = rootObjs.get(connection.to)?.position;
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
            isUncommited: false,
            id: connectionId,
            from: { position, width: fromStyle.width },
            to: { position: toPos, id: connection.to },
          })
        );
      }
    }

    console.log("new style map", map);
    setStyleMap(map);
  }, [
    rootObjs.map,
    connections.map,
    rootObjIdConnections.map,
    uncommitedConnection,
    elements,
    pointing,
  ]);

  // caret style 2
  useEffect(() => {
    const carets: CaretLayout[] = [];
    for (const [id, l] of objLayoutMap) {
      const _mtx = l.mtx;
      for (const layout of l.children) {
        if (layout.caret) {
          const mtx = _mtx.multiply(layout.mtx);
          const x = mtx.e;
          const y = mtx.f;
          const width = layout.bbs.width * mtx.a;
          const height = layout.bbs.height * mtx.d;
          carets.push(
            layoutCaret({
              caret: layout.caret,
              carettee: { x, y, width, height },
            })
          );
        }
      }
    }
    console.log("caret", carets);
    setCaretLayout(carets);
  }, [objLayoutMap, focus]);

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

  // paint layout
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d")!;
    ctx.save();
    resetCanvas2({ ctx, fillStyle: "white" });
    // pointer handlerでdpr考慮しなくて済むように
    ctx.scale(canvasScale, canvasScale);
    const { a, b, c, d, e, f } = mtx;
    ctx.transform(a, b, c, d, e, f);
    for (const [id, layout] of objLayoutMap) {
      paint({ layout, ctx });
      paintBBox({ layout, ctx });
    }
    const caret = caretLayout.at(focus.idx);
    if (caret) {
      paintCaret({ ctx, caret, highlighted: focusHighlighted });
    }
    ctx.restore();
  }, [mtx, objLayoutMap, canvasSize, caretLayout, focus, focusHighlighted]);

  // paint
  // useEffect(() => {
  //   const ctx = canvasRef.current?.getContext("2d")!;
  //   ctx.save();
  //   resetCanvas2({ ctx, fillStyle: "white" });
  //   // pointer handlerでdpr考慮しなくて済むように
  //   ctx.scale(canvasScale, canvasScale);
  //   const { a, b, c, d, e, f } = mtx;
  //   ctx.transform(a, b, c, d, e, f);
  //   for (const [id, obj] of rootObjs.map) {
  //     ctx.save();
  //     ctx.translate(obj.position.x, obj.position.y);
  //     for (const style of styleMap.get(id) ?? []) {
  //       const { type } = style.element;
  //       paintStyle(ctx, style);
  //       paintBBox(ctx, style.bbox);
  //       if (
  //         type !== "staff" &&
  //         type !== "beam" &&
  //         type !== "tie" &&
  //         type !== "connection"
  //       ) {
  //         ctx.translate(style.width, 0);
  //       }
  //     }
  //     ctx.restore();
  //   }
  //   const obj = rootObjs.get(focus.rootObjId);
  //   const caret = caretStyle.at(focus.idx);
  //   if (obj && caret) {
  //     ctx.save();
  //     ctx.translate(obj.position.x, obj.position.y);
  //     // paintCaret({ ctx, scale: 1, caret, highlighted: focusHighlighted });
  //     ctx.restore();
  //   }
  //   ctx.restore();
  // }, [
  //   mtx,
  //   rootObjs,
  //   styleMap,
  //   caretStyle,
  //   focus,
  //   focusHighlighted,
  //   canvasSize,
  // ]);
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
  const objLayoutMap = useAtomValue(objLayoutMapAtom);
  const setPopover = useSetAtom(uiAtom.contextMenu);
  const setCarets = useSetAtom(uiAtom.focus);
  const rootObjs = useObjIdMapAtom(objectAtom.rootObjMap);
  const connections = useObjIdMapAtom(objectAtom.connections);
  const rootObjIdConnections = useAtomValue(objectAtom.rootObjIdConnections);
  const setUncommitedConnection = useSetAtom(
    objectAtom.uncommitedStaffConnection
  );
  const getRootObjIdOnPoint = usePointingRootObjId();
  const lastKeySig = useAtomValue(uiAtom.lastKeySig);
  const lastClef = useAtomValue(uiAtom.lastClef);
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

  type Result = { ret: Layout<LayoutType>; child?: Result };

  const getObjOnPointRecursive = (
    desktopPoint: Point,
    layouts: Layout<LayoutType>[],
    parentMtx: DOMMatrix = new DOMMatrix()
  ) => {
    let ret: Result | undefined;
    for (const layout of layouts) {
      const mtx = parentMtx.multiply(layout.mtx);
      if (isPointInBBox(desktopPoint, transformBBox(layout.bbs, mtx))) {
        ret = { ret: layout };
        const child = getObjOnPointRecursive(
          desktopPoint,
          layout.children,
          mtx
        );
        if (child) {
          ret.child = child;
        }
      }
    }
    return ret;
  };

  const getRootObjOnPoint = (desktopPoint: Point) => {
    // root bboxを絞り込む
    const objId = objLayoutMap
      .entries()
      .find(([_, layout]) =>
        isPointInBBox(desktopPoint, transformBBox(layout.bbs, layout.mtx))
      )?.[0];
    if (objId === undefined) {
      return;
    }
    const parentMtx = objLayoutMap.get(objId)?.mtx;
    if (!parentMtx) {
      return;
    }
    const child = objLayoutMap
      .get(objId)
      ?.children.find((child) =>
        isPointInBBox(
          desktopPoint,
          transformBBox(child.bbs, parentMtx.multiply(child.mtx))
        )
      );
    // childに当たっていなければ無視
    if (!child) {
      return;
    }
    const obj = rootObjs.get(objId);
    if (!obj) {
      return;
    }
    const offset = {
      x: desktopPoint.x - obj.position.x,
      y: desktopPoint.y - obj.position.y,
    };
    console.log(
      "recursive",
      getObjOnPointRecursive(desktopPoint, objLayoutMap.values().toArray())
    );
    return {
      objType: "staff" as const,
      id: objId,
      offset,
      caretIdx: child.caret?.idx,
    };
  };

  desktopState.current.getRootObjOnPoint = getRootObjOnPoint;
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
        if (_v.element.isUncommited) {
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
          return { id: _v.element.id, from: id, to: _v.element.toId };
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
    const { id, rootObjId: from, point: toPosition } = args;
    if (!!id) {
      connections.remove(id);
    }
    setUncommitedConnection({ from, toPosition });
  };

  const onConnectRootObj = (args: DesktopStateProps["connectRootObj"]) => {
    const cId = connections.add(args);
    const r = rootObjIdConnections.get(args.from);
    rootObjIdConnections.set(args.from, [...(r ?? []), cId]);
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
          clef: lastClef ?? clefs.G,
          keySignature: lastKeySig ?? keySignatures.C,
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
  const rootObjs = useObjIdMapAtom(objectAtom.rootObjMap);
  return (
    desktopPoint: Point
  ): { rootObjId: number; caretIdx?: number } | void => {
    for (const [id, obj] of rootObjs.map) {
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
