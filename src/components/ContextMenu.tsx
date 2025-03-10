import { contextMenuAtom, showDialogAtom } from "@/state/atom";
import { useAtom, useSetAtom } from "jotai";
import React, { FC, useCallback } from "react";
import { Dialog } from "./Dialog";
import { useObjects } from "@/hooks/object";
import { Point } from "@/lib/geometry";

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
  const onClick = () => {
    setShowDialog({
      title: "Add Text",
      buttons: [
        {
          label: "OK",
          onClick: () => {
            rootObjs.add({
              type: "text",
              position: desktopPoint,
              text: "Hello",
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
  return <button onClick={onClick}>Add Text</button>;
};

const StaffContextMenu: FC<{ staffId: number; onClose: () => void }> = ({
  staffId,
  onClose,
}) => {
  const setShowDialog = useSetAtom(showDialogAtom);
  const rootObjs = useObjects();

  const onClickDelete = () => {
    setShowDialog({
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
