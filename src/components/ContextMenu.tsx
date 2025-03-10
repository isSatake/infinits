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
            rootObjs.add({ type: "text", position: desktopPoint, text });
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
        rootObjs.add({ type: "file", position: desktopPoint, file });
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
