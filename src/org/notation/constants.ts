import { Accidental, Duration } from "./types";
import {
  bAccidentalFlat,
  bAccidentalNatural,
  bAccidentalSharp,
  bFlag16Down,
  bFlag16Up,
  bFlag32Down,
  bFlag32Up,
  bFlag8Down,
  bFlag8Up,
  bNoteHead,
  bNoteHeadHalf,
  bNoteHeadWhole,
  bRest1,
  bRest16,
  bRest2,
  bRest32,
  bRest4,
  bRest8,
  FlagDown,
  FlagUp,
  Path,
  RestPath,
  WIDTH_NOTE_HEAD_BLACK,
  WIDTH_NOTE_HEAD_WHOLE,
} from "../font/bravura";

export const upFlagMap = new Map<Duration, FlagUp>([
  [8, bFlag8Up],
  [16, bFlag16Up],
  [32, bFlag32Up],
]);

export const downFlagMap = new Map<Duration, FlagDown>([
  [8, bFlag8Down],
  [16, bFlag16Down],
  [32, bFlag32Down],
]);

export const restPathMap = new Map<Duration, RestPath>([
  [1, bRest1],
  [2, bRest2],
  [4, bRest4],
  [8, bRest8],
  [16, bRest16],
  [32, bRest32],
]);

export const accidentalPathMap = new Map<Accidental, Path>([
  ["sharp", bAccidentalSharp],
  ["natural", bAccidentalNatural],
  ["flat", bAccidentalFlat],
]);

export const numOfBeamsMap = new Map<Duration, number>([
  [8, 1],
  [16, 2],
  [32, 3],
]);

export const noteHeadByDuration = (duration: Duration): Path => {
  switch (duration) {
    case 1:
      return bNoteHeadWhole;
    case 2:
      return bNoteHeadHalf;
    default:
      return bNoteHead;
  }
};

export const noteHeadWidth = (duration: Duration): number => {
  if (duration === 1) {
    return WIDTH_NOTE_HEAD_WHOLE;
  }
  return WIDTH_NOTE_HEAD_BLACK;
};
