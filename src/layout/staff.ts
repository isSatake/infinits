import { bStaffHeight } from "@/font/bravura";
import { Point } from "@/lib/geometry";
import { ConnectionStyle, PaintStyle } from "./types";

export const buildConnectionStyle: (p: {
  from: { position: Point; width: number };
  to: { position: Point; id?: number };
}) => PaintStyle<ConnectionStyle> = (p) => {
  const { from, to } = p;
  // fromObjPosからの相対座標
  const toPoint: Point = {
    x: to.position.x - from.position.x - from.width,
    y: to.position.y - from.position.y,
  };
  const connectionStyle: PaintStyle<ConnectionStyle> = {
    element: {
      type: "connection",
      toId: to.id,
      position: { x: from.position.x + from.width, y: from.position.y },
      to: toPoint,
    },
    width: toPoint.x,
    bbox: {
      left: 0,
      top: Math.min(0, toPoint.y),
      right: toPoint.x,
      bottom: Math.max(
        bStaffHeight,
        to.position.y - from.position.y + bStaffHeight
      ),
    },
  };
  return connectionStyle;
};
