import { useAtomValue } from "jotai";
import React, { useRef, useEffect } from "react";
import { showDialogAtom } from "./atom";

export const Dialog = () => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialog = useAtomValue(showDialogAtom);
  useEffect(() => {
    dialog ? dialogRef.current?.showModal() : dialogRef.current?.close();
  }, [dialog]);
  return (
    <dialog ref={dialogRef}>
      <div className="title">{dialog?.title}</div>
      <div className="buttons">
        {dialog?.buttons?.map((button, i) => (
          <button key={i} onClick={button.onClick}>
            {button.label}
          </button>
        ))}
      </div>
    </dialog>
  );
};
