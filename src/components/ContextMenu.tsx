import { useAtom, useSetAtom } from "jotai";
import React, { FC, useCallback, useEffect, useRef } from "react";
import { contextMenuAtom, showDialogAtom } from "@/state/atom";
import { useStaffs } from "@/hooks/staff";
import { Dialog } from "./Dialog";

export const ContextMenu = () => {
  const [popover, setPopover] = useAtom(contextMenuAtom);
  const onClose = useCallback(() => setPopover(undefined), []);

  return (
    <Dialog className={"contextMenu"} open={!!popover} position={popover?.htmlPoint} onClose={onClose}>
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
  const staffs = useStaffs();

  const onClickDelete = () => {
    setShowDialog({
      title: "Delete?",
      buttons: [
        {
          label: "OK",
          onClick: () => {
            staffs.remove(staffId);
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
