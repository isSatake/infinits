import { Clef } from "@/core/types";
import { BBox, BBoxSize } from "@/lib/geometry";
import { CaretOption } from "../types";

export type StaffLayout = {
  type: "staff";
  width: number;
  children: StaffChildren[];
  bbs: BBoxSize;
};

type StaffChildren = ClefLayout | GapLayout;

export type ClefLayout = {
  type: "clef";
  clef: Clef;
  mtx: DOMMatrix;
  bbs: BBoxSize;
} & OptionalColor;

export type GapLayout = {
  type: "gap";
  mtx: DOMMatrix;
  bbs: BBoxSize;
  caretOption?: CaretOption;
};

type OptionalColor = { color?: string };
