import { Clef } from "@/core/types";
import { BBoxSize, Point, Size } from "@/lib/geometry";
import { CaretOption } from "../types";

export type Caret = { elIdx: number; idx: number; defaultWidth?: boolean };
export type CaretLayout = { elIdx: number } & Point & Size;

export type Layout<T extends LayoutType> = {
  type: T;
  mtx: DOMMatrixReadOnly;
  bbs: BBoxSize;
  color?: string;
  caret?: CaretOption;
} & LayoutMap[T];

export type LayoutType = "staff" | "clef" | "gap";

type LayoutMap = {
  staff: {
    properties: { width: number };
    children: (Layout<"clef"> | Layout<"gap">)[];
  };
  clef: { properties: { clef: Clef }; children: never[] };
  gap: { children: never[] };
};
