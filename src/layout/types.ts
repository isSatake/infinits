import { Accidental, Duration, Rest } from "../core/types";
import { BBox, Point, Size } from "../lib/geometry";

export type CaretStyle = { elIdx: number } & Point & Size;
export type RootObjStyle = TextStyle | FileStyle;
export type Pointing = { index: number; type: PointingType };
type PointingType = "note" | "rest" | "bar" | "clef";

export type PaintNode = PaintNodeMap[keyof PaintNodeMap];
export type PaintNodeMap = {
  [K in keyof StyleMap]: {
    type: K;
    style: StyleMap[K];
    width: number;
    height: number;
    bbox: BBox;
    mtx: DOMMatrix; // 親に対するtransform
    color?: string;
    index?: number;
    caretOption?: CaretOption;
  } & (ChildrenMap[K] extends never
    ? {}
    : { children: PaintNodeMap[ChildrenMap[K]][] });
};

export type CaretOption = { index: number };

export type StyleMap = {
  score: {};
  staff: {};
  connection: ConnectionStyle;
  note: { stemOffsetLeft: number };
  noteHead: NoteHeadStyle;
  accidental: AccidentalStyle;
  ledger: LedgerStyle;
  flag: FlagStyle;
  stem: {};
  rest: RestStyle;
  clef: {};
  bar: {};
  barLine: BarLineStyle;
  barDot: {};
  beam: BeamStyle;
  tie: TieStyle;
  gap: {};
  text: TextStyle;
  file: FileStyle;
  playIcon: {};
};

export type ChildrenMap = {
  score: "staff";
  staff: "note" | "rest" | "clef" | "bar" | "gap" | "tie" | "beam";
  connection: never;
  note: "noteHead" | "accidental" | "ledger" | "flag" | "stem";
  noteHead: never;
  accidental: never;
  ledger: never;
  flag: never;
  stem: never;
  rest: never;
  clef: never;
  bar: "barLine" | "barDot";
  barLine: never;
  barDot: never;
  beam: never;
  tie: never;
  gap: never;
  text: never;
  file: "text" | "playIcon";
  playIcon: never;
};

export type NoteHeadStyle = { duration: Duration; tie: Point };
export type AccidentalStyle = { accidental: Accidental };
export type LedgerStyle = { ledgerWidth: number };
export type FlagStyle = { duration: Duration; direction: "up" | "down" };
export type RestStyle = { rest: Rest };
export type BarLineStyle = { lineWidth: number };
export type ConnectionStyle = { toId?: number; position: Point; to: Point };
export type BeamStyle = { nw: Point; ne: Point; sw: Point; se: Point };
export type TieStyle = {
  cpLow: Point; // 弧線の曲率が小さい方
  cpHigh: Point;
  end: Point;
};
export type TextStyle = {
  text: string;
  textPosition: Point;
  fontSize: number;
  fontFamily: string;
  baseline: "middle" | "top";
  offset: Point;
};
export type FileStyle = { file: File; duration: number };
