import { Clef } from "@/core/types";
import { ClefLayout } from "./types";
import { BBoxSize, getPathBBox, offsetBBox } from "@/lib/geometry";
import { UNIT } from "@/font/bravura";
import { getClefPath } from "../pitch";
import { Pointing } from "../types";
import { kPointingColor } from "./staff";

export const layoutClef = (p: {
  clef: Clef;
  mtx: DOMMatrix;
  pointing?: Pointing;
}): ClefLayout => {
  const { clef, mtx, pointing } = p;
  const { path, y } = getClefPath(clef);
  const bbox = getPathBBox(path, UNIT);
  return {
    type: "clef",
    clef,
    mtx: mtx.translate(0, y),
    bbs: new BBoxSize(bbox),
    ...(pointing ? { color: kPointingColor } : {}),
  };
};
