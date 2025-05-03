import React, { FC, useEffect } from "react";
import { Keyboard } from "@/components/keyboard/Keyboard";
import { MainCanvas } from "./MainCanvas";
import { PreviewCanvas } from "./PreviewCanvas";
import { useAtomValue } from "jotai";
import { uiAtom } from "@/state/atom";
import { ContextMenu } from "./ContextMenu";

export const App: FC = () => {
  const preview = useAtomValue(uiAtom.preview);
  const contextMenu = useAtomValue(uiAtom.contextMenu);
  useEffect(() => {
    window.addEventListener("contextmenu", (e) => e.preventDefault());
  }, []);
  return (
    <div>
      <MainCanvas />
      {contextMenu ? <ContextMenu /> : <Keyboard />}
      {preview && <PreviewCanvas preview={preview} />}
    </div>
  );
};
