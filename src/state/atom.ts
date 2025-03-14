import { ChordRoot, Duration, MusicalElement } from "@/core/types";
import { Point } from "@/lib/geometry";
import { CaretStyle, RootObj } from "@/style/types";
import { atom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { StaffStyle } from "../style/types";

// PreviewCanvasの表示
export type PreviewState = {
  canvasCenter: Point;
  staff: StaffStyle;
  elements: MusicalElement[];
  insertedIndex: number;
  offsetted: boolean;
};
export const previewAtom = atom<PreviewState | undefined>(undefined);

export type FocusState = { rootObjId: number; idx: number };
export const focusAtom = atom<FocusState>({ rootObjId: 0, idx: 0 });
export const useFocusHighlighted = (focus: FocusState): boolean => {
  const [highlighted, setHighlighted] = useState<boolean>(true);
  const blinkTimerRef = useRef<number | null>(null);
  useEffect(() => {
    setHighlighted(true);
    blinkTimerRef.current = window.setInterval(() => {
      setHighlighted((prev) => !prev);
    }, 800);
    return () => window.clearInterval(blinkTimerRef.current!);
  }, [focus]);
  return highlighted;
};

export const caretStyleAtom = atom<CaretStyle[]>([]);

// staff id -> elements
export const elementsAtom = atom<Map<number, MusicalElement[]>>(
  // @ts-ignore
  new Map(
    [
      [0, []],
      [
        2,
        [
          { type: "note", pitches: [{ pitch: 5 }], duration: 8 },
          { type: "note", pitches: [{ pitch: 7 }], duration: 8 },
        ],
      ],
      [
        3,
        [
          { type: "note", pitches: [{ pitch: 8 }], duration: 8 },
          { type: "rest", duration: 16 },
          { type: "note", pitches: [{ pitch: 8 }], duration: 8 },
          { type: "rest", duration: 16 },
          { type: "note", pitches: [{ pitch: 9 }], duration: 8 },
          { type: "note", pitches: [{ pitch: 9 }], duration: 4 },
          { type: "rest", duration: 8 },
          { type: "note", pitches: [{ pitch: 9 }], duration: 8 },
          { type: "bar", subtype: "single" },
          { type: "note", pitches: [{ pitch: 11 }], duration: 8 },
          { type: "note", pitches: [{ pitch: 12 }], duration: 8 },
          { type: "note", pitches: [{ pitch: 8 }], duration: 8 },
          { type: "note", pitches: [{ pitch: 7 }], duration: 8 },
          { type: "note", pitches: [{ pitch: 9 }], duration: 4 },
        ],
      ],
      [
        7,
        [
          {
            type: "note",
            pitches: [{ pitch: 5 }, { pitch: 7 }, { pitch: 9 }],
            duration: 2,
          },
          {
            type: "note",
            pitches: [{ pitch: 3 }, { pitch: 5 }, { pitch: 7 }],
            duration: 2,
          },
          {
            type: "note",
            pitches: [{ pitch: 4 }, { pitch: 6 }, { pitch: 8 }],
            duration: 2,
          },
          {
            type: "note",
            pitches: [{ pitch: 0 }, { pitch: 2 }, { pitch: 4 }],
            duration: 2,
          },
        ],
      ],
      [
        4,
        [
          { type: "note", pitches: [{ pitch: 9 }], duration: 4 },
          { type: "note", pitches: [{ pitch: 8 }], duration: 4 },
          { type: "note", pitches: [{ pitch: 7 }], duration: 4 },
          { type: "rest", duration: 8 },
          { type: "note", pitches: [{ pitch: 9 }], duration: 8 },
          { type: "bar", subtype: "single" },
          { type: "note", pitches: [{ pitch: 8 }], duration: 8 },
          { type: "rest", duration: 16 },
          { type: "note", pitches: [{ pitch: 7 }], duration: 8 },
          { type: "rest", duration: 16 },
          { type: "note", pitches: [{ pitch: 7 }], duration: 2 },
        ],
      ],
    ]
  )
);

export const connectionAtom = atom<Map<number, number[]>>(
  new Map([
    [0, [2]],
    [2, [3, 6]],
    [6, [7]],
    [1, [6, 4]],
  ])
);

export const uncommitedStaffConnectionAtom = atom<
  { from: number; position: Point } | undefined
>(undefined);

export type ContextMenu = {
  htmlPoint: Point;
} & (
  | { type: "staff"; staffId: number }
  | { type: "canvas"; desktopPoint: Point }
);
export const contextMenuAtom = atom<ContextMenu | undefined>(undefined);

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
export const showDialogAtom = atom<DialogState | undefined>(undefined);

export const accidentalModeIdxAtom = atom<number>(0);

export type ChordSelection = { duration: Duration; root?: ChordRoot };
export const chordSelectionAtom = atom<ChordSelection | undefined>(undefined);

export type NoteInputMode = "note" | "rest" | "chord";
export const noteInputModeAtom = atom<NoteInputMode>("note");

export type BeamModes = "beam" | "nobeam";
export const beamModeAtom = atom<BeamModes>("nobeam");

export type TieModes = "tie" | "notie";
export const tieModeAtom = atom<TieModes>("notie");

export const rootObjMapAtom = atom<Map<number, RootObj>>(
  // @ts-ignore
  new Map([
    [
      0,
      {
        type: "text",
        position: { x: 917.0914580293247, y: 7423.505842552799 },
        localPosition: { x: 500, y: 271 },
        text: "千本桜",
        fontSize: 500,
        fontFamily: "sans-serif",
        baseline: "top",
        offset: { x: -30, y: -23 },
        width: 2505,
        height: 1000,
      },
    ],
    [
      1,
      {
        type: "text",
        position: { x: 1737.2305856974544, y: 12350.273006102376 },
        localPosition: { x: 500, y: 302.5 },
        text: "Get Wild",
        fontSize: 500,
        fontFamily: "sans-serif",
        baseline: "top",
        offset: { x: -26, y: -49 },
        width: 3084.5,
        height: 1000,
      },
    ],
    [
      2,
      {
        type: "staff",
        staff: {
          type: "staff",
          clef: { type: "clef", pitch: "g" },
          lineCount: 5,
        },
        position: { x: 4511.9946680346875, y: 7794.176547889468 },
        width: { type: "auto" },
        lines: [
          { y: 0, width: 32.5 },
          { y: 250, width: 32.5 },
          { y: 500, width: 32.5 },
          { y: 750, width: 32.5 },
          { y: 1000, width: 32.5 },
        ],
      },
    ],
    [
      3,
      {
        type: "staff",
        staff: {
          type: "staff",
          clef: { type: "clef", pitch: "g" },
          lineCount: 5,
        },
        position: { x: 9316.358331767344, y: 6168.937771709636 },
        width: { type: "auto" },
        lines: [
          { y: 0, width: 32.5 },
          { y: 250, width: 32.5 },
          { y: 500, width: 32.5 },
          { y: 750, width: 32.5 },
          { y: 1000, width: 32.5 },
        ],
      },
    ],
    [
      4,
      {
        type: "staff",
        staff: {
          type: "staff",
          clef: { type: "clef", pitch: "g" },
          lineCount: 5,
        },
        position: { x: 9035.405268545122, y: 13526.996826960594 },
        width: { type: "auto" },
        lines: [
          { y: 0, width: 32.5 },
          { y: 250, width: 32.5 },
          { y: 500, width: 32.5 },
          { y: 750, width: 32.5 },
          { y: 1000, width: 32.5 },
        ],
      },
    ],
    [
      6,
      {
        type: "text",
        position: { x: 8831.595423694049, y: 9814.085365258383 },
        localPosition: { x: 500, y: 272.5 },
        text: "小室進行",
        fontSize: 500,
        fontFamily: "sans-serif",
        baseline: "top",
        offset: { x: -16.5, y: -21.5 },
        width: 2990.5,
        height: 1000,
      },
    ],
    [
      7,
      {
        type: "staff",
        staff: {
          type: "staff",
          clef: { type: "clef", pitch: "g" },
          lineCount: 5,
        },
        position: { x: 12881.086688592686, y: 9725.503895976455 },
        width: { type: "auto" },
        lines: [
          { y: 0, width: 32.5 },
          { y: 250, width: 32.5 },
          { y: 500, width: 32.5 },
          { y: 750, width: 32.5 },
          { y: 1000, width: 32.5 },
        ],
      },
    ],
  ])
);
