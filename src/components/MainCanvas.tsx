import { UNIT } from "@/font/bravura";
import { useResizeHandler } from "@/hooks/hooks";
import { useMainPointerHandler } from "@/hooks/main-canvas";
import { useRootObjects } from "@/hooks/root-obj";
import { determineFilePaintStyle } from "@/layout/file";
import { buildConnectionStyle } from "@/layout/staff";
import {
  determineCaretStyle,
  determineStaffPaintStyle,
} from "@/layout/staff-element";
import { determineTextPaintStyle } from "@/layout/text";
import {
  CaretStyle,
  PaintElement,
  PaintStyle,
  RootObjStyle,
  ScoreStyle,
  StaffStyle,
} from "@/layout/types";
import { determineCanvasScale, resizeCanvas } from "@/lib/canvas";
import { expandBBox, offsetBBox, scaleSize, Size } from "@/lib/geometry";
import { paintBBox, paintCaret, paintStyle, resetCanvas2 } from "@/paint/paint";
import {
  bboxAtom,
  caretStyleAtom,
  connectionAtom,
  elementsAtom,
  focusAtom,
  mtxAtom,
  paintStyleMapAtom,
  pointingAtom,
  uncommitedStaffConnectionAtom,
  useFocusHighlighted,
} from "@/state/atom";
import { useAtom, useAtomValue } from "jotai";
import React, { useCallback, useEffect, useRef, useState } from "react";

export const MainCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elements = useAtomValue(elementsAtom);
  const [styleMap, setStyleMap] = useAtom(paintStyleMapAtom);
  const connectionMap = useAtomValue(connectionAtom);
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
      if (obj.type === "score") {
        const staffStyles = obj.staffs
          .map((staffObj) =>
            determineStaffPaintStyle({
              elements: elements.get(id) ?? [],
              gapWidth: UNIT,
              staffObj,
              pointing,
            })
          )
          .flat();
        const scoreBBox = staffStyles
          .filter(
            (style): style is PaintStyle<StaffStyle> =>
              style.element.type === "staff"
          )
          .reduce((acc, v) => expandBBox(acc, v.bbox), {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          });
        const scoreStyle: PaintStyle<ScoreStyle> = {
          element: { type: "score" },
          width: scoreBBox.right - scoreBBox.left,
          bbox: scoreBBox,
        };
        map.set(id, [scoreStyle, ...staffStyles]);
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
      if (
        type !== "score" &&
        type !== "staff" &&
        type !== "beam" &&
        type !== "tie"
      ) {
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
        if (
          type !== "score" &&
          type !== "staff" &&
          type !== "beam" &&
          type !== "tie"
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
