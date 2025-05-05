import { Clef } from "@/core/types";
import { BBox, BBoxSize } from "@/lib/geometry";
import { CaretOption } from "../types";

export type StaffLayout = {
  type: "staff";
  // 五線そのものの幅。bboxとは異なる可能性がある
  width: number;
  children: StaffChildren[];
  mtx: DOMMatrix;
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
