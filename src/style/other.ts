import { FileStyle, PaintElement, PaintStyle, TextStyle } from "./types";

export const determineObjPaintStyle = (
  obj: TextStyle | FileStyle
): PaintStyle<PaintElement> => {
  if (obj.type === "file") {
    return {
      element: obj,
      width: 0,
      bbox: { left: 0, right: obj.width, top: 0, bottom: obj.height },
    };
  }
  return {
    element: obj,
    width: 0, // 子要素をtranslateしながら描画するわけじゃないので0にしておく
    bbox: { left: 0, right: 1000, top: 0, bottom: 1000 },
  };
};
