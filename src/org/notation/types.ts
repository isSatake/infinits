export const durations = [1, 2, 4, 8, 16, 32] as const;
export type Duration = (typeof durations)[number];

// C4 (middleC) = 0
export type Pitch = number;

export const kAccidentals = ["sharp", "natural", "flat"] as const;
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

export const chordTypes = [
  "", // major
  "maj7", // major 7th
  "m", // minor
  "m7", // minor 7th
  "7", // dominant 7th
  "6", // major 6th
  "m6", // minor 6th
  "m(maj7)", // minor major 7th
  "dim", // diminished
  "°7", // diminished 7th
  "sus2", // suspended 2nd
  "sus4", // suspended 4th
  "aug", // augmented
] as const;
export type ChordType = (typeof chordTypes)[number];