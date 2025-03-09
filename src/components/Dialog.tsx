import { Point } from "@/lib/geometry";
import React, { FC, useEffect, useRef } from "react";

export const Dialog: FC<
  { open: boolean; position?: Point; onClose: () => void } & React.ComponentProps<"dialog">
> = ({ open, position, onClose, children, ...rest }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    open ? dialogRef.current?.showModal() : dialogRef.current?.close();
  }, [open]);
  useEffect(() => {
    // set position
    const dialog = dialogRef.current!;
    if (position) {
      dialog.style.margin = "0";
      dialog.style.left = `${position.x}px`;
      dialog.style.top = `${position.y}px`;
    } else {
      dialog.style.margin = "auto";
    }
  }, [position]);
  useEffect(() => {
    const dialog = dialogRef.current!;
    const close = () => {
      onClose();
    };
    dialog.addEventListener("close", close);
    return () => dialog.removeEventListener("close", close);
  }, [onClose]);
  return (
    <dialog ref={dialogRef} {...rest}>
      {children}
    </dialog>
  );
};
