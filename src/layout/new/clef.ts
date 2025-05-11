import { Clef } from "@/core/types";
import { UNIT } from "@/font/bravura";
import { BBoxSize, getPathBBox } from "@/lib/geometry";
import { getClefPath } from "../pitch";
import { Pointing } from "../types";
import { kPointingColor } from "./staff";
import { Layout } from "./types";

export const layoutClef = (p: {
  clef: Clef;
  mtx: DOMMatrix;
  pointing?: Pointing;
}): Layout<"clef"> => {
  const { clef, mtx, pointing } = p;
  const { path, y } = getClefPath(clef);
  const bbox = getPathBBox(path, UNIT);
  return {
    type: "clef",
    properties: { clef },
    mtx: mtx.translate(0, y),
    bbs: new BBoxSize(bbox),
    ...(pointing ? { color: kPointingColor } : {}),
  };
};
