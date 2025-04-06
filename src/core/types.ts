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
export type Tie = "begin" | "continue" | "end";

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

export const clefPitches = ["G", "F", "C"] as const;
export type Clef = {
  type: "clef";
  pitch: (typeof clefPitches)[number];
  keySigOffset: Pitch;
};
export const clefs: Record<(typeof clefPitches)[number], Clef> = {
  G: { type: "clef", pitch: "G", keySigOffset: 0 },
  C: { type: "clef", pitch: "C", keySigOffset: -7 },
  F: { type: "clef", pitch: "F", keySigOffset: -14 },
};

export type Staff = { type: "staff"; clef: Clef; keySignature: KeySignature };

export type KeySignature = {
  name: Key;
  root: {
    pitch: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    accidental?: Accidental;
  };
  acc: "sharp" | "flat";
  pitches: Pitch[];
};

export const keys = [
  "Db",
  "Ab",
  "Eb",
  "Bb",
  "F",
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
] as const;
export type Key = (typeof keys)[number];
export const keySignatures: Record<
  Key,
  {
    name: Key;
    root: { pitch: 0 | 1 | 2 | 3 | 4 | 5 | 6; accidental?: Accidental };
    acc: "sharp" | "flat";
    pitches: Pitch[];
  }
> = {
  C: { name: "C", root: { pitch: 0 }, acc: "sharp", pitches: [] },
  G: { name: "G", root: { pitch: 4 }, acc: "sharp", pitches: [10] },
  D: { name: "D", root: { pitch: 1 }, acc: "sharp", pitches: [10, 7] },
  A: { name: "A", root: { pitch: 5 }, acc: "sharp", pitches: [10, 7, 11] },
  E: { name: "E", root: { pitch: 2 }, acc: "sharp", pitches: [10, 7, 11, 8] },
  B: {
    name: "B",
    root: { pitch: 6 },
    acc: "sharp",
    pitches: [10, 7, 11, 8, 6],
  },
  "F#": {
    name: "F#",
    root: { pitch: 3, accidental: "sharp" },
    acc: "sharp",
    pitches: [10, 7, 11, 8, 6, 9],
  },
  F: { name: "F", root: { pitch: 3 }, acc: "flat", pitches: [6] },
  Bb: {
    name: "Bb",
    root: { pitch: 6, accidental: "flat" },
    acc: "flat",
    pitches: [6, 9],
  },
  Eb: {
    name: "Eb",
    root: { pitch: 2, accidental: "flat" },
    acc: "flat",
    pitches: [6, 9, 5],
  },
  Ab: {
    name: "Ab",
    root: { pitch: 5, accidental: "flat" },
    acc: "flat",
    pitches: [6, 9, 5, 8],
  },
  Db: {
    name: "Db",
    root: { pitch: 1, accidental: "flat" },
    acc: "flat",
    pitches: [6, 9, 5, 8, 4],
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
