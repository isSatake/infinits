import { measureText } from "@/lib/text";
import { FileObject } from "@/object";
import { FileStyle, PaintStyle } from "./types";
import { bStaffHeight } from "@/font/bravura";

export const determineFilePaintStyle = (
  obj: FileObject
): PaintStyle<FileStyle> => {
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
  const element: FileStyle = {
    type: "file",
    file: obj.file,
    fileName: {
      type: "text",
      txtPosition,
      text: fileName,
      offset: metrics.offset,
      width: metrics.width,
      height: metrics.height,
      ...font,
    },
    duration: obj.duration,
    width,
    height,
    icon: {
      type: "play",
      position: { x: 200, y: 300 },
      width: 300,
      height: 400,
    },
  };
  return {
    element,
    width,
    bbox: { left: 0, right: width, top: 0, bottom: height },
    caretOption: { index: 0 },
  };
};
