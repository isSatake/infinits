import { bStaffHeight, UNIT } from "@/font/bravura";
import { Point } from "@/lib/geometry";
import { ConnectionStyle, PaintStyle } from "./types";
import { RootObj } from "@/object";

export const buildConnectionStyle: (
  fromStyle: PaintStyle<RootObj>,
  to: Point,
  toId?: number
) => PaintStyle<ConnectionStyle> = (fromStyle, to, toId) => {
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
    },
    width: 0, // 現状connectionの右に何か描画することはないので0にしておく
    bbox: {
      left: 0,
      top: Math.min(0, toPoint.y),
      right: toPoint.x,
      bottom: Math.max(bStaffHeight, to.y - fromPos.y + bStaffHeight),
    },
  };
  return connectionStyle;
};
