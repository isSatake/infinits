import { kAccidentals } from "./notation/types";

export type BeamModes = "beam" | "lock" | "nobeam";
export type TieModes = "tie" | "lock" | undefined;
export const kAccidentalModes = [undefined, ...kAccidentals] as const;
export type AccidentalModes = typeof kAccidentalModes[number];
