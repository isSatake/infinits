import { KeySignature, PitchAcc, rootNotes } from "@/core/types";
import * as Tone from "tone";
const accs = { sharp: "#", dSharp: "##", natural: "", flat: "b", dFlat: "bb" };

export const convert = (
  keySig: KeySignature,
  pa: PitchAcc
): Tone.Unit.Frequency => {
  const { pitch, accidental } = pa;
  const oct = Math.floor(pitch / 7) + 4;
  const mod = pitch % rootNotes.length;
  const note =
    mod < 0 ? rootNotes.at(rootNotes.length + mod) : rootNotes.at(mod);
  if (!note) {
    throw new Error("invalid pitch");
  }

  let acc = accs[accidental ?? "natural"];
  keySig.pitches.forEach((p) => {
    const interval = Math.abs(p - pitch);
    if (interval === 0 || interval % 7 === 0) {
      if (!accidental) {
        acc = accs[keySig.acc];
      }
    }
  });

  return `${note}${acc}${oct}`;
};
