import { useAtom, useSetAtom } from "jotai";
import React, { FC, useCallback, useEffect, useRef } from "react";
import { contextMenuAtom, showDialogAtom } from "@/state/atom";
import { useStaffs } from "@/hooks/staff";

export const ContextMenu = () => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useAtom(contextMenuAtom);
  const onClose = useCallback(() => setPopover(undefined), []);

  useEffect(() => {
    const el = popoverRef.current!;
    if (popover) {
      el.style.left = `${popover.htmlPoint.x}px`;
      el.style.top = `${popover.htmlPoint.y}px`;
      el.showPopover();
    } else {
      el.hidePopover();
    }
  }, [popover]);

  return (
    // @ts-ignore
    <div id="contextMenu" popover="manual" ref={popoverRef}>
      {popover?.type === "staff" && (
        <StaffContextMenu staffId={popover.staffId} onClose={onClose} />
      )}
      {popover?.type === "canvas" && <CanvasContextMenu />}
    </div>
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
