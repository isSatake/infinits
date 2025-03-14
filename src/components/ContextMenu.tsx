import { useObjects } from "@/hooks/object";
import { getAudioDurationSec } from "@/lib/file";
import { Point } from "@/lib/geometry";
import { measureText } from "@/lib/text";
import { contextMenuAtom } from "@/state/atom";
import { useAtom } from "jotai";
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
  const rootObjs = useObjects();
  const [mode, setMode] = useState<"default" | "text">("default");
  const [text, setText] = useState("");

  const onAddFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".mp3,.mp4";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const fontSize = 500;
      const fontFamily = "sans-serif";
      const txtPosition = { x: 700, y: 500 };
      const fileName =
        file.name.length > 10 ? file.name.slice(0, 10) + "..." : file.name;
      const txtMetrics = measureText({
        text: fileName,
        fontSize,
        fontFamily,
        baseline: "middle",
      });
      const width = Math.max(3000, txtPosition.x + txtMetrics.width + 200);
      rootObjs.add({
        type: "file",
        file,
        position: desktopPoint,
        duration: await getAudioDurationSec(file),
        width,
        height: 1000,
        icon: {
          type: "play",
          position: { x: 200, y: 300 },
          width: 300,
          height: 400,
        },
        fileName: {
          type: "text",
          position: txtPosition,
          localPosition: { x: 0, y: 0 },
          text: fileName,
          fontSize,
          fontFamily,
          baseline: "middle",
          ...txtMetrics,
        },
      });
      onClose();
    };
    input.click();
  };

  const onSubmitText = (text: string) => {
    const metrics = measureText({
      text,
      fontSize: 500,
      fontFamily: "sans-serif",
      baseline: "top",
    });
    const localPosition = { x: 500, y: 500 - metrics.height / 2 };
    rootObjs.add({
      type: "text",
      position: desktopPoint,
      localPosition,
      text,
      fontSize: 500,
      fontFamily: "sans-serif",
      baseline: "top",
      offset: metrics.offset,
      width: metrics.width + localPosition.x * 2,
      height: metrics.height + localPosition.y * 2,
    });
    setMode("default");
    onClose();
  };
  return (
    <>
      <div className="header">
        {mode === "default" && <button onClick={onClose}>Cancel</button>}
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
  const rootObjs = useObjects();
  const onClickDelete = () => {
    rootObjs.remove(staffId);
    onClose();
  };
  return (
    <>
      <div className="header">
        <button onClick={onClose}>Cancel</button>
      </div>
      <div className="body">
        <button onClick={onClickDelete}>Delete</button>
      </div>
    </>
  );
};
