"use client";

import { atom } from "jotai";
import { Keyboard } from "./Keyboard";
import { MainCanvas } from "./MainCanvas";
import { PreviewCanvas } from "./PreviewCanvas";
import { MusicalElement } from "@/org/notation/types";
import { kSampleElements } from "./constants";

const elementsAtom = atom<Map<number, MusicalElement[]>>(
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
