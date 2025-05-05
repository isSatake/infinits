import { Clef } from "@/core/types";
import { BBoxSize, Point, Size } from "@/lib/geometry";
import { CaretOption } from "../types";

export type StaffLayout = {
  type: "staff";
  // 五線そのものの幅。bboxとは異なる可能性がある
  width: number;
  children: StaffChildren[];
  mtx: DOMMatrixReadOnly;
  bbs: BBoxSize;
};

type StaffChildren = ClefLayout | GapLayout;

export type ClefLayout = {
  type: "clef";
  clef: Clef;
  mtx: DOMMatrixReadOnly;
  bbs: BBoxSize;
} & OptionalColor &
  OptionalCaret;

export type GapLayout = {
  type: "gap";
  mtx: DOMMatrixReadOnly;
  bbs: BBoxSize;
} & OptionalCaret;

type OptionalColor = { color?: string };
type OptionalCaret = { caret?: CaretOption };

export type Caret = { elIdx: number; idx: number; defaultWidth?: boolean };
export type CaretLayout = { elIdx: number } & Point & Size;
