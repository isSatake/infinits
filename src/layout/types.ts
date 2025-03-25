import { Accidental, Bar, Clef, Duration, Note, Rest } from "../core/types";
import { BBox, Point, Size } from "../lib/geometry";

export type CaretStyle = { elIdx: number } & Point & Size;
type OptionalColor = { color?: string };
export type PaintElement =
  | ScoreStyle
  | StaffStyle
  | ConnectionStyle
  | NoteStyle
  | RestStyle
  | BeamStyle
  | BarStyle
  | ClefStyle
  | GapStyle
  | TieStyle
  | TextStyle
  | FileStyle;
// 1音
export type NoteStyle = {
  type: "note";
  note: Note;
  children: NoteStyleChildren[];
} & OptionalColor;
// 1音に含まれる描画パーツ
export type NoteHeadElement = {
  type: "head";
  localTransform: DOMMatrix;
  duration: Duration;
  tie: Point;
};
export type NoteStyleChildren =
  | NoteHeadElement
  | { type: "accidental"; localTransform: DOMMatrix; accidental: Accidental }
  | { type: "ledger"; localTransform: DOMMatrix; width: number }
  | {
      type: "flag";
      localTransform: DOMMatrix;
      duration: Duration;
      direction: "up" | "down";
    }
  | {
      type: "stem";
      localTransform: DOMMatrix;
      width: number;
      height: number;
    };
export type RestStyle = {
  type: "rest";
  rest: Rest;
} & OptionalColor;
export type BarStyle = {
  type: "bar";
  bar: Bar;
  children: BarStyleChildren[];
} & OptionalColor;
export type BarStyleChildren =
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
export type TextStyle = {
  type: "text";
  txtPosition: Point;
  text: string;
  fontSize: number;
  fontFamily: string;
  baseline: "middle" | "top";
  width: number;
  height: number;
  offset: Point;
};
export type ScoreStyle = { type: "score"; children: StaffStyle[] };
export type StaffStyle = {
  type: "staff";
  children:
    | NoteStyle
    | RestStyle
    | ClefStyle
    | BarStyle
    | GapStyle
    | TieStyle
    | BeamStyle;
};
export type FileStyle = {
  type: "file";
  file: File;
  duration: number;
  icon: { type: "play"; position: Point; width: number; height: number };
  fileName: TextStyle;
  width: number;
  height: number;
};
export type RootObjStyle = ScoreStyle | TextStyle | FileStyle;
export type ConnectionStyle = {
  type: "connection";
  toId?: number;
  position: Point;
  to: Point;
};
export type Pointing = { index: number; type: PointingType };
type PointingType = "note" | "rest" | "bar" | "clef";
export type CaretOption = {
  index: number;
  defaultWidth?: boolean;
};
export type PaintStyle<T> = {
  element: T;
  width: number;
  bbox: BBox;
  mtx: DOMMatrix;
  index?: number;
  caretOption?: CaretOption;
};
