import { MusicalElement } from "@/org/notation/types";
import { UNIT } from "./org/font/bravura";

export const kSampleElements: MusicalElement[] = [
  { type: "note", duration: 4, pitches: [{ pitch: 1 }], tie: "start" },
  { type: "note", duration: 4, pitches: [{ pitch: 1 }], tie: "stop" },
];

export const kDefaultStaffWidth = UNIT * 50;
