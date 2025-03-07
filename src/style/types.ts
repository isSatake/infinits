import { BBox, Point } from "../lib/geometry";
import {
  Accidental,
  Bar,
  Clef,
  Duration,
  Note,
  Rest,
  Staff,
} from "../core/types";

export type CaretStyle = { x: number; y: number; width: number; elIdx: number };
type OptionalColor = { color?: string };
export type PaintElement =
  | StaffStyle
  | StaffConnectionStyle
  | NoteStyle
  | RestStyle
  | BeamStyle
  | BarStyle
  | ClefStyle
  | GapStyle
  | TieStyle;
// 1音
export type NoteStyle = {
  type: "note";
  note: Note;
  elements: NoteStyleElement[];
} & OptionalColor;
// 1音に含まれる描画パーツ
export type NoteHeadElement = {
  type: "head";
  position: Point;
  duration: Duration;
  tie: Point;
};
export type NoteStyleElement =
  | NoteHeadElement
  | { type: "accidental"; position: Point; accidental: Accidental }
  | { type: "ledger"; position: Point; width: number }
  | {
      type: "flag";
      position: Point;
      duration: Duration;
      direction: "up" | "down";
    }
  | {
      type: "stem";
      position: Point;
      width: number;
      height: number;
    };
export type RestStyle = {
  type: "rest";
  rest: Rest;
  position: Point;
} & OptionalColor;
export type BarStyle = {
  type: "bar";
  bar: Bar;
  elements: BarStyleElement[];
} & OptionalColor;
export type BarStyleElement =
  | { type: "line"; position: Point; height: number; lineWidth: number }
  | { type: "dot"; position: Point };
export type BeamStyle = {
  type: "beam";
  nw: Point;
  ne: Point;
  sw: Point;
  se: Point;
} & OptionalColor;
export type ClefStyle = {
  // paintとの分担を考えるとposition持っとくほうがいいかもしれん
  type: "clef";
  clef: Clef;
} & OptionalColor;
export type GapStyle = { type: "gap" } & OptionalColor;
export type TieStyle = {
  type: "tie";
  position: Point;
  cpLow: Point; // 弧線の曲率が小さい方
  cpHigh: Point;
  end: Point;
} & OptionalColor;
export type StaffStyle = {
  type: "staff";
  staff: Staff;
  position: Point; // 左上
  lines: { y: number; width: number }[];
  width: { type: "auto" } | { type: "fixed"; value: number };
};
export type StaffConnectionStyle = {
  type: "staffConnection";
  to: Point;
  lines: { y: number; width: number }[];
};
export type Pointing = { index: number; type: PointingType };
type PointingType = "note" | "rest" | "bar" | "clef";
export type CaretOption = {
  index: number;
  defaultWidth?: boolean;
};
export type PaintElementStyle<T> = {
  element: T;
  width: number;
  bbox: BBox;
  index?: number;
  caretOption?: CaretOption;
};
