"use client";

import { useEffect } from "react";
import { Keyboard } from "./Keyboard";
import { MainCanvas } from "./MainCanvas";
import { PreviewCanvas } from "./PreviewCanvas";
import { useAtomValue } from "jotai";
import { previewAtom } from "./atom";

export default function Home() {
  const preview = useAtomValue(previewAtom);
  useEffect(() => {
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }, []);
  return (
    <>
      <MainCanvas />
      <Keyboard />
      {preview && <PreviewCanvas preview={preview} />}
    </>
  );
}
