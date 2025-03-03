import React, { FC, useEffect, useRef } from "react";

export const Dialog: FC<
  { open: boolean; onClose: () => void } & React.ComponentProps<"dialog">
> = ({ open, onClose, children, ...rest }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    open ? dialogRef.current?.showModal() : dialogRef.current?.close();
  }, [open]);
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
