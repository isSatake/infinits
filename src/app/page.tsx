"use client";

import { Keyboard } from "./Keyboard";
import { MainCanvas } from "./MainCanvas";

export default function Home() {
  return (
    <>
      <MainCanvas />
      <Keyboard />
      <canvas id="previewCanvas"></canvas>
    </>
  );
}
