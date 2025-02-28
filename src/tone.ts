import { rootNotes } from "@/keyboard/Keyboard";
import {
  MusicalElement,
  Duration,
  Note,
  Rest,
  PitchAcc,
} from "@/org/notation/types";
import { Transport, Part, Sampler, start } from "tone";
import { Time, Frequency } from "tone/build/esm/core/type/Units";

export const play = async (elements: MusicalElement[], duration?: Duration) => {
  const arr: ({ time: Time } & MusicalElement)[] = [];
  let currentPPQ = 0;
  elements
    .filter((el): el is Note | Rest => el.type !== "bar")
    .forEach((el) => {
      arr.push({
        time: `${currentPPQ}i`,
        ...el,
        ...(duration ? { duration } : {}),
      });
      currentPPQ += (Transport.PPQ * 4) / el.duration;
    });
  const part = new Part<{ time: Time } & MusicalElement>((time, value) => {
    if (value.type === "note") {
      sampler.triggerAttackRelease(
        value.pitches.map(convert),
        `${value.duration}n`,
        time
      );
    }
  }, arr);
  await start();
  part.start();
  Transport.start();
};

const sampler = new Sampler({
  urls: {
    A0: "A0.mp3",
    C1: "C1.mp3",
    "D#1": "Ds1.mp3",
    "F#1": "Fs1.mp3",
    A1: "A1.mp3",
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
    C7: "C7.mp3",
    "D#7": "Ds7.mp3",
    "F#7": "Fs7.mp3",
    A7: "A7.mp3",
    C8: "C8.mp3",
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();

const accs = { sharp: "#", natural: "", flat: "b" };
const convert = (pa: PitchAcc): Frequency => {
  const { pitch, accidental } = pa;
  const oct = Math.floor(pitch / 7) + 4;
  const mod = pitch % rootNotes.length;
  const note =
    mod < 0 ? rootNotes.at(rootNotes.length + mod) : rootNotes.at(mod);
  if (!note) {
    throw new Error("invalid pitch");
  }
  const acc = accs[accidental ?? "natural"];
  return `${note}${acc}${oct}`;
};
