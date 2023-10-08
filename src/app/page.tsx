"use client";

import { Keyboard } from "./Keyboard";
import { MainCanvas } from "./MainCanvas";
import { PreviewCanvas } from "./PreviewCanvas";


export default function Home() {
  return (
    <>
      <MainCanvas />
      <Keyboard />
      {/* <PreviewCanvas /> */}
    </>
  );
}
