import { contextMenuAtom, showDialogAtom } from "@/state/atom";
import { useAtom, useSetAtom } from "jotai";
import React, { FC, useCallback } from "react";
import { Dialog } from "./Dialog";
import { useObjects } from "@/hooks/object";

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
      {popover?.type === "canvas" && <CanvasContextMenu />}
    </Dialog>
  );
};

const CanvasContextMenu = () => {
  return <button>Add Text</button>;
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
