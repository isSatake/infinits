import { UNIT } from "@/font/bravura";
import { PaintStyle, StaffConnectionStyle, StaffStyle } from "./types";
import { Point } from "@/lib/geometry";

export const buildConnectionStyle: (
  fromStyle: PaintStyle<StaffStyle>,
  to: Point
) => PaintStyle<StaffConnectionStyle> = (fromStyle, to) => {
  const fromStaff = fromStyle.element;
  const fromLines = fromStaff.lines;
  const fromPos = fromStaff.position;
  const toPoint: Point = {
    x: to.x - fromPos.x - fromStyle.width,
    y: to.y - fromPos.y,
  };
  const connectionStyle: PaintStyle<StaffConnectionStyle> = {
    element: { type: "staffConnection", to: toPoint, lines: fromLines },
    width: 0, // 現状connectionの右に何か描画することはないので0にしておく
    bbox: {
      left: 0,
      top: Math.min(0, toPoint.y),
      right: toPoint.x,
      bottom: Math.max(
        (fromLines.length - 1) * UNIT,
        to.y - fromPos.y + (fromLines.length - 1) * UNIT
      ),
    },
  };
  return connectionStyle;
};
