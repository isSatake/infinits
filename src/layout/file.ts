import { bStaffHeight } from "@/font/bravura";
import { measureText } from "@/lib/text";
import { FileObject } from "@/object";
import { PaintNodeMap } from "./types";

export const determineFilePaintStyle = (
  obj: FileObject
): PaintNodeMap["file"] => {
  const fileName =
    obj.file.name.length > 10
      ? obj.file.name.slice(0, 10) + "..."
      : obj.file.name;
  const font = {
    fontSize: 500,
    fontFamily: "sans-serif",
    baseline: "middle" as const,
  };
  const metrics = measureText({ text: fileName, ...font });
  const txtPosition = { x: 700, y: bStaffHeight / 2 };
  const width = metrics.width + txtPosition.x * 2;
  const height = bStaffHeight;
  return {
    type: "file",
    style: {
      file: obj.file,
      duration: obj.duration,
    },
    width,
    height,
    bbox: { left: 0, right: width, top: 0, bottom: height },
    mtx: new DOMMatrix().translate(obj.position.x, obj.position.y),
    caretOption: { index: 0 },
    children: [
      {
        type: "playIcon",
        style: {},
        width: 300,
        height: 400,
        bbox: { left: 0, right: 300, top: 0, bottom: 400 },
        mtx: new DOMMatrix().translate(200, 300),
      },
      {
        type: "text",
        style: {
          text: fileName,
          textPosition: { x: 0, y: 0 },
          offset: metrics.offset,
          ...font,
        },
        width: metrics.width,
        height: metrics.height,
        bbox: { left: 0, right: metrics.width, top: 0, bottom: metrics.height },
        mtx: new DOMMatrix().translate(txtPosition.x, txtPosition.y),
      },
    ],
  };
};
