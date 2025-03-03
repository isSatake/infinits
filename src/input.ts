export const kAccidentalModes = [undefined, "sharp", "natural", "flat"] as const;
export type AccidentalModes = typeof kAccidentalModes[number];
