import {
  PaintElementStyle,
  PaintElement,
  TieStyle,
  NoteStyle,
  NoteHeadElement,
} from "./types";

export const insertTieStyles = (styles: PaintElementStyle<PaintElement>[]) => {
  const ret = [...styles];
  const ties: { index: number; style: PaintElementStyle<TieStyle> }[] = [];
  let _i = 0;
  while (_i < ret.length) {
    const style = ret[_i];
    if (
      style.element.type === "note" &&
      (style.element.note.tie === "begin" ||
        style.element.note.tie === "continue")
    ) {
      let distance = style.width;
      for (let j = _i + 1; j < ret.length; j++) {
        const _style = ret[j];
        if (
          _style.element.type === "note" &&
          (_style.element.note.tie === "end" ||
            _style.element.note.tie === "continue")
        ) {
          ret.splice(
            _i,
            0,
            determineTieStyle(style as PaintElementStyle<NoteStyle>, distance)
          );
          _i = j;
          break;
        } else {
          distance += _style.width;
        }
      }
    }
    _i++;
  }
  for (let { index, style } of ties) {
    ret.splice(index, 0, style);
  }
  return ret;
};

export const determineTieStyle = (
  start: PaintElementStyle<NoteStyle>,
  width: number
): PaintElementStyle<TieStyle> => {
  const startHead = start.element.elements.find(
    (e) => e.type === "head"
  ) as NoteHeadElement;
  return {
    element: {
      type: "tie",
      position: { ...startHead.tie, y: startHead.tie.y - 70 },
      cpLow: { x: width / 2, y: 120 },
      cpHigh: { x: width / 2, y: 180 },
      end: { x: width, y: 0 },
    },
    width,
    bbox: { left: 0, top: 0, right: 0, bottom: 0 },
  };
};
