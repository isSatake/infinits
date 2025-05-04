import { BBoxSize } from "@/lib/geometry";
import { CaretOption } from "../types";
import { GapLayout } from "./types";

export const layoutGap = (p: {
  mtx: DOMMatrix;
  width: number;
  height: number;
  caretOption?: CaretOption;
}): GapLayout => {
  const { mtx, width, height, caretOption } = p;
  return {
    type: "gap",
    mtx,
    bbs: new BBoxSize({ left: 0, top: 0, right: width, bottom: height }),
    caretOption,
  };
};
