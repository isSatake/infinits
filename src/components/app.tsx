import React, { FC, useEffect } from "react";
import { Keyboard } from "@/components/keyboard/Keyboard";
import { MainCanvas } from "./MainCanvas";
import { PreviewCanvas } from "./PreviewCanvas";
import { useAtomValue } from "jotai";
import { contextMenuAtom, previewAtom } from "@/state/atom";
import { ContextMenu } from "./ContextMenu";
import { MainDialog } from "./MainDialog";

export const App: FC = () => {
  const preview = useAtomValue(previewAtom);
  const contextMenu = useAtomValue(contextMenuAtom);
  useEffect(() => {
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }, []);
  return (
    <div>
      <MainCanvas />
      {contextMenu ? <ContextMenu /> : <Keyboard />}
      {preview && <PreviewCanvas preview={preview} />}
      <MainDialog />
    </div>
  );
};
