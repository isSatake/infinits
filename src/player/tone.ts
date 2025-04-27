import { Duration, KeySignature, MusicalElement, Note } from "@/core/types";
import {
  Part,
  Player,
  Sampler,
  ToneEventCallback,
  Transport,
  loaded,
  start,
} from "tone";
import { Subdivision, Time, TimeObject } from "tone/build/esm/core/type/Units";
import { FileStyle } from "../layout/types";
import { convert } from "./convert";

type CallBackElement =
  | { type: "file"; time: Time; el: File }
  | ({ type: "note"; time: Time; duration: Time; keySig: KeySignature } & Pick<
      Note,
      "pitches"
    >)
  | { type: "rest"; time: Time };
export type PlaySegment =
  | {
      type: "staff";
      rootObjId: number;
      keySig: KeySignature;
      elements: MusicalElement[];
    }
  | {
      type: "file";
      rootObjId: number;
      element: Pick<FileStyle, "file" | "duration">;
    };

// 複数パート対応
export const multiPlay = async (
  segmentsByPrevId: Map<number, PlaySegment[]>
) => {
  const parts: Part<CallBackElement>[] = [];
  // id -> ppq
  const ppqMap = new Map<number, number>();

  for (const [prevSegmentId, segments] of segmentsByPrevId) {
    const arr: CallBackElement[] = [];
    let currentPPQ = ppqMap.get(prevSegmentId) ?? 0;
    for (const segment of segments) {
      if (segment.type === "file") {
        arr.push({
          type: "file",
          time: `${currentPPQ}i`,
          el: segment.element.file,
        });
        currentPPQ += await calcPPQFromDurationSec(segment.element.duration);
        ppqMap.set(segment.rootObjId, currentPPQ);
      } else {
        let tiedDuration: TimeObject | undefined = undefined;
        let tiedPPQ = 0;
        for (const musicalElement of segment.elements) {
          if (musicalElement.type === "note") {
            if (musicalElement.tie) {
              const key: Subdivision = `${musicalElement.duration}n`;
              if (tiedDuration?.[key]) {
                tiedDuration[key] += 1;
              } else {
                tiedDuration = { ...(tiedDuration ?? {}), [key]: 1 };
              }
              tiedPPQ += (Transport.PPQ * 4) / musicalElement.duration;
              if (musicalElement.tie === "end") {
                arr.push({
                  type: "note",
                  time: `${currentPPQ}i`,
                  keySig: segment.keySig,
                  pitches: musicalElement.pitches,
                  duration: tiedDuration,
                });
                currentPPQ += tiedPPQ;
                tiedDuration = undefined;
                tiedPPQ = 0;
              }
              continue;
            }
            arr.push({
              type: "note",
              time: `${currentPPQ}i`,
              keySig: segment.keySig,
              pitches: musicalElement.pitches,
              duration: `${musicalElement.duration}n`,
            });
            currentPPQ += (Transport.PPQ * 4) / musicalElement.duration;
          } else if (musicalElement.type === "rest") {
            arr.push({
              type: "rest",
              time: `${currentPPQ}i`,
            });
            currentPPQ += (Transport.PPQ * 4) / musicalElement.duration;
          }
          ppqMap.set(segment.rootObjId, currentPPQ);
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

// keyboardしか参照していないので実質単音プレビュー
export const play = async (
  keySig: KeySignature,
  elements: (MusicalElement | FileStyle)[],
  duration?: Duration
) => {
  const arr: CallBackElement[] = [];
  let currentPPQ = 0;
  let tiedDuration: TimeObject | undefined = undefined;
  let tiedPPQ = 0;
  for (const el of elements) {
    if (el.type === "file") {
      arr.push({ type: "file", time: `${currentPPQ}i`, el: el.file });
      // FIXME: fileの再生時間からPPQを計算するべきか、他の方法があるのか
      currentPPQ += await calcPPQFromDurationSec(el.duration);
    } else if (el.type === "note") {
      if (el.tie) {
        const key: Subdivision = `${el.duration}n`;
        if (tiedDuration?.[key]) {
          tiedDuration[key] += 1;
        } else {
          tiedDuration = { ...(tiedDuration ?? {}), [key]: 1 };
        }
        tiedPPQ += (Transport.PPQ * 4) / el.duration;
        if (el.tie === "end") {
          arr.push({
            type: "note",
            time: `${currentPPQ}i`,
            keySig,
            pitches: el.pitches,
            duration: tiedDuration,
          });
          currentPPQ += tiedPPQ;
          tiedDuration = undefined;
          tiedPPQ = 0;
        }
        continue;
      }
      arr.push({
        type: "note",
        time: `${currentPPQ}i`,
        keySig,
        pitches: el.pitches,
        duration: `${duration ?? el.duration}n`,
      });
      currentPPQ += (Transport.PPQ * 4) / el.duration;
    } else if (el.type === "rest") {
      arr.push({ type: "rest", time: `${currentPPQ}i` });
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
    playFile(el.el);
  } else if (el.type === "note") {
    const { keySig } = el;
    sampler.triggerAttackRelease(
      el.pitches.map((v) => convert(keySig, v)),
      el.duration,
      time
    );
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
