import { Point, Size } from "@/lib/geometry";
import { kDefaultCaretWidth } from "../score-preferences";
import { Caret, CaretLayout } from "./types";

export const layoutCaret = (p: {
  caret: Caret;
  // caret表示対象オブジェクトの楽譜座標系上の位置
  carettee: Point & Size;
}): CaretLayout => {
  const { caret, carettee } = p;
  const { elIdx, defaultWidth } = caret;
  const caretWidth = defaultWidth ? kDefaultCaretWidth : carettee.width;
  return {
    x: carettee.x + (defaultWidth ? carettee.width / 2 - caretWidth / 2 : 0),
    y: carettee.y,
    width: caretWidth,
    height: carettee.height,
    elIdx,
  };
};
