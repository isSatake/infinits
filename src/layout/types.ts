import { BBox, Point, Size } from "../lib/geometry";
import {
  Accidental,
  Bar,
  Clef,
  Duration,
  Note,
  Rest,
  Staff,
} from "../core/types";

export type CaretStyle = { elIdx: number } & Point & Size;
type OptionalColor = { color?: string };
export type PaintElement =
  | StaffStyle
  | ConnectionStyle
  | NoteStyle
  | RestStyle
  | BeamStyle
  | BarStyle
  | ClefStyle
  | KeySigStyle
  | GapStyle
  | TieStyle
  | TextStyle
  | FileStyle;
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
export type StaffStyle = { type: "staff" };
export type KeySigStyle = {
  type: "keySignature";
  accs: { type: "sharp" | "flat"; position: Point }[];
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
export type RootObjStyle = StaffStyle | TextStyle | FileStyle;
export type ConnectionStyle = {
  type: "connection";
  toId?: number;
  position: Point;
  to: Point;
};
export type Pointing = { index: number; type: PointingType };
type PointingType = "note" | "rest" | "bar" | "clef";
export type CaretOption = {
  elIdx: number;
  idx: number;
  defaultWidth?: boolean;
};
export type PaintStyle<T> = {
  element: T;
  width: number;
  bbox: BBox;
  index?: number;
  caretOption?: CaretOption;
};
