import { useObjects } from "@/hooks/object";
import { Point } from "@/lib/geometry";
import { contextMenuAtom, showDialogAtom } from "@/state/atom";
import { useAtom, useSetAtom } from "jotai";
import React, { FC, useCallback } from "react";
import { Dialog } from "./Dialog";

export const ContextMenu = () => {
  const [popover, setPopover] = useAtom(contextMenuAtom);
  const onClose = useCallback(() => setPopover(undefined), []);

  return (
    <Dialog
      className={"contextMenu"}
      open={!!popover}
      position={popover?.htmlPoint}
      onClose={onClose}
    >
      {popover?.type === "staff" && (
        <StaffContextMenu staffId={popover.staffId} onClose={onClose} />
      )}
      {popover?.type === "canvas" && (
        <CanvasContextMenu
          desktopPoint={popover.desktopPoint}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};

const CanvasContextMenu: FC<{ desktopPoint: Point; onClose: () => void }> = ({
  desktopPoint,
  onClose,
}) => {
  const setShowDialog = useSetAtom(showDialogAtom);
  const rootObjs = useObjects();
  const onAddText = () => {
    setShowDialog({
      type: "input",
      placeholder: "Add Text",
      buttons: [
        {
          label: "OK",
          onClick: (text: string) => {
            rootObjs.add({
              type: "text",
              position: desktopPoint,
              text,
              fontSize: 20,
              fontFamily: "sans-serif",
              baseline: "middle",
            });
            setShowDialog(undefined);
          },
        },
        {
          label: "Cancel",
          onClick: () => setShowDialog(undefined),
        },
      ],
    });
    onClose();
  };
  const onAddFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".mp3,.mp4";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const fontSize = 500;
        const fontFamily = "sans-serif";
        const txtPosition = { x: 700, y: 500 };
        const fileName =
          file.name.length > 10 ? file.name.slice(0, 10) + "..." : file.name;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        ctx.font = `${fontSize}px ${fontFamily}`;
        const txtWidth = ctx.measureText(fileName).width;
        canvas.remove();
        const width = Math.max(3000, txtPosition.x + txtWidth + 200);
        rootObjs.add({
          type: "file",
          file,
          position: desktopPoint,
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
            text: fileName,
            fontSize,
            fontFamily,
            baseline: "middle",
          },
        });
      }
    };
    input.click();
    onClose();
  };
  return (
    <>
      <button onClick={onAddText}>Add Text</button>
      <button onClick={onAddFile}>Add File</button>
    </>
  );
};

const StaffContextMenu: FC<{ staffId: number; onClose: () => void }> = ({
  staffId,
  onClose,
}) => {
  const setShowDialog = useSetAtom(showDialogAtom);
  const rootObjs = useObjects();

  const onClickDelete = () => {
    setShowDialog({
      type: "message",
      title: "Delete?",
      buttons: [
        {
          label: "OK",
          onClick: () => {
            rootObjs.remove(staffId);
            setShowDialog(undefined);
          },
        },
        {
          label: "Cancel",
          onClick: () => {
            setShowDialog(undefined);
          },
        },
      ],
    });
    onClose();
  };

  return <button onClick={onClickDelete}>Delete</button>;
};
