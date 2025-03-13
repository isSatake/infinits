import { UNIT } from "@/font/bravura";
import { Point } from "@/lib/geometry";
import { ConnectionStyle, PaintStyle, RootObj } from "./types";
import { genStaffLines } from "./staff-element";

export const buildConnectionStyle: (
  fromStyle: PaintStyle<RootObj>,
  to: Point,
  toId?: number
) => PaintStyle<ConnectionStyle> = (fromStyle, to, toId) => {
  const fromLines = genStaffLines(5);
  const fromPos = fromStyle.element.position;
  const toPoint: Point = {
    x: to.x - fromPos.x - fromStyle.width,
    y: to.y - fromPos.y,
  };
  const connectionStyle: PaintStyle<ConnectionStyle> = {
    element: {
      type: "connection",
      toId,
      position: {
        x: fromPos.x + fromStyle.width,
        y: fromPos.y,
      },
      to: toPoint,
      lines: fromLines,
    },
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
