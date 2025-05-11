import { BBoxSize } from "@/lib/geometry";
import { CaretOption } from "../types";
import { Layout } from "./types";

export const layoutGap = (p: {
  mtx: DOMMatrix;
  width: number;
  height: number;
  caretOption?: CaretOption;
}): Layout<"gap"> => {
  const { mtx, width, height, caretOption } = p;
  return {
    type: "gap",
    mtx,
    bbs: new BBoxSize({ left: 0, top: 0, right: width, bottom: height }),
    caret: caretOption,
    children: [],
  };
};
