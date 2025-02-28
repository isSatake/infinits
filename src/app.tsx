import React, { FC, useEffect } from "react";
import { Keyboard } from "./Keyboard";
import { MainCanvas } from "./MainCanvas";
import { PreviewCanvas } from "./PreviewCanvas";
import { useAtomValue } from "jotai";
import { previewAtom } from "./atom";
import { ContextMenu } from "./ContextMenu";
import { MainDialog } from "./MainDialog";

export const App: FC = () => {
  const preview = useAtomValue(previewAtom);
  useEffect(() => {
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }, []);
  return (
    <div>
      <MainCanvas />
      <Keyboard />
      {preview && <PreviewCanvas preview={preview} />}
      <ContextMenu />
      <MainDialog />
    </div>
  );
};
