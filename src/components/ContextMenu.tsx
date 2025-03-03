import { useAtom, useSetAtom } from "jotai";
import React, { useCallback, useEffect, useRef } from "react";
import { contextMenuAtom, showDialogAtom, useStaffs } from "@/state/atom";

export const ContextMenu = () => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useAtom(contextMenuAtom);
  const setShowDialog = useSetAtom(showDialogAtom);
  const staffs = useStaffs();

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

  const onClickDelete = useCallback(() => {
    setShowDialog({
      title: "Delete?",
      buttons: [
        {
          label: "OK",
          onClick: () => {
            staffs.remove(popover!.staffId);
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
    setPopover(undefined);
  }, [popover, staffs]);

  return (
    // @ts-ignore
    <div id="contextMenu" popover="manual" ref={popoverRef}>
      <button onClick={onClickDelete}>Delete</button>
    </div>
  );
};
