import { useAtom, useSetAtom, useAtomValue } from "jotai";
import React, { useRef, useEffect, useCallback } from "react";
import { caretAtom, popoverAtom, showDialogAtom, useStaffs } from "./atom";

export const ContextMenu = () => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useAtom(popoverAtom);
  const setShowDialog = useSetAtom(showDialogAtom);
  const caret = useAtomValue(caretAtom);
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
            staffs.remove(caret.staffId);
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
  }, [caret, staffs]);

  return (
    // @ts-ignore
    <div id="contextMenu" popover="manual" ref={popoverRef}>
      <button onClick={onClickDelete}>Delete</button>
    </div>
  );
};
