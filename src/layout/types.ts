import { Accidental, Bar, Clef, Duration, Note, Rest } from "../core/types";
import { BBox, Point, Size } from "../lib/geometry";

export type CaretStyle = { elIdx: number } & Point & Size;
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
// export type NoteStyle = PaintStyle & {
//   type: "note";
//   note: Note;
//   children: NoteStyleChildren[];
// };
export type NoteStyle = PaintStyle2<
  { type: "note"; note: Note },
  NoteStyleChildren
>;
export type NoteHeadElement = { type: "head"; duration: Duration; tie: Point };
export type NoteStyleChildren = PaintStyle &
  (
    | NoteHeadElement
    | { type: "accidental"; accidental: Accidental }
    | { type: "ledger"; ledgerWidth: number }
    | {
        type: "flag";
        duration: Duration;
        direction: "up" | "down";
      }
    | { type: "stem"; lineWidth: number; height: number }
  );
export type RestStyle = PaintStyle & { type: "rest"; rest: Rest };
export type BarStyle = PaintStyle & {
  type: "bar";
  bar: Bar;
  children: BarStyleChildren[];
};
export type BarStyleChildren = PaintStyle &
  (
    | { type: "line"; position: Point; height: number; lineWidth: number }
    | { type: "dot"; position: Point }
  );
export type BeamStyle = PaintStyle & {
  type: "beam";
  nw: Point;
  ne: Point;
  sw: Point;
  se: Point;
};
export type ClefStyle = PaintStyle & {
  type: "clef";
  clef: Clef;
};
export type GapStyle = PaintStyle & { type: "gap" };
export type TieStyle = PaintStyle & {
  type: "tie";
  position: Point;
  cpLow: Point; // 弧線の曲率が小さい方
  cpHigh: Point;
  end: Point;
};
export type TextStyle = PaintStyle & {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  baseline: "middle" | "top";
  offset: Point;
};
export type ScoreStyle = PaintStyle & { type: "score"; children: StaffStyle[] };
export type StaffStyle = PaintStyle & {
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
export type FileStyle = PaintStyle & {
  type: "file";
  file: File;
  duration: number;
  children: (PlayIconStyle | TextStyle)[];
};
export type PlayIconStyle = PaintStyle & {
  type: "play";
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
export type PaintStyle = {
  width: number;
  height: number;
  bbox: BBox;
  mtx: DOMMatrix;
  color?: string;
  index?: number;
  caretOption?: CaretOption;
};

export type PaintStyle2<T, E, C = undefined> = {
  type: T;
  element: E;
  width: number;
  height: number;
  bbox: BBox;
  mtx: DOMMatrix;
  color?: string;
  index?: number;
  caretOption?: CaretOption;
  children?: C extends undefined ? never : PaintStyle2<C>[];
};
