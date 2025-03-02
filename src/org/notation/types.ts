export const durations = [1, 2, 4, 8, 16, 32] as const;
export type Duration = (typeof durations)[number];

// 全音
// C4 (middleC) = 0
export type Pitch = number;

export const kAccidentals = [
  "sharp",
  "natural",
  "flat",
  "dSharp",
  "dFlat",
] as const;
export type Accidental = (typeof kAccidentals)[number];

export type PitchAcc = {
  pitch: Pitch;
  accidental?: Accidental;
};

export type Beam = "begin" | "continue" | "end";
export type Tie = "start" | "stop";

export type Note = {
  type: "note";
  duration: Duration;
  pitches: PitchAcc[]; // sort pitch by asc
  beam?: Beam;
  tie?: Tie;
};

export type Rest = {
  type: "rest";
  duration: Duration;
};

export type BarTypes = "single" | "double" | "final" | "repeat";
export type Bar = {
  type: "bar";
  subtype: BarTypes;
};

export type Repeat = {
  type: "repeat";
  subtype: "begin" | "end";
};

export type MusicalElement = Note | Rest | Bar;

export type Clef = {
  type: "clef";
  pitch: "g" | "f" | "c";
};

export type Staff = {
  type: "staff";
  clef: Clef;
  lineCount: number;
};

export type KeySignature = {
  root: {
    pitch: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    accidental?: Accidental;
  };
  acc: "sharp" | "flat";
  notes?: number[];
};

const keySignatures = {
  C: { root: { pitch: 0 }, acc: "sharp" },
  G: { root: { pitch: 4 }, acc: "sharp", notes: [3] },
  D: { root: { pitch: 1 }, acc: "sharp", notes: [0, 3] },
  A: { root: { pitch: 5 }, acc: "sharp", notes: [0, 3, 4] },
  E: { root: { pitch: 2 }, acc: "sharp", notes: [0, 1, 3, 4] },
  B: { root: { pitch: 6 }, acc: "sharp", notes: [0, 1, 3, 4, 6] },
  "F#": {
    root: { pitch: 3, accidental: "sharp" },
    acc: "sharp",
    notes: [0, 1, 2, 3, 4, 6],
  },
  F: { root: { pitch: 3 }, acc: "flat", notes: [6] },
  Bb: { root: { pitch: 6, accidental: "flat" }, acc: "flat", notes: [2, 6] },
  Eb: { root: { pitch: 2, accidental: "flat" }, acc: "flat", notes: [2, 5, 6] },
  Ab: {
    root: { pitch: 5, accidental: "flat" },
    acc: "flat",
    notes: [1, 2, 5, 6],
  },
  Db: {
    root: { pitch: 1, accidental: "flat" },
    acc: "flat",
    notes: [1, 2, 4, 5, 6],
  },
};

export const chordTypes = [
  "", // major
  "maj7", // major 7th
  "m", // minor
  "m7", // minor 7th
  "m7b5", // minor 7th flat 5th
  "7", // dominant 7th
] as const;
export type ChordType = (typeof chordTypes)[number];

export const rootNotes = ["C", "D", "E", "F", "G", "A", "B"] as const;
export type RootNote = (typeof rootNotes)[number];

export type ChordRoot = PitchAcc;
export type Chord = { root: ChordRoot; type: ChordType };
