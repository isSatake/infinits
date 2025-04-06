import {
  Duration,
  KeySignature,
  MusicalElement,
  PitchAcc,
  rootNotes,
} from "@/core/types";
import {
  Part,
  Player,
  Sampler,
  ToneEventCallback,
  Transport,
  loaded,
  start,
} from "tone";
import { Frequency, Seconds, Time } from "tone/build/esm/core/type/Units";
import { FileStyle } from "../layout/types";
import { convert } from "./convert";

type CallBackElement =
  | {
      type: "musicalElement";
      time: Time;
      keySig: KeySignature;
      el: MusicalElement;
    }
  | { type: "file"; time: Time; el: FileStyle };
export type PlayFragment =
  | {
      type: "staff";
      rootObjId: number;
      keySig: KeySignature;
      elements: MusicalElement[];
    }
  | { type: "file"; rootObjId: number; element: FileStyle };

// 複数パート対応
export const multiPlay = async (
  fragments: Map<
    number, // prevId
    Map<
      number, // startId
      PlayFragment[]
    >
  >
) => {
  const parts: Part<CallBackElement>[] = [];
  // id -> ppq
  const ppqMap = new Map<number, number>();

  for (const [prevFragmentId, _elements] of fragments) {
    for (const [startId, elel] of _elements) {
      const arr: CallBackElement[] = [];
      let currentPPQ = ppqMap.get(prevFragmentId) ?? 0;
      for (const hoge of elel) {
        if (hoge.type === "file") {
          arr.push({
            type: "file",
            time: `${currentPPQ}i`,
            el: hoge.element,
          });
          currentPPQ += await calcPPQFromDurationSec(hoge.element.duration);
          ppqMap.set(hoge.rootObjId, currentPPQ);
        } else {
          for (const el of hoge.elements) {
            if (el.type !== "bar") {
              arr.push({
                type: "musicalElement",
                time: `${currentPPQ}i`,
                keySig: hoge.keySig,
                el: { ...el, duration: el.duration },
              });
              currentPPQ += (Transport.PPQ * 4) / el.duration;
            }
            ppqMap.set(hoge.rootObjId, currentPPQ);
          }
        }
      }
      const part = new Part<CallBackElement>(partCallback, arr);
      parts.push(part);
    }
  }
  await start();
  parts.forEach((part) => part.start());
  Transport.start();
};

export const play = async (
  keySig: KeySignature,
  elements: (MusicalElement | FileStyle)[],
  duration?: Duration
) => {
  const arr: CallBackElement[] = [];
  let currentPPQ = 0;
  for (const el of elements) {
    if (el.type === "file") {
      arr.push({ type: "file", time: `${currentPPQ}i`, el });
      // FIXME: fileの再生時間からPPQを計算するべきか、他の方法があるのか
      currentPPQ += await calcPPQFromDurationSec(el.duration);
    } else if (el.type !== "bar") {
      arr.push({
        type: "musicalElement",
        time: `${currentPPQ}i`,
        keySig,
        el: { ...el, duration: el.duration ?? duration },
      });
      currentPPQ += (Transport.PPQ * 4) / el.duration;
    }
  }
  const part = new Part<CallBackElement>(partCallback, arr);
  await start();
  part.start();
  Transport.start();
};

const partCallback: ToneEventCallback<CallBackElement> = (time, el) => {
  if (el.type === "file") {
    playFile(el.el.file);
  } else {
    const { keySig } = el;
    if (el.el.type === "note") {
      sampler.triggerAttackRelease(
        el.el.pitches.map((v) => convert(keySig, v)),
        `${el.el.duration}n`,
        time
      );
    }
  }
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

const playFile = async (file: File) => {
  const url = URL.createObjectURL(file);
  const player = new Player(url).toDestination();
  loaded()
    .then(() => player.start())
    .finally(() => URL.revokeObjectURL(url));
};

const calcPPQFromDurationSec = async (durationSec: number) => {
  const quarterNoteDuration = 60 / Transport.bpm.value; // 4分音符の長さ（秒）
  return Math.round((durationSec / quarterNoteDuration) * Transport.PPQ);
};
