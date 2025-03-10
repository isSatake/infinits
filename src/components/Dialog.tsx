import { Point } from "@/lib/geometry";
import React, { FC, useEffect, useRef } from "react";

export const Dialog: FC<
  {
    open: boolean;
    position?: Point;
    closeOnOuterClick?: boolean;
    onClose: () => void;
  } & React.ComponentProps<"dialog">
> = ({
  open,
  position,
  closeOnOuterClick = true,
  onClose,
  children,
  ...rest
}) => {
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
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);
  const onClick = (e: React.MouseEvent) => {
    if (!closeOnOuterClick) return;
    const dialogRect = dialogRef.current!.getBoundingClientRect();
    const isInDialog =
      dialogRect.left <= e.clientX &&
      e.clientX <= dialogRect.right &&
      dialogRect.top <= e.clientY &&
      e.clientY <= dialogRect.bottom;
    if (!isInDialog) {
      onClose();
    }
  };
  return (
    <dialog onClick={onClick} ref={dialogRef} {...rest}>
      {children}
    </dialog>
  );
};
