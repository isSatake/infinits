import React from "react";
import { useAtom } from "jotai";
import { showDialogAtom } from "./atom";
import { Dialog } from "./Dialog";

export const MainDialog = () => {
  const [dialog, setDialog] = useAtom(showDialogAtom);
  return (
    <Dialog
      className="mainDialog"
      open={!!dialog}
      onClose={() => setDialog(undefined)}
    >
      <div className="title">{dialog?.title}</div>
      <div className="buttons">
        {dialog?.buttons?.map((button, i) => (
          <button key={i} onClick={button.onClick}>
            {button.label}
          </button>
        ))}
      </div>
    </Dialog>
  );
};
