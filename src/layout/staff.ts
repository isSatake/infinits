import { bStaffHeight } from "@/font/bravura";
import { Point } from "@/lib/geometry";
import { PaintNodeMap } from "./types";

export const createConnectionNode: (p: {
  from: { position: Point; width: number };
  to: { position: Point; id?: number };
}) => PaintNodeMap["connection"] = (p) => {
  const { from, to } = p;
  // fromObjPosからの相対座標
  const toPoint: Point = {
    x: to.position.x - from.position.x - from.width,
    y: to.position.y - from.position.y,
  };
  const bbox = {
    left: 0,
    top: Math.min(0, toPoint.y),
    right: toPoint.x,
    bottom: Math.max(
      bStaffHeight,
      to.position.y - from.position.y + bStaffHeight
    ),
  };
  return {
    type: "connection",
    style: {
      to: toPoint,
      toId: to.id,
    },
    width: bbox.right - bbox.left,
    height: bbox.bottom - bbox.top,
    bbox,
    mtx: new DOMMatrix().translate(
      from.position.x + from.width,
      from.position.y
    ),
  };
};
