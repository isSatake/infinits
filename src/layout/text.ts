import { measureText } from "@/lib/text";
import { TextObject } from "@/object";
import { PaintStyle, TextStyle } from "./types";

export const determineTextPaintStyle = (
  obj: TextObject
): PaintStyle<TextStyle> => {
  const text = obj.text;
  const font = {
    fontSize: 500,
    fontFamily: "sans-serif",
    baseline: "top" as const,
  };
  const metrics = measureText({ text, ...font });
  const txtPosition = { x: 500, y: 500 - metrics.height / 2 };
  const width = metrics.width + txtPosition.x * 2;
  const height = metrics.height + txtPosition.y * 2;
  const element: TextStyle = {
    type: "text",
    txtPosition,
    text,
    offset: metrics.offset,
    width,
    height,
    ...font,
  };
  return {
    element: element,
    width,
    bbox: { left: 0, right: width, top: 0, bottom: height },
    mtx: new DOMMatrix().translate(obj.position.x, obj.position.y),
    caretOption: { index: 0 },
  };
};
