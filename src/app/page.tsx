"use client";

import { atom } from "jotai";
import { Keyboard } from "./Keyboard";
import { MainCanvas } from "./MainCanvas";
import { PreviewCanvas } from "./PreviewCanvas";
import { MusicalElement } from "@/org/notation/types";
import { kSampleElements } from "./constants";
import { StaffStyle } from "@/org/score-states";

export const staffMapAtom = atom<Map<number, StaffStyle>>(
  new Map([[0, { clef: { type: "g" as const }, position: { x: 0, y: 0 } }]])
);
export const elementsAtom = atom<Map<number, MusicalElement[]>>(
  new Map([
    [0, kSampleElements],
    [1, kSampleElements],
  ])
);

export default function Home() {
  return (
    <>
      <MainCanvas />
      <Keyboard />
      <PreviewCanvas />
    </>
  );
}
