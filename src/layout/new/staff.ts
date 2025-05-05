import { MusicalElement } from "@/core/types";
import { StaffObject } from "@/object";
import { Pointing } from "../types";
import { StaffLayout } from "./types";
import { bStaffHeight } from "@/font/bravura";
import { layoutGap } from "./gap";
import { layoutClef } from "./clef";
import { BBoxSize, mergeBBoxes } from "@/lib/geometry";

export const kPointingColor = "#FF0000";

export const layoutStaff = (p: {
  elements: MusicalElement[];
  gapWidth: number;
  staffObj: StaffObject;
  pointing?: Pointing;
  gap?: { idx: number; width: number };
}): StaffLayout => {
  const { elements, gapWidth, staffObj, pointing: _pointing } = p;
  const pointing = _pointing?.index === -1 ? _pointing : undefined;
  const children: StaffLayout["children"] = [];
  let width = 0;
  let mtx = new DOMMatrix();
  const headGap = layoutGap({ mtx, width: gapWidth, height: bStaffHeight });
  children.push(headGap);
  width += headGap.bbs.width;
  mtx = mtx.translate(headGap.bbs.width, 0);
  const clef = layoutClef({ clef: staffObj.staff.clef, mtx, pointing });
  children.push(clef);
  width += clef.bbs.width;
  mtx = mtx.translate(clef.bbs.width, 0);
  const tailGap = layoutGap({ mtx, width: gapWidth, height: bStaffHeight });
  children.push(tailGap);
  width += tailGap.bbs.width;
  mtx = mtx.translate(tailGap.bbs.width, 0);
  return {
    type: "staff",
    width,
    children,
    bbs: new BBoxSize(mergeBBoxes(children.map(({ bbs }) => bbs))),
  };
};
