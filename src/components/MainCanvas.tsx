import { useResizeHandler } from "@/hooks/hooks";
import { useMainPointerHandler } from "@/hooks/main-canvas";
import { useObjMapAtom } from "@/hooks/root-obj";
import { determineFilePaintStyle } from "@/layout/file";
import { createScoreNode } from "@/layout/score";
import { createStaffNode } from "@/layout/staff-element";
import { determineTextPaintStyle } from "@/layout/text";
import { PaintNode, PaintNodeMap, RootPaintNodeType } from "@/layout/types";
import { determineCanvasScale, resizeCanvas } from "@/lib/canvas";
import { scaleSize, Size } from "@/lib/geometry";
import { StaffObject } from "@/object";
import { paint } from "@/paint/paint";
import {
  caretStyleAtom,
  connectionAtom,
  focusAtom,
  mtxAtom,
  rootPaintNodeMapAtom,
  pointingAtom,
  rootObjMapAtom,
  scoreStaffMapAtom,
  staffElementsMapAtom,
  staffObjMapAtom,
  uncommitedStaffConnectionAtom,
  useFocusHighlighted,
} from "@/state/atom";
import { useAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";

export const MainCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elements = useAtomValue(staffElementsMapAtom);
  const [rootPaintNodeMap, setRootPaintNodeMap] = useAtom(rootPaintNodeMapAtom);
  const connectionMap = useAtomValue(connectionAtom);
  const uncommitedConnection = useAtomValue(uncommitedStaffConnectionAtom);
  const [caretStyle, setCaretStyle] = useAtom(caretStyleAtom);
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
  const rootObjs = useObjMapAtom(rootObjMapAtom);
  const staffs = useObjMapAtom(staffObjMapAtom);
  const scoreStaffMap = useAtomValue(scoreStaffMapAtom);

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
    const map = new Map<number, PaintNodeMap[RootPaintNodeType]>();
    for (const [id, obj] of rootObjs.map) {
      if (obj.type === "score") {
        const staffNodes =
          scoreStaffMap
            .get(id)
            ?.map((staffId) => staffs.get(staffId))
            .filter((v): v is StaffObject => !!v)
            .map((staffObj) =>
              createStaffNode({
                elements: elements.get(id) ?? [],
                staffObj,
                pointing,
              })
            )
            .flat() ?? [];
        map.set(id, createScoreNode(staffNodes, obj.position));
      } else if (obj.type === "text") {
        map.set(id, determineTextPaintStyle(obj));
      } else {
        map.set(id, determineFilePaintStyle(obj));
      }
    }
    // TODO connection
    // for (const [id, { position }] of rootObjs.map) {
    //   let toPos;
    //   if (uncommitedConnection?.from === id) {
    //     toPos = uncommitedConnection.position;
    //     const fromStyle = map
    //       .get(id)
    //       ?.find(
    //         (style): style is RootObjStyle =>
    //           style.type === "staff" ||
    //           style.type === "text" ||
    //           style.type === "file"
    //       );
    //     if (!fromStyle) {
    //       continue;
    //     }
    //     map.get(id)?.push(
    //       buildConnectionStyle({
    //         from: { position, width: fromStyle.width },
    //         to: { position: toPos },
    //       })
    //     );
    //   }
    //   const connections = connectionMap.get(id);
    //   if (connections === undefined) {
    //     continue;
    //   }
    //   for (const toId of connections) {
    //     const toPos = rootObjs.get(toId)?.position;
    //     if (!toPos) {
    //       continue;
    //     }
    //     const fromStyle = map
    //       .get(id)
    //       ?.find(
    //         (style): style is RootObjStyle =>
    //           style.type === "staff" ||
    //           style.type === "text" ||
    //           style.type === "file"
    //       );
    //     if (!fromStyle) {
    //       continue;
    //     }
    //     map.get(id)?.push(
    //       buildConnectionStyle({
    //         from: { position, width: fromStyle.width },
    //         to: { position: toPos, id: toId },
    //       })
    //     );
    //   }
    // }

    console.log("new style map", map);
    setRootPaintNodeMap(map);
  }, [rootObjs.map, connectionMap, uncommitedConnection, elements, pointing]);

  // caret style
  // useEffect(() => {
  //   const id = focus.objId;
  //   const nodes = paintNodeMap.get(id);
  //   if (!nodes) {
  //     return;
  //   }
  //   const caretStyles: CaretStyle[] = [];
  //   let cursor = 0;
  //   for (const style of nodes) {
  //     const {
  //       width,
  //       element: { type },
  //       caretOption,
  //       bbox: _bbox,
  //       index: elIdx,
  //     } = style;
  //     if (caretOption) {
  //       const height = _bbox.bottom - _bbox.top;
  //       const caret = determineCaretStyle({
  //         option: caretOption,
  //         elWidth: width,
  //         height,
  //         leftOfCaret: cursor,
  //       });
  //       caretStyles.push(caret);
  //     }
  //     if (
  //       type !== "score" &&
  //       type !== "staff" &&
  //       type !== "beam" &&
  //       type !== "tie"
  //     ) {
  //       cursor += width;
  //     }
  //   }
  //   setCaretStyle(caretStyles);
  // }, [paintNodeMap, focus]);

  // paint
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d")!;
    paint({
      ctx,
      canvasScale,
      mtx,
      rootNodes: rootPaintNodeMap.values().toArray().flat(),
    });
    // const obj = rootObjs.get(focus.rootObjId);
    // const caret = caretStyle.at(focus.idx);
    // if (obj && caret) {
    //   ctx.save();
    //   ctx.translate(obj.position.x, obj.position.y);
    //   paintCaret({ ctx, scale: 1, caret, highlighted: focusHighlighted });
    //   ctx.restore();
    // }
    // ctx.restore();
  }, [
    mtx,
    rootObjs,
    rootPaintNodeMap,
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
