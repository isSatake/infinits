"use client";

import { useEffect } from "react";
import { Keyboard } from "./Keyboard";
import { MainCanvas } from "./MainCanvas";
import { PreviewCanvas } from "./PreviewCanvas";

export default function Home() {
  useEffect(() => {
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }, []);
  return (
    <>
      <MainCanvas />
      <Keyboard />
      {/* <PreviewCanvas /> */}
    </>
  );
}
