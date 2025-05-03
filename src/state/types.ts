import { MusicalElement, Duration, ChordRoot } from "@/core/types";
import { Point } from "@/lib/geometry";
import { StaffObject } from "@/object";

export type PreviewState = {
  canvasCenter: Point;
  staff: StaffObject;
  elements: MusicalElement[];
  insertedIndex: number;
  offsetted: boolean;
};
export type FocusState = { rootObjId: number; idx: number };
export type ContextMenu = {
  htmlPoint: Point;
} & (
  | { type: "staff"; staffId: number }
  | { type: "canvas"; desktopPoint: Point }
);
export type DialogState =
  | {
      type: "message";
      title: string;
      buttons: { label: string; onClick: () => void }[];
    }
  | {
      type: "input";
      placeholder: string;
      buttons: { label: string; onClick: (value: string) => void }[];
    };

export type ChordSelection = { duration: Duration; root?: ChordRoot };
export type NoteInputMode = "note" | "rest" | "chord";
export type BeamModes = "beam" | "nobeam";
export type TieModes = "tie" | "notie";
