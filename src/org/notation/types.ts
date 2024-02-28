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
