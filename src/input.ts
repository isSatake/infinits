export type BeamModes = "beam" | "lock" | "nobeam";
export type TieModes = "tie" | "lock" | undefined;
export const kAccidentalModes = [undefined, "sharp", "natural", "flat"] as const;
export type AccidentalModes = typeof kAccidentalModes[number];
