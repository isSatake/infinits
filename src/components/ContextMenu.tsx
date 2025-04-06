import { clefPitches, clefs } from "@/core/types";
import { useChangeKeyPreviewHandlers } from "@/hooks/input";
import { useRootObjects } from "@/hooks/root-obj";
import { getAudioDurationSec } from "@/lib/file";
import { Point } from "@/lib/geometry";
import { contextMenuAtom, lastClefAtom } from "@/state/atom";
import { useAtom, useSetAtom } from "jotai";
import React, { FC, useCallback, useState } from "react";

export const ContextMenu = () => {
  const [popover, setPopover] = useAtom(contextMenuAtom);
  const onClose = useCallback(() => setPopover(undefined), []);

  return (
    <div className={"contextMenu"}>
      {popover?.type === "staff" && (
        <StaffContextMenu staffId={popover.staffId} onClose={onClose} />
      )}
      {popover?.type === "canvas" && (
        <CanvasContextMenu
          desktopPoint={popover.desktopPoint}
          onClose={onClose}
        />
      )}
    </div>
  );
};

const CanvasContextMenu: FC<{ desktopPoint: Point; onClose: () => void }> = ({
  desktopPoint,
  onClose,
}) => {
  const rootObjs = useRootObjects();
  const [mode, setMode] = useState<"default" | "text">("default");
  const [text, setText] = useState("");

  const onAddFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".mp3,.mp4";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      rootObjs.add({
        type: "file",
        file,
        position: desktopPoint,
        duration: await getAudioDurationSec(file),
      });
      onClose();
    };
    input.click();
  };

  const onSubmitText = (text: string) => {
    rootObjs.add({ type: "text", position: desktopPoint, text });
    setMode("default");
    onClose();
  };
  return (
    <>
      <div className="header">
        {mode === "default" && <button onClick={onClose}>Done</button>}
        {mode === "text" && (
          <>
            <button onClick={() => setMode("default")}>Cancel</button>
            <button onClick={() => onSubmitText(text)}>OK</button>
          </>
        )}
      </div>
      <div className="body">
        {mode === "default" && (
          <>
            <button onClick={() => setMode("text")}>Add Text</button>
            <button onClick={onAddFile}>Add File</button>
          </>
        )}
        {mode === "text" && (
          <Input
            placeholder="Add Text"
            value={text}
            onChange={setText}
            onEnter={onSubmitText}
          />
        )}
      </div>
    </>
  );
};

const Input: FC<{
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onEnter: (v: string) => void;
}> = ({ placeholder, value, onChange, onEnter }) => {
  return (
    <>
      <div className="inputContainer">
        <input
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (!e.nativeEvent.isComposing && e.key === "Enter") {
              onEnter(value);
            }
          }}
        />
      </div>
    </>
  );
};

const StaffContextMenu: FC<{ staffId: number; onClose: () => void }> = ({
  staffId,
  onClose,
}) => {
  const setLastClef = useSetAtom(lastClefAtom);
  const rootObjs = useRootObjects();
  const staff = rootObjs.get(staffId);
  const onClickDelete = () => {
    rootObjs.remove(staffId);
    onClose();
  };
  const onClickChangeClef = () => {
    if (staff?.type !== "staff") return;
    const { clef } = staff.staff;
    const nextClef =
      clefs[
        clefPitches[(clefPitches.indexOf(clef.pitch) + 1) % clefPitches.length]
      ];
    setLastClef(nextClef);
    rootObjs.update(staffId, (staff) => {
      if (staff.type !== "staff") return staff;
      return {
        ...staff,
        staff: { ...staff.staff, clef: nextClef },
      };
    });
  };
  return (
    <>
      <div className="header">
        <button onClick={onClose}>Done</button>
      </div>
      <div className="body">
        {staff?.type === "staff" && (
          <>
            <button {...useChangeKeyPreviewHandlers()}>Change Key</button>
            <button onClick={onClickChangeClef}>Change Clef</button>
          </>
        )}
        <button onClick={onClickDelete}>Delete</button>
      </div>
    </>
  );
};
