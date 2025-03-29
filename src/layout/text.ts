import { measureText } from "@/lib/text";
import { TextObject } from "@/object";
import { PaintNodeMap } from "./types";

export const determineTextPaintStyle = (
  obj: TextObject
): PaintNodeMap["text"] => {
  const text = obj.text;
  const font = {
    fontSize: 500,
    fontFamily: "sans-serif",
    baseline: "top" as const,
  };
  const metrics = measureText({ text, ...font });
  const textPosition = { x: 500, y: 500 - metrics.height / 2 };
  const width = metrics.width + textPosition.x * 2;
  const height = metrics.height + textPosition.y * 2;
  return {
    type: "text",
    style: {
      text,
      textPosition,
      offset: metrics.offset,
      ...font,
    },
    width,
    height,
    bbox: { left: 0, right: width, top: 0, bottom: height },
    mtx: new DOMMatrix().translate(obj.position.x, obj.position.y),
    caretOption: { index: 0 },
  };
};
