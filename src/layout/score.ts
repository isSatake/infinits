import { expandBBoxes } from "@/lib/geometry";
import { PaintNodeMap } from "./types";

export const createScoreNode = (
  staffNodes: PaintNodeMap["staff"][],
  position: { x: number; y: number }
): PaintNodeMap["score"] => {
  const bbox = expandBBoxes(staffNodes.map(({ bbox }) => bbox));
  return {
    type: "score",
    style: {},
    width: bbox.right - bbox.left,
    height: bbox.bottom - bbox.top,
    bbox,
    mtx: new DOMMatrix().translate(position.x, position.y),
    children: staffNodes,
  };
};
