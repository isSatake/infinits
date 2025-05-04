import { MusicalElement } from "@/core/types";
import { StaffObject } from "@/object";
import { Pointing } from "../types";
import { StaffLayout } from "./types";
import { bStaffHeight } from "@/font/bravura";
import { layoutGap } from "./gap";

export const layoutStaff = (p: {
  elements: MusicalElement[];
  gapWidth: number;
  staffObj: StaffObject;
  pointing?: Pointing;
  gap?: { idx: number; width: number };
}): StaffLayout => {
  const { elements, gapWidth, staffObj, pointing } = p;
  const mtx = new DOMMatrix();
  const children: StaffLayout["children"] = [];
  children.push(layoutGap({ mtx, width: gapWidth, height: bStaffHeight }));
  // 次 clef
};
